#!/usr/bin/env bash
# RFC-001 §2.7 / BYPASS-001 / INFRA-001 — ferramenta canónica de pin de GitHub Actions.
#
# Converte `uses: owner/repo@tag` em `uses: owner/repo@<sha40> # tag`,
# resolvidos pela API OFICIAL do GitHub. Zero hardcode, zero alucinação.
#
# Uso:
#   scripts/pin-actions.sh [--check]
#     (padrão) — resolve as refs pendentes e reescreve os workflows em
#                `.github/workflows/` (.yml/.yaml), preservando indentação
#                e a cadeia de comentários `# tag # …` já existentes.
#     --check  — NUNCA reescreve e NUNCA resolve (sem rede): apenas emit
#                status por linha; exit 0 <=> toda linha pinável está
#                com sha de 40 hex.
#
# Deps: bash, curl, awk, find/coreutils. (Sem jq: extração JSON com awk.)
#       Opcional: `git ls-remote` como fallback de resolução para
#       tag/branch quando a REST API falha (rate limit / 403 / offline),
#       ativado por PIN_ACTIONS_FALLBACK_GIT=1. Nunca fabrica sha: só
#       grava sha com 40 hex vindo de fonte verificável.
#
# Política de pin (decisões registradas):
#   • `docker://…`  — linha SEMPRE intocada. Manifests de imagem são
#     pinados por digest OCI no registry (Dependabot/registry), fora do
#     escopo REST-API pin; o script não tenta resolvê-los (nem em modo
#     run, nem em --check) e não os conta como pendentes.
#   • `./…`         — action local do próprio repo; fora do escopo.
#   • 40-hex        — já pinada; intocada; reportada como `pinned`.
#   • 12..39-hex    — shorthand git detectável; --check reporta como
#     pendente de expansão; run-mode tenta expandir via API (o fallback
#     git não expande sha parcial).
#   • `# pin-skip`  — marcador inline de waiver auditado na linha: linha
#     sempre ignorada (nunca reescrita, nunca contada como pendente),
#     reportada como `waived`. Uso previsto pós-Dependabot PR #27 em
#     `.github/workflows/validate-ecosystem.yml` (ver ADR-008 D1).
#   • PIN_ACTIONS_SKIP — waiver por env: lista de globs `owner/repo@ref`
#     separados por vírgula/espaço (mesma semântica do marcador).
#   • Scan root: `.github/workflows/` (override p/ testes via
#     PIN_ACTIONS_ROOT).
#
# Correção v2 (INFRA-001 dead-on-arrival):
#   1. A transformação antiga era um `sed -E "s|…|\1…\2|"` cujo padrão
#      continha `([[:space:]]|$)` — o `|` colidia com o delimitador do
#      `s`, quebrando com `unknown option to 's'` em QUALQUER entrada.
#      A reescrita agora é feita em bash puro, reconstruindo a linha
#      a partir dos submatches do ERE (nenhum sed dinâmico → sem
#      colisão de delimitador, sem risco de injeção por combo
#      repo/ref com metacaracteres).
#   2. A extração antiga (`^[[:space:]]*uses:`) era cega à forma
#      list-item `- uses:` (~15 linhas do repo). O ERE agora casa
#      `uses:` em: list-item, mapping, flow `{ uses: … }` e mapping
#      flow `chave: { uses: … }`; linhas comentadas (`# uses:`) são
#      ignoradas.
set -euo pipefail

CHECK_ONLY=false
SHOW_HELP=false
for _arg in "$@"; do
  case "$_arg" in
    --check) CHECK_ONLY=true ;;
    -h | --help | help) SHOW_HELP=true ;;
    *)
      printf '::error::uso: %s [--check]\n' "$0" >&2
      exit 2
      ;;
  esac
done
if [[ "$SHOW_HELP" == "true" ]]; then
  printf 'uso: pin-actions.sh [--check]\n'
  printf '  (padrão) resolve e reescreve  |  --check valida sem rede e sem reescrever\n'
  exit 0
