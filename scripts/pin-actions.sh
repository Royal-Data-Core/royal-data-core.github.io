#!/usr/bin/env bash
# RFC-001 §2.7 / BYPASS-001 / INFRA-001
# Converte `uses: owner/repo@tag` em `uses: owner/repo@<sha40>  # tag`
# resolvidos pela API OFICIAL do GitHub. Zero hardcode, zero alucinacao.
#
# Uso:  ./scripts/pin-actions.sh [--check]
# Deps: curl, jq, GH_TOKEN (opcional; sem token o rate limit e 60 req/h)
set -euo pipefail

CHECK_ONLY=false
[[ "${1:-}" == "--check" ]] && CHECK_ONLY=true

WORKFLOWS=$(find .github/workflows -name '*.yml' -o -name '*.yaml' | sort)
AUTH_HEADER=()
[[ -n "${GH_TOKEN:-}" ]] && AUTH_HEADER=(-H "Authorization: Bearer ${GH_TOKEN}")

declare -A CACHE
FAILURES=0
CHANGES=0

resolve_sha() {
  local repo="$1" ref="$2" key="$repo@$ref"
  if [[ -n "${CACHE[$key]:-}" ]]; then echo "${CACHE[$key]}"; return 0; fi
  local sha
  sha=$(curl -fsSL "${AUTH_HEADER[@]}" \
        -H "Accept: application/vnd.github+json" \
        "https://api.github.com/repos/${repo}/commits/${ref}" \
        | jq -r '.sha // empty') || sha=""
  if [[ -z "$sha" || ${#sha} -ne 40 ]]; then
    echo "::error::nao foi possivel resolver ${key}" >&2
    return 1
  fi
  CACHE[$key]="$sha"
  echo "$sha"
}

for wf in $WORKFLOWS; do
  TMP="$(mktemp)"
  cp "$wf" "$TMP"
  while IFS= read -r line; do
    # extrai "uses: owner/repo@ref"
    uses=$(echo "$line" | sed -nE 's/^[[:space:]]*uses:[[:space:]]*([^[:space:]]+).*/\1/p')
    [[ -z "$uses" ]] && continue
    [[ "$uses" == ./* ]] && continue                 # action local
    repo="${uses%@*}"
    ref="${uses##*@}"
    [[ "$ref" == "$uses" ]] && continue
    if [[ ${#ref} -eq 40 ]]; then
      echo "  ✓ $wf : ${repo}@${ref:0:7} ja pinado"
      continue
    fi
    sha=$(resolve_sha "$repo" "$ref") || { FAILURES=$((FAILURES+1)); continue; }
    if $CHECK_ONLY; then
      echo "  ⚠ $wf : ${repo}@${ref} → deveria ser @${sha:0:12}… (BYPASS-001 aberto)"
      CHANGES=$((CHANGES+1))
    else
      # substitui preservando indentacao e adicionando a tag como comentario
      sed -i -E "s|(uses:[[:space:]]*)${repo//\//\\/}@${ref//./\\.}([[:space:]]|$)|\1${repo}@${sha}  # ${ref}\2|" "$TMP"
      echo "  ✎ $wf : ${repo}@${ref} → @${sha:0:12}…"
      CHANGES=$((CHANGES+1))
    fi
  done < "$wf"

  if ! $CHECK_ONLY && [[ $CHANGES -gt 0 ]]; then
    if ! diff -q "$wf" "$TMP" >/dev/null; then mv "$TMP" "$wf"; else rm -f "$TMP"; fi
  else
    rm -f "$TMP"
  fi
done

echo ""
if [[ $FAILURES -gt 0 ]]; then
  echo "::error::pin-actions: ${FAILURES} resolucao(oes) falharam"
  exit 1
fi
if $CHECK_ONLY && [[ $CHANGES -gt 0 ]]; then
  echo "INFRA-001 pendente: ${CHANGES} action(oes) ainda por tag"
  exit 1
fi
echo "✓ pin-actions: todas as actions resolvidas (${CHANGES} alteracao(oes))"
