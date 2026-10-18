# RFC-001 — Pipeline CI/CD SDD no GitHub Actions

**ID:** RFC-001 · **Versão:** 1.0.0 · **Status:** ACCEPTED · **Agente:** `devops-platform` · **Auditor:** `spec-auditor`

## 1. Motivation
O projeto é um piloto deliberadamente mutável (premissa do cliente). Sem pipeline determinístico, cada refactor arquitetural introduz regressão silenciosa em performance, acessibilidade, segurança ou links — exatamente as quatro dimensões que a empresa vende como competência. O pipeline **é** o produto de demonstração (Superfície S3 de `SDD-CONTEXT §2`).

Restrições: custo R$ 0,00 (`§C2`); GitHub Pages não tem backend (`§C1`); budgets rígidos (`§C10`); supply-chain hardening (contrato `devops-platform`).

## 2. Technical Design

### 2.1 Topologia de branches
| Branch | Propósito | Proteção | Deploy |
|---|---|---|---|
| `main` | Produção | PR obrigatório, ≥1 aprovação, CI verde, linear history, force-push bloqueado, deletion bloqueado | ✅ `deploy.yml` |
| `develop` | Integração/staging | PR obrigatório, CI verde | ❌ (artifact de preview apenas) |
| `feature/SPEC-NNN-*` | Trabalho de spec | — | ❌ |
| `hotfix/*` | Correção urgente em prod | PR obrigatório, CI verde | ✅ após merge em `main` |
| `chore/*` | Tooling, docs, deps | PR obrigatório, CI verde | ❌ |

Branch protection é **gratuito em repositórios públicos** no GitHub Free (F-15) — confirmado viável.

`develop` é mergeado em `main` via PR ("release PR"). `deploy.yml` **re-executa todos os gates** sobre `main` — não confia no verde de `develop` (defesa em profundidade; custo marginal nulo em repo público).

### 2.2 DAG de jobs

```
ci.yml  (on: pull_request → main|develop ; push → develop ; workflow_dispatch)
┌──────────┐   ┌────────┐   ┌──────────┐   ┌────────────┐
│  guard   │──▶│ build  │──▶│  verify  │──▶│ lighthouse │
└──────────┘   └────────┘   └──────────┘   └────────────┘
  lint/AST       npm ci       e2e+a11y        LHCI budgets
  bundle audit   astro build  linkinator      2 viewports
  adr-gate       pagefind     vitest+cov
  gitleaks       artifact↑    csp-guard
  no-postinstall

deploy.yml  (on: push → main)
  guard → build → verify → lighthouse → deploy
                                          └─ configure-pages → upload-pages-artifact → deploy-pages
                                             environment: github-pages
                                             OIDC: id-token: write
```

### 2.3 Contratos de permissão (least privilege)
```yaml
permissions:
  contents: read        # job-level default em TODOS os jobs
# somente em deploy:
permissions:
  contents: read
  pages: write
  id-token: write       # OIDC — substitui GITHUB_TOKEN de deploy
```
`GITHUB_TOKEN` **nunca** recebe `write-all`. Nenhuma permissão é declarada em nível de workflow com escopo maior que `contents: read`.

### 2.4 Caching (reduz minutes e tempo)
| Cache | Chave | Restauração |
|---|---|---|
| npm | nativo de `actions/setup-node` `cache: 'npm'` | `package-lock.json` |
| Astro | `.astro/` | `hashFiles('src/**', 'astro.config.mjs', 'package-lock.json')` |
| Playwright | `~/.cache/ms-playwright` | `hashFiles('package-lock.json')` |
| LHCI | `.lighthouseci/` | `github.run_id` (baseline de run anterior) |

### 2.5 Environment `github-pages`
Criado automaticamente pelo template; configuração manual obrigatória:
- **Deployment branch policy:** somente `main` pode deployar.
- **Wait timer:** 0.
- **Reviewers:** nenhum (automação total; `main` já exige PR aprovado).
- URL de saída exposta via `${{ steps.deployment.outputs.page_url }}`.