fi

ROOT="${PIN_ACTIONS_ROOT:-.github/workflows}"
if [[ ! -d "$ROOT" ]]; then
  printf '::error::pin-actions: root de workflows nao encontrado: %s\n' "$ROOT" >&2
  exit 2
fi

# Token opcional gh/REST (rate limit 60/h sem token; 1000/h com token).
AUTH_HEADER=()
if [[ -n "${GH_TOKEN:-}" ]]; then
  AUTH_HEADER=(-H "Authorization: Bearer ${GH_TOKEN}")
elif [[ -n "${GITHUB_TOKEN:-}" ]]; then
  AUTH_HEADER=(-H "Authorization: Bearer ${GITHUB_TOKEN}")
fi

# --- extração de json (sem jq) ---------------------------------------------
# FS="\"" decompõe {"sha": "<40hex>", …} → $i="sha", $(i+1)=": ", $(i+2)=hex.
AWK_SHA='
  BEGIN { FS = "\"" }
  {
    for (i = 1; i < NF; i++) {
      if ($i == "sha" && $(i+1) ~ /^[[:space:]]*:[[:space:]]*$/ && $(i+2) ~ /^[0-9a-fA-F]{40}$/) { print $(i+2); exit }
    }
  }
'
AWK_MSG='
  BEGIN { FS = "\"" }
  {
    for (i = 1; i < NF; i++) {
      if ($i == "message" && $(i+1) ~ /^[[:space:]]*:[[:space:]]*$/ && $(i+2) != "") { gsub(/[[:space:]]+$/, "", $(i+2)); print $(i+2); exit }
    }
  }
'

declare -A CACHE
FAILURES=0

