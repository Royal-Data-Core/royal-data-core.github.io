<div align="center">

# Royal Data Core

**Engenharia de qualidade para software crítico** · Consultoria em testes

[![CI](https://github.com/Royal-Data-Core/site-io/actions/workflows/ci.yml/badge.svg)](https://github.com/Royal-Data-Core/site-io/actions/workflows/ci.yml)
[![Deploy](https://github.com/Royal-Data-Core/site-io/actions/workflows/deploy.yml/badge.svg)](https://github.com/Royal-Data-Core/site-io/actions/workflows/deploy.yml)
[![Validate SDD](https://github.com/Royal-Data-Core/site-io/actions/workflows/validate-ecosystem.yml/badge.svg)](https://github.com/Royal-Data-Core/site-io/actions/workflows/validate-ecosystem.yml)
![Lighthouse Perf](https://img.shields.io/badge/Lighthouse_Perf-≥0.99-2ea44f)
![Lighthouse A11y](https://img.shields.io/badge/Lighthouse_A11y-100-2ea44f)
![JS inicial](https://img.shields.io/badge/JS_inicial-2.09KB-informational)
![Custo mensal](https://img.shields.io/badge/custo-R%240.00-success)

🌐 https://royal-data-core.github.io/site-io/ · Matão/SP

</div>

---

## 🔍 O que é este repositório

Site institucional B2B (vitrine + blog técnico) do Royal Data Core, construído como
**case público de engenharia de qualidade**: 100 % estático, custo recorrente zero,
spec antes de código e auditoria em cada commit. O próprio site passa pelos gates
que a consultoria propõe aos clientes — e os reports de CI são públicos.

| Dimensão     | Snapshot medido (bateria local completa)                                                        |
| ------------ | ----------------------------------------------------------------------------------------------- |
| Artefato     | 18 páginas estáticas (Astro SSG) · runtime JS não-hidratado, exceto busca (SPEC-007)            |
| Bundle       | JS **2.09 KB** gzip (orçamento 50) · CSS **4.03 KB** gzip (orçamento 30)                        |
| Lighthouse   | 9 URLs: perf **0.99–1.0** · a11y **1.0** · best-practices 1.0 · SEO 1.0 · LCP máx 1733 ms       |
| Testes       | e2e **28/28** · a11y axe-core **16/16** (2 viewports) · unit+coverage **11/11** (≥80 % crítica) |
| Links        | **336 checks / 0 broken** · escaneamento hermético (zero rede)                                  |
| Supply chain | `npm audit --omit=dev` **0 vulnerabilidades** · 39/39 Actions SHA-pinadas · 0 lifecycle scripts |
| Infra        | GitHub Pages / Actions (OIDC, least-privilege) · custo **R$ 0,00/mês**                          |

## 🧱 Topologia publicada

| Rota                       | Papel                                                 |
| -------------------------- | ----------------------------------------------------- |
| `/`                        | Vitrine — proposta de valor, prova (case), CTA        |
| `/servicos/`               | Catálogo de serviços + pacote de engajamento          |
| `/blog/` + `/blog/<slug>/` | Blog técnico S1 (3 posts, MDX, Shiki, Pagefind, tags) |
| `/blog/tag/<tag>/`         | 8 páginas de tag                                      |
| `/contato/`                | Canal de conversão (Formspree/Cal.com conforme D-03)  |
| `/busca/`                  | Busca client-side Pagefind (zero query a servidores)  |
| `/privacidade/`            | LGPD — política de privacidade                        |
| `/404/`                    | Página de erro customizada                            |

**Stack:** Astro `output: static` + Content Collections (MDX + Zod) · Tailwind CSS v4
(utility-only) · TypeScript `strictest` · Pagefind · CSP meta nos HTML ·
GitHub Pages (base `/site-io/`).

## 🤖 Runbook

```bash
npm ci            # instalação determinística (lifecycle scripts verificados)
npm run build     # astro build + pagefind + verificação de índice
npm run preview   # serve dist/ respeitando SITE_BASE
```

Variáveis de contexto (ver `.env.example`): `SITE`, `SITE_BASE` (build) e
`SITE_URL`, `SITE_BASE` (testes). O CI injeta os mesmos valores shell-side
(origin/base computados do `GITHUB_REPOSITORY`, zero rede — ADR-008 D7).

### Bateria de testes

| Comando                 | Gate                                                  |
| ----------------------- | ----------------------------------------------------- |
| `npm run check`         | `astro check` + `tsc --noEmit` (strictest)            |
| `npm run lint`          | ESLint `--max-warnings 0`                             |
| `npm run format:check`  | Prettier                                              |
| `npm run lint:md`       | markdownlint-cli2 (perfil documental)                 |
| `npm run lint:topology` | ADR-004 — `withBase()` obrigatório em URL interna     |
| `npm run lint:copy`     | CONSTITUTION §C9 — vocabulário de marketing proibido  |
| `npm run test:unit`     | Vitest + cobertura v8 (≥80 %) na utils layer          |
| `npm run test:e2e`      | Playwright (cenários Gherkin, 2 viewports)            |
| `npm run test:a11y`     | Playwright + axe-core (WCAG 2.1 AA)                   |
| `npm run test:links`    | linkinator hermético (espelho `/site-io/`, zero rede) |
| `npm run test:lh`       | Lighthouse CI (orçamentos abaixo)                     |
| `npm run test`          | unit + e2e + a11y                                     |

Commits precisam de mensagem **Conventional Commits (EN)** — verificada por hook
`commit-msg` (sem dependentes externos). `pre-commit` roda lint-staged
(eslint + prettier + markdownlint nos arquivos staged).

## 🚦 Pipeline

| Workflow                 | Gatilho                         | Jobs (em ordem)                                                                                                                                                                                     |
| ------------------------ | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ci.yml`                 | PR → main/develop · push update | `guard` (check · lint · format · md · topologia · C1 · gitleaks · pin-check) → `build` (matriz Node 22/24/26) → `verify` (unit·e2e·a11y·links, contexto de deploy idêntico ao build) ∥ `lighthouse` |
| `deploy.yml`             | push main · manual              | `guard` (bateria estática completa + gitleaks) → `build` → `verify` ∥ `lighthouse` (visão espelhada `/site-io/`) → `deploy` (Pages, OIDC) → smoke test pós-publicação                               |
| `validate-ecosystem.yml` | push/PR em `scripts/**`         | parser tests + analyst-integration tests                                                                                                                                                            |

**Orçamentos (bloqueiam merge/deploy):** Lighthouse perf/bp **≥ 0.95**,
a11y/SEO **= 1.0**; LCP **≤ 2500 ms** · CLS **≤ 0.1** · TBT **≤ 200 ms**
(INP é métrica de campo — off no lab). Artifact ≤ 100 MB, repo ≤ 500 MB,
build < 8 min. Ações pinadas por SHA completo (`pin:actions:check` como gate).

## 📦 O que é público aqui — e o que NÃO é

Este repositório carrega **só o produto**: site, tooling de pipeline e documentação
operacional pública. O corpus interno (constituição normativa, ADRs, specs
Gherkin, RFCs e brief de copy) é material de trabalho **local**, `gitignored`
por decisão de privacidade (ADR-009 D1) — derivados públicos vivem neste README,
nos summaries dos jobs e nos ADR-reports referenciados no journal.

Pendências de decisão humana (não-bloqueantes, site funcional com fallbacks):
`D-01` handle/canonical do site · `D-03` email/WhatsApp reais
(placeholders honestos `[[EMAIL]]`/`[[PHONE]]` ativos) · `D-04` redes sociais
(handle placeholder) · rotacionar a chave SSH de referência histórica.

## 📊 Status

> Rodada de saneamento e coerência de contexto — _2026-10-19_.

| Área                  | Status | Evidência                                                                                                                                                                                                                                                         |
| --------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build base-mounted    | ✅     | dist 18 HTML · Pagefind índice+wasm verificado (`build:pagefind`)                                                                                                                                                                                                 |
| Bateria local         | ✅     | unit 11/11 · e2e 28/28 · a11y 16/16 · links 336/0 · LHCI 9 URLs verdes                                                                                                                                                                                            |
| Pipeline              | ✅     | guard estendido (RFC-001 §2.2) · link-check hermético · hooks de commit ativos                                                                                                                                                                                    |
| Despublicação interna | ✅     | `.ai/` + `.opencode/` fora do índice (47 arquivos), workflows rewireados                                                                                                                                                                                          |
| Riscos residuais      | 🟡     | clickjacking · MIME sniffing · Permissions-Policy · CSP reporting · IP nos logs do Pages · código público · harvesting de email · domínio `*.github.io` · banda 100 GB — mitigação: CSP meta (SPEC-008), HSTS enforced, LGPD by design, 5 HIGH dev-only (ADR-006) |

Métricas DORA (atualização mensal): Deploys — · Lead Time — · CFR — · MTTR —.

## 🙌 Padrões

- **Conventional commits (EN)** — `feat`, `fix`, `docs`, `chore`, … bloqueados por hook.
- **Astro estático** — sem hidratação por default; busca = único script, same-origin.
- **Tailwind utility-only** · IDs sem acento (ADR-000) · sem `style=""` inline.
- **Privacidade por design** — sem trackers (analytics quando houver = GoatCounter/Umami) ·
  sem cookies de identificação · formulário com honeypot + validação HTML5.

---

© Royal Data Core · Conventional commits · Astro SSG · R$ 0,00