### 2.6 Supply-chain hardening
1. `npm ci --ignore-scripts` exclusivamente (nunca `npm install`) + invariante verificada por `scripts/verify-no-postinstall.mjs` (ADR-001 D4).
2. Dependabot para `npm` e `github-actions` (C3).
3. `gitleaks` sobre o histórico completo em todo PR.
4. **Proibição de script injection:** nenhuma interpolação de `${{ github.event.* }}` dentro de bloco `run:`. Valores de evento são passados **apenas** por `env:` e consumidos como variável de ambiente.
5. **Proibição de Pwn Request:** `pull_request_target` é **banido**. Usamos `pull_request` + `permissions: contents: read` (sem write ⇒ sem exfiltração).
6. `concurrency` com `cancel-in-progress: true` para não desperdiçar minutes.
7. `timeout-minutes` explícito em todo job (impede runner preso).
8. Pinning de actions — ver **BYPASS-001** abaixo.

### 2.7 BYPASS-001 — Pinning por tag em vez de SHA completo
O contrato de `devops-platform` proíbe pinning por tag mutável (`@v5`) sem Bypass Protocol. O Bypass é solicitado com os 3 pilares:

1. **Força maior:** SHAs completos de 40 caracteres não são verificáveis a partir do contexto atual sem acesso ao marketplace. Hardcodar SHA não-verificado viola a diretiva de zero-alucinação **e cria risco maior**: um SHA errado causa falha silenciosa ou, no pior caso, resolução para ref de terceiro.
2. **Rota FOSS:** as actions usadas (`actions/checkout`, `actions/setup-node`, `actions/configure-pages`, `actions/upload-pages-artifact`, `actions/deploy-pages`, `actions/upload-artifact`, `actions/download-artifact`) são **todas** first-party GitHub, Apache-2.0/MIT, mantidas pela mesma entidade que opera o runner. O risco de tag-hijack é estruturalmente menor que em actions de terceiro.
3. **Prazo:** conversão para SHA completo até o fim da **Fase 2 (Dia 10)**, tracked como `INFRA-001`, executada por `scripts/pin-actions.sh` (C7) que resolve tag→SHA via API oficial do GitHub e reescreve os workflows preservando a tag como comentário. Dependabot (`github-actions` ecosystem) mantém os SHAs atualizados a partir de então.

**Marcação obrigatória em cada workflow:** comentário `# BYPASS-001: SHA pin pending — see RFC-001 §2.7 / INFRA-001` adjacente a toda action pinada por tag. `reviewer-gatekeeper` não pode rejeitar o PR por este motivo enquanto `INFRA-001` estiver aberta.

### 2.8 Métricas DORA (reportadas mensalmente no Journal)
| Métrica | Alvo | Fonte |
|---|---|---|
| Deployment Frequency | ≥ 4/mês | contagem de runs de `deploy.yml` bem-sucedidos |
| Lead Time for Changes | ≤ 48 h (mediana PR→deploy) | timestamps de PR merge e deploy |
| Change Failure Rate | ≤ 10 % | deploys seguidos de hotfix em ≤ 7 dias |
| MTTR | ≤ 4 h | tempo entre hotfix e novo deploy verde |
| Actions minutes consumidos | ≤ 1500/mês | aba Billing |

## 3. Security
- Secrets: nenhum secret é necessário para build ou deploy (site 100% estático, deploy via OIDC). `secrets.*` é usado **apenas** se `RFC-002` for aprovado.
- Variáveis públicas: prefixo `PUBLIC_` (Astro expõe no bundle). Gate `static-analysis-enforcer` falha se qualquer `PUBLIC_*` casar com padrão de secret.
- Artifact `dist/` trafega entre jobs via `actions/upload-artifact` (não via commit em branch — evita o problema documentado *"Commits pushed by a GitHub Actions workflow that uses GITHUB_TOKEN do not trigger a GitHub Pages build"*).
- Nenhuma action de terceiro com `pull_request` trigger e permissão de escrita.

## 4. Failure Modes (obrigatório — `spec-auditor` rejeita RFC sem esta seção)