# resolve_sha <owner/repo> <ref> → imprime sha40 (stdout) ou falha com ::error::.
resolve_sha() {
  local repo="$1" ref="$2" key="${1}@${2}"
  local resp="" body="" code="" sha="" lsout="" msg=""
  if [[ -n "${CACHE[$key]:-}" ]]; then
    printf '%s' "${CACHE[$key]}"
    return 0
  fi

  # 1) REST API oficial: GET /repos/{repo}/commits/{ref} → top-level .sha
  resp=$(curl -sS "${AUTH_HEADER[@]+"${AUTH_HEADER[@]}"}" \
    -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28" \
    --connect-timeout 5 --max-time 20 -w $'\n%{http_code}' \
    "https://api.github.com/repos/${repo}/commits/${ref}" 2>/dev/null) || true
  if [[ "$resp" == *$'\n'* ]]; then
    code="${resp##*$'\n'}"
    body="${resp%$'\n'*}"
  else
    code="000"
    body=""
  fi
  if [[ "$code" == "200" ]]; then
    sha=$(printf '%s' "$body" | awk "$AWK_SHA" | head -n1)
  fi

  # 2) fallback opt-in: git ls-remote (não chamado p/ refs hex — ls-remote
  #    não expande sha parcial, e 40-hex nunca passa por aqui).
  if [[ ! "$sha" =~ ^[0-9a-fA-F]{40}$ ]] \
    && [[ "${PIN_ACTIONS_FALLBACK_GIT:-0}" == "1" ]] \
    && [[ ! "$ref" =~ ^[0-9a-fA-F]+$ ]] \
    && command -v git >/dev/null 2>&1; then
    lsout=$(git ls-remote "https://github.com/${repo}.git" \
      "refs/tags/${ref}" "refs/tags/${ref}^{}" "refs/heads/${ref}" 2>/dev/null) || lsout=""
    if [[ -n "$lsout" ]]; then
      # tag anotada gera linha extra "…^{}" com o sha do COMMIT; preferir.
      sha=$(printf '%s\n' "$lsout" | awk -F'\t' 'substr($NF, length($NF)-2) == "^{}" { print $1; exit }')
      if [[ -z "$sha" ]]; then
        sha=$(printf '%s\n' "$lsout" | awk -F'\t' 'NR == 1 { print $1; exit }')
      fi
    fi
  fi

  # Nunca fabricar: só aceita 40 hex de fonte verificável.
  if [[ ! "$sha" =~ ^[0-9a-fA-F]{40}$ ]]; then
    msg=$(printf '%s' "$body" | awk "$AWK_MSG" | head -n1)
    if [[ -n "$msg" ]]; then
      printf '::error::pin-actions: falha ao resolver %s (HTTP %s): %s\n' "$key" "$code" "$msg" >&2
    else
      printf '::error::pin-actions: falha ao resolver %s (HTTP %s)\n' "$key" "$code" >&2
    fi
    return 1
  fi
  CACHE[$key]="$sha"
  printf '%s' "$sha"
}

# --- regex de detecção ------------------------------------------------------
# Chaves YAML são case-sensitive: só `uses:` lowercase (assim o GH usa).
# Suporta: list-item `- uses:`, mapping `  uses:`, flow `{ uses: … }`,
# flow-mapping `chave: { uses: … }`. Valor termina em whitespace, `,` ou
# `}` (flow). Comentários à direita (`# tag …`) ficam no sufixo.
# Limitação documentada: o scan é linha-a-linha (bloco multi-linha GE
# raro cujo conteúdo inicie com `- uses:`/`{ uses:` poderia casar).
RE_USES='^([[:space:]]*)(-[[:space:]]*)?(\{[[:space:]]*)?([A-Za-z0-9_.-]+[[:space:]]*:[[:space:]]*\{[[:space:]]*)?(uses:[[:space:]]*)([^[:space:]#,}]+)(.*)$'

PINNED=0
SHORTHAND=0
PENDING=0
WAIVED=0
SKIPPED=0
DOCKER=0
CHANGES=0
WORKFLOWS=$(LC_ALL=C find "$ROOT" -type f \( -name '*.yml' -o -name '*.yaml' \) 2>/dev/null | LC_ALL=C sort)

# rebuild_line <new_value> <src_ref> <prefix> <suffix> → linha reescrita.
# Regras: indentação/dash/brace 1:1 preservados; separador simples
# `uses: `; nunca espaçamento duplo na saída; comentário ` # <ref>`
# inserido somente quando o sufixo é vazio/comentário (NUNCA meio-de-flow
# `, … }`); refs hex (shorthand) não ganham comentário de tag; cadeia
# `# v7 # BYPASS-001` preservada em ordem.
rebuild_line() {
  local new_value="$1" src_ref="$2" line_prefix="$3" line_suffix="$4"
  local t_suffix="" rest="" newline=""
  t_suffix="$line_suffix"
  while [[ ${#t_suffix} -gt 0 && "${t_suffix:0:1}" == [[:space:]] ]]; do
    t_suffix="${t_suffix:1}"
  done
  if [[ -z "$t_suffix" || "$t_suffix" == \#* ]]; then
    if [[ -n "$t_suffix" ]]; then
      rest=" ${t_suffix}"
    else
      rest=""
    fi
    if [[ -n "$src_ref" && ! "$src_ref" =~ ^[0-9a-fA-F]+$ ]]; then
      newline="${line_prefix}uses: ${new_value} # ${src_ref}${rest}"
    else
      newline="${line_prefix}uses: ${new_value}${rest}"
    fi
  else
    # continuação de flow: reescreve só o valor, sem injetar comentário.
    newline="${line_prefix}uses: ${new_value}${line_suffix}"
  fi
  printf '%s' "$newline"
}

for wf in $WORKFLOWS; do
  [[ -f "$wf" && -r "$wf" ]] || continue
  mapfile -t ORIG_LINES < "$wf"
  num_lines=${#ORIG_LINES[@]}
  OUT_LINES=()
  file_changed=0
  file_changes=0

  for ((idx = 0; idx < num_lines; idx++)); do
    line="${ORIG_LINES[$idx]}"
    loc="${wf}:$((idx + 1))"

    # Linha inteiramente comentada: IGNORADA (não conta, não resolve,
    # não imprime status).
    if [[ "$line" =~ ^[[:space:]]*# ]]; then
      OUT_LINES+=("$line")
      continue
    fi

    if [[ ! "$line" =~ $RE_USES ]]; then
      OUT_LINES+=("$line")
      continue
    fi

    prefix="${BASH_REMATCH[1]}${BASH_REMATCH[2]}${BASH_REMATCH[3]}${BASH_REMATCH[4]}"
    value="${BASH_REMATCH[6]}"
    suffix="${BASH_REMATCH[7]}"

    # waiver inline `# pin-skip` (texto após o 1º `#` da linha).
    waive=0
    waive_reason=""
    if [[ "$line" == *'#'* ]]; then
      line_comment_part="${line#*#}"
      if [[ "$line_comment_part" =~ (^|[[:space:]])pin-skip([[:space:]]|$) ]]; then
        waive=1
        waive_reason="marcador inline pin-skip"
      fi
    fi
    # waiver por env: globs `owner/repo@ref` separados por vírgula/espaço.
    if [[ "$waive" -eq 0 && -n "${PIN_ACTIONS_SKIP:-}" ]]; then
      IFS=', ' read -r -a SKIP_PATTERNS <<< "${PIN_ACTIONS_SKIP}"
      for skip_pattern in "${SKIP_PATTERNS[@]}"; do
        [[ -n "$skip_pattern" ]] || continue
        if [[ "$value" == $skip_pattern ]]; then
          waive=1
          waive_reason="PIN_ACTIONS_SKIP (${skip_pattern})"
          break
        fi
      done
    fi

    if [[ "$value" == 'docker://'* ]]; then
      DOCKER=$((DOCKER + 1))
      SKIPPED=$((SKIPPED + 1))
      OUT_LINES+=("$line")
      printf '  ○ %s policy-skip docker:// (manifest pinado por digest OCI; intocado)\n' "$loc"
      continue
    fi

    if [[ "$value" == '.'* ]]; then
      SKIPPED=$((SKIPPED + 1))
      OUT_LINES+=("$line")
      printf '  ○ %s policy-skip ação-local (%s)\n' "$loc" "$value"
      continue
    fi

    repo="${value%@*}"
    if [[ "$value" == *'@'* ]]; then
      ref="${value##*@}"
    else
      ref=""
    fi

    if [[ "$ref" =~ ^[0-9a-fA-F]{40}$ ]]; then
      PINNED=$((PINNED + 1))
      OUT_LINES+=("$line")
      printf '  ✓ %s pinned (%s @%s…)\n' "$loc" "$repo" "${ref:0:7}"
      continue
    fi

    if [[ "$waive" -eq 1 ]]; then
      WAIVED=$((WAIVED + 1))
      OUT_LINES+=("$line")
      printf '  ⊘ %s waived — %s (%s@%s intocada; não conta como pendente)\n' "$loc" "$waive_reason" "$repo" "${ref:-<sem-ref>}"
      continue
    fi

    if [[ "$ref" =~ ^[0-9a-fA-F]{12,39}$ ]]; then
      # shorthand: pendente de expansão para sha40.
      if $CHECK_ONLY; then
        SHORTHAND=$((SHORTHAND + 1))
        OUT_LINES+=("$line")
        printf '  △ %s shorthand %s-hex (%s…) — pendente de expansão p/ 40 hex\n' "$loc" "${#ref}" "${ref:0:7}"
        continue
      fi
      if sha="$(resolve_sha "$repo" "$ref")"; then
        newline="$(rebuild_line "${repo}@${sha}" "$ref" "$prefix" "$suffix")"
        PENDING=$((PENDING + 1))
        CHANGES=$((CHANGES + 1))
        file_changes=$((file_changes + 1))
        file_changed=1
        OUT_LINES+=("$newline")
        printf '  ✎ %s expandido %s@%s… → @%s…\n' "$loc" "$repo" "${ref:0:7}" "${sha:0:7}"
      else
        FAILURES=$((FAILURES + 1))
        OUT_LINES+=("$line")
        printf '  ✗ %s falha resolve shorthand %s@%s… (linha mantida; sem sha fabricado)\n' "$loc" "$repo" "${ref:0:7}"
      fi
      continue
    fi

    # tag/branch/ref genérica — pendente por definição.
    if $CHECK_ONLY; then
      PENDING=$((PENDING + 1))
      OUT_LINES+=("$line")
      printf '  → %s pendente — %s@%s (BYPASS-001 aberto; --check não resolve)\n' "$loc" "$repo" "${ref:-<sem-ref>}"
      continue
    fi

    if sha="$(resolve_sha "$repo" "${ref:-HEAD}")"; then
      newline="$(rebuild_line "${repo}@${sha}" "$ref" "$prefix" "$suffix")"
      PENDING=$((PENDING + 1))
      CHANGES=$((CHANGES + 1))
      file_changes=$((file_changes + 1))
      file_changed=1
      OUT_LINES+=("$newline")
      printf '  ✎ %s pinado %s@%s → @%s…\n' "$loc" "$repo" "${ref:-<sem-ref>}" "${sha:0:7}"
    else
      FAILURES=$((FAILURES + 1))
      OUT_LINES+=("$line")
      printf '  ✗ %s falha resolve %s@%s (linha mantida; sem sha fabricado)\n' "$loc" "$repo" "${ref:-<sem-ref>}"
    fi
  done

  if [[ "$CHECK_ONLY" == "false" && "$file_changed" -eq 1 ]]; then
    wf_tmp=$(mktemp "${wf}.pin-tmp.XXXXXX")
    if [[ ${#OUT_LINES[@]} -eq 0 ]]; then
      : > "$wf_tmp"
    elif printf '%s\n' "${OUT_LINES[@]}" > "$wf_tmp"; then
      :
    fi
    wf_mode=$(stat -c '%a' "$wf")
    chmod "$wf_mode" "$wf_tmp"
    if ! mv "$wf_tmp" "$wf"; then
      rm -f "$wf_tmp"
      FAILURES=$((FAILURES + 1))
      printf '::error::pin-actions: falha ao gravar %s\n' "$wf" >&2
    else
      printf '  ↺ %s reescrito (%s linha(s) atualizadas)\n' "$wf" "$file_changes"
    fi
  fi
done

TOTAL_PENDING=$((PENDING + SHORTHAND))
echo ""
printf 'pin-actions: pinned=%d shorthand=%d pendentes=%d waived=%d policy-skip=%d (docker=%d) falhas=%d\n' \
  "$PINNED" "$SHORTHAND" "$PENDING" "$WAIVED" "$SKIPPED" "$DOCKER" "$FAILURES"

if [[ "$FAILURES" -gt 0 ]]; then
  printf '::error::pin-actions: %d resolucao(oes) falharam — nenhuma linha foi reescrita com sha fabricado\n' "$FAILURES" >&2
  exit 1
fi

if [[ "$CHECK_ONLY" == "true" ]]; then
  if [[ "$TOTAL_PENDING" -gt 0 ]]; then
    printf '::error::INFRA-001 pendente: %d action(s) sem pin de 40 hex — exit 1 é CORRETO enquanto houver ref sem sha\n' "$TOTAL_PENDING" >&2
    exit 1
  fi
  printf '✓ pin-actions (--check): todas as ações pináveis estão com sha de 40 hex (docker:// por política: %d intocadas; waivers: %d)\n' "$DOCKER" "$WAIVED"
  exit 0
fi

printf '✓ pin-actions: %d pin(s) aplicado(s) neste run\n' "$CHANGES"
exit 0