| # | Modo de falha | Detecção | Resposta automática | Recuperação |
|---|---|---|---|---|
| FM-01 | `npm ci --ignore-scripts` falha por novo postinstall em dependência transitiva | job `guard`, `verify-no-postinstall.mjs` | build falha; Dependabot PR bloqueado | pinar versão anterior OU ADR justificando exceção |
| FM-02 | Build Astro excede 8 min | `timeout-minutes: 8` | job cancelado | auditar `content/`; habilitar cache `.astro/` |
| FM-03 | Deploy excede 10 min (hard limit do Pages) | `actions/deploy-pages` retorna timeout | deploy falha; site anterior permanece no ar | reduzir artefato; re-run |
| FM-04 | Artifact `dist/` vazio ou sem `index.html` | `verify` falha em `linkinator` + `lighthouse` | deploy bloqueado | verificar `astro.config.mjs` `base`/`site` (ADR-004) |
| FM-05 | `base` incorreto em project-site ⇒ 404 geral | `linkinator` + teste de canonical (SPEC-001 AC-001.3) | build falha | usar `steps.pages.outputs.base_path` (ADR-004) |
| FM-06 | `.nojekyll` ausente ⇒ Pages tenta build Jekyll sobre `dist/` | checklist pré-launch + 500 no Pages | — | garantir `.nojekyll` em `public/` |
| FM-07 | Pagefind não gera índice | `verify:pagefind` (SPEC-007 AC-007.N3) | build falha | restaurar `postbuild` no `package.json` |
| FM-08 | LHCI flaky (variação de throttling em runner compartilhado) | 2 falhas consecutivas com diff < 3 % | `--preset=desktop` fallback + retry 1 | re-run; se persistente, ajustar budget via ADR |
| FM-09 | Playwright flaky | falha não-reproduzível localmente | retry 2 no CI | `test.skip()` + issue + deadline 7 dias (contrato `qa-shiftleft`) |
| FM-10 | Rate limit HTTP 429 do Pages durante smoke test | status 429 | smoke test tolerante (retry 3× com backoff 30 s) | aguardar; não é falha de build |
| FM-11 | `pull_request` de fork tenta exfiltrar secret | `permissions: contents: read` + nenhum secret em PR | token sem permissão ⇒ exfiltração inútil | — (mitigação estrutural) |
| FM-12 | Tag de action sequestrada (supply-chain) | SHA pinning ausente | **risco aberto** | BYPASS-001 → `INFRA-001` (prazo Dia 10) |
| FM-13 | Repo ultrapassa 500 MB | `guard` mede `du -sh .git` | build falha | mover mídia para release assets ou LFS externo |
| FM-14 | Banda > 40 GB/mês | alerta manual mensal | — | revisar cache headers; `RFC-002` (CDN) |
| FM-15 | Deploy verde mas site 404 | smoke test pós-deploy (`curl` na `page_url`) | issue aberta automaticamente | re-run do workflow; verificar Settings → Pages source = GitHub Actions |

## 5. FOSS Exit
Todo o pipeline usa exclusivamente: GitHub Actions (infra do host, custo zero), Node.js, Astro (MIT), Tailwind (MIT), Pagefind (MIT), Playwright (Apache-2.0), axe-core (MPL-2.0), Vitest (MIT), LHCI (Apache-2.0), linkinator (Apache-2.0), gitleaks (MIT).
**Migração total para GitLab CI ou Gitea Actions estimada em ≤ 2 dias** (sintaxe YAML distinta, mesmos tools npm). Nenhum lock-in proprietário além do hosting — que é deliberado (`§C2`) e reversível.

## 6. Runbooks (entregáveis obrigatórios)
`docs/runbooks/rollback.md` · `dns-custom-domain.md` · `rotate-secrets.md` · `cache-invalidation.md` · `incident-429.md` · `restore-unpublished-site.md` (GitHub Docs: *Re-enabling a site that has been unpublished*).

## 7. Referências
GitHub Docs — *Using custom workflows with GitHub Pages* · *Configuring a publishing source* · *Unpublishing a GitHub Pages site* · *GitHub Pages limits* · *GitHub's plans* · *Securing your GitHub Pages site with HTTPS* · `actions/configure-pages@v5`, `actions/upload-pages-artifact@v4`, `actions/deploy-pages@v4` (versões canônicas conforme docs fornecidos) · OWASP ASVS v4.0.3 §V6, §V14 · DORA Four Keys · GitHub Docs — *Preventing pwn requests* · SLSA Framework v1.0 (build integrity).
