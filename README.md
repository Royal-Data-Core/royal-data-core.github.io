<div align="center">

# Royal Data Core

**Engenharia de qualidade para software crítico** · Consultoria em testes

[![CI](https://github.com/Royal-Data-Core/site-io/actions/workflows/ci.yml/badge.svg)](https://github.com/Royal-Data-Core/site-io/actions/workflows/ci.yml)
[![Deploy](https://github.com/Royal-Data-Core/site-io/actions/workflows/deploy.yml/badge.svg)](https://github.com/Royal-Data-Core/site-io/actions/workflows/deploy.yml)
![Lighthouse Perf](https://img.shields.io/badge/Lighthouse_Perf-0.99→1.0-2ea44f)
![Lighthouse A11y](https://img.shields.io/badge/Lighthouse_A11y-100-2ea44f)
![JS inicial](https://img.shields.io/badge/JS_inicial-2.09KB-informational)
![Auditoria do artefato](https://img.shields.io/badge/auditoria_arte-0_violacoes-success)
![Custo mensal](https://img.shields.io/badge/custo-R%240.00-success)

🌐 https://royal-data-core.github.io/site-io/ · Matão/SP

</div>

---

## 🔍 Raio-x do projeto

Site institucional B2B (vitrine + blog técnico) da Royal Data Core LTDA, construído
como **case público de engenharia de qualidade**: 100 % estático, custo recorrente
zero, spec antes de código e auditoria em cada commit. O site passa pelos mesmos
gates que a consultoria propõe aos clientes — e os reports de CI são públicos.

| Dimensão       | Snapshot medido (bateria local completa, 2026-10-20)                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------ |
| Artefato       | 18 páginas estáticas (Astro SSG) · zero hydrated JS, exceto busca Pagefind (SPEC-007)                        |
| Bundle         | JS **2.09 KB** gzip (orçamento 50) · CSS **4.03 KB** gzip (orçamento 30) · audit **0 violações**             |
| Lighthouse     | 9 URLs: perf **0.99–1.0** · a11y **1.0** · best-practices **1.0** · SEO **1.0** · LCP ≤ 1733 ms              |
| Testes         | e2e **28/28** (2 viewports) · a11y axe-core **16/16** · unit **56/56** (src/lib crítica)                     |
| Cobertura real | statements **95 %** · branches **85.5 %** · funções **100 %** · linhas **94.9 %** (gate ≥ 80 %)              |
| Links          | **336 checks / 0 broken** · escaneamento hermético (zero rede)                                               |
| Code health    | 69 arquivos rastreados · **bloat zero**: sem handlers mortos, sem deps fantasmas, sem stubs                  |
| Supply chain   | `npm audit --omit=dev` **0 vulnerabilidades** · 20 Actions SHA-pinadas + 1 reuse local · 0 lifecycle scripts |
| Infra          | GitHub Pages + Actions (OIDC, least-privilege) · custo **R$ 0,00/mês**                                       |

### 🧬 De onde viemos — o desenho

| Decisão                                 | Efeito medido                                                                            |
| --------------------------------------- | ---------------------------------------------------------------------------------------- |
| Astro SSG `output: static` (ADR-001)    | Zero runtime server; LCP ≤ 1.7 s; um único script autorizado (busca, SPEC-007)           |
| Tailwind v4 CSS-first (`@theme`)        | CSS 4 KB gzip; config JS morta eliminada (v4 lê styles/global.css — sem tailwind.config) |
| TypeScript `strictest` + Zod            | Contratos de conteúdo e build falham antes do deploy (§C12)                              |
| CSP por meta tag (ADR-002/SPEC-008)     | Console limpo: 0 violações em runtime nos e2e                                            |
| Cobertura em src/lib                    | Unit specs 11→**56**; cobertura deixou de ser "falsa" (antes media módulo morto)         |
| Bateria CI em matriz paralela (ADR-010) | Wall-clock do gate 3 = suite mais lenta (≈2 min) em vez de unit→e2e→a11y→links em série  |

## 🧱 Topologia publicada

| Rota                       | Papel                                                |
| -------------------------- | ---------------------------------------------------- |
| `/`                        | Vitrine — proposta de valor, prova (case), CTA       |
| `/servicos/`               | Catálogo de serviços + pacote de engajamento         |
| `/blog/` + `/blog/<slug>/` | Blog técnico S1 (3 posts, MDX, Shiki, tags)          |
| `/blog/tag/<tag>/`         | 8 páginas de tag                                     |
| `/contato/`                | Canal de conversão (Formspree/Cal.com conforme D-03) |
| `/busca/`                  | Busca client-side Pagefind (zero query a servidores) |
| `/privacidade/`            | LGPD — política de privacidade                       |
| `/404/`                    | Página de erro customizada                           |

**Stack:** Astro 7 + Content Collections (MDX + Zod) · Tailwind CSS v4 (utility-only) ·
TypeScript `strictest` · Pagefind · CSP meta · GitHub Pages (base `/site-io/`).

## 🤖 Runbook

```bash
npm ci            # instalação determinística (lifecycle scripts verificados)
npm run build     # astro build + pagefind + verificação de índice
npm run preview   # serve dist/ respeitando SITE_BASE
```

Variáveis de contexto (ver `.env.example`): `SITE`, `SITE_BASE` (build) e
`SITE_URL`, `SITE_BASE` (testes). **Todo gate de runtime exige contexto de
deploy** — e2e/a11y/links foram projetados para falhar sem o espaço de implantação.
O CI injeta os mesmos valores shell-side (origin/base computados do
`GITHUB_REPOSITORY`, zero rede — ADR-008 D7).

### §Scripts — automação versionada (CONSTITUTION §C11c)

| Script                      | Função                                                                                   |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| `audit-bundle.mjs`          | Auditoria determinística do artefato: budgets, CSP, externos, SRI, `data-testid`         |
| `verify-no-postinstall.mjs` | Invariante ADR-001 D4 — nenhum lifecycle script (torna `npm ci --ignore-scripts` seguro) |
| `test-links.mjs`            | Gate hermético de integridade de links (espelho `/site-io/`, zero rede)                  |
| `lint-copy.mjs`             | §C9 — vocabulário de marketing não verificável (gate bloqueante no guard CI)             |
| `lint-topology.mjs`         | ADR-004 — `withBase()` obrigatório em URL interna                                        |
| `generate-og.mjs`           | Regenera `public/og-default.png` (sharp local, sem rede) — run-once                      |
| `new-post.mjs`              | Scaffolding de post (frontmatter Zod + slug)                                             |
| `commit-msg-check.mjs`      | Hook `commit-msg` — Conventional Commits (EN) sem dependências externas                  |
| `pin-actions.sh`            | RFC-001 §2.7 — pin de Actions por SHA-40 via API oficial; `--check` = gate               |

### Bateria de testes

| Comando                 | Gate                                                      |
| ----------------------- | --------------------------------------------------------- |
| `npm run check`         | `astro check` + `tsc --noEmit` (strictest)                |
| `npm run lint`          | ESLint `--max-warnings 0`                                 |
| `npm run format:check`  | Prettier                                                  |
| `npm run lint:md`       | markdownlint-cli2 — superfície publicada (determinístico) |
| `npm run lint:copy`     | CONSTITUTION §C9 — vocabulário de marketing proibido      |
| `npm run lint:topology` | ADR-004 — `withBase()` obrigatório em URL interna         |
| `npm run lint:security` | `audit-bundle` no artefato dist/                          |
| `npm run test:unit`     | Vitest + cobertura v8 (≥ 80 % todos os eixos, src/lib)    |
| `npm run test:e2e`      | Playwright (cenários Gherkin das SPECs, 2 viewports)      |
| `npm run test:a11y`     | Playwright + axe-core (WCAG 2.1 AA)                       |
| `npm run test:links`    | linkinator hermético (espelho `/site-io/`, zero rede)     |
| `npm run test:lh`       | Lighthouse CI (orçamentos abaixo)                         |
| `npm run test`          | unit + e2e + a11y                                         |

Hooks: `pre-commit` = lint-staged (eslint + prettier + markdownlint); `commit-msg`
= Conventional Commits (EN). Commits em PT-BR são rejeitados pelo hook.

## 🚦 Pipeline

**Um topology, dois gatilhos (ADR-010):** `.github/workflows/ci.yml` é o
canonical battery consumido diretamente (PR e push develop) e re-invocado via
`workflow_call` pelo `deploy.yml` em main — sem duplicação de YAML e sem drift.

| Workflow     | Gatilho                        | Sequência                                                                                                                                                                                                                                                              |
| ------------ | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ci.yml`     | PR main/develop · push develop | `guard` (no-browser ~90 s: deps, ADR-001/D4, check, eslint, prettier, md, **§C9 copy**, C1, ADR-000, topologia, gitleaks, pin-check) → `build` (matriz Node 22/24/26 + pagefind + audits) → `verify` em **matriz paralela `unit │ e2e │ a11y │ links`** ∥ `lighthouse` |
| `deploy.yml` | push main · manual             | `battery` (revalida TUDO sobre main — RFC-001 §2.2, sem confiar no verde anterior) → `deploy` (baixa o artefato validado do mesmo run, empacota Pages, OIDC, smoke test com backoff limitado + §C6 journal notice)                                                     |

**Orçamentos bloqueantes:** Lighthouse perf/bp ≥ 0.95, a11y/SEO = 1.0; LCP ≤ 2500 ms ·
CLS ≤ 0.1 · TBT ≤ 200 ms; JS ≤ 50 KB / CSS ≤ 30 KB gzip; artifact ≤ 100 MB;
repo ≤ 500 MB; build < 8 min; deploy ≤ 6 min. Actions pinadas por SHA-40
(`pin:actions:check` é gate); o único valor não-pinnável é o reuse local
`./.github/workflows/ci.yml` — same-commit por definição da plataforma.

## 📦 O que é público aqui — e o que NÃO é

Este repositório carrega **só o produto**: site, tooling de pipeline e documentação
operacional pública. O corpus interno (constituição normativa, ADRs, specs
Gherkin, RFCs e brief de copy) é material de trabalho **local**, `gitignored`
por decisão de privacidade (ADR-009 D1); os derivados públicos vivem neste
README (topologia, orçamentos, §Scripts, journal) e nos sumários dos jobs.

Pendências de decisão humana (não-bloqueantes, site funcional com fallbacks
honestos `[[EMAIL]]`/`[[PHONE]]`):
`D-01` handle/canonical do site · `D-02` coordenadas de Matão (serviceArea)
(despejo de GeoCircle aguardando verificação) · `D-03` email/WhatsApp reais ·
`D-04` redes sociais (handle placeholder) · rotacionar a chave SSH histórica ·
purgar blobs de `.ai/`/`.opencode/` do histórico git (os arquivos fora do
índice permanecem acessíveis no histórico — ver entrada de journal de
2026-10-19; comando documentado no relatório de decisão).

## 📊 Status

> Sessão de saneamento estrutural — _2026-10-20_.

| Área                    | Status | Evidência                                                                                                                                                                                                                         |
| ----------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Code hygiene            | ✅     | bloat removido: cd.yml zumbi, control-plane interno (4 scripts + workflow), validator morto, config Tailwind sem fontes de veracidade                                                                                             |
| Pipeline                | ✅     | 1 battery canônica + matriz paralela; duplicação de YAML ~230 linhas → 0; §C9 lint:copy agora bloqueia CI                                                                                                                         |
| Bateria local           | ✅     | unit 56/56 · e2e 28/28 · a11y 16/16 · links 336/0 · LHCI 9 URLs verdes · bundle audit 0 violações                                                                                                                                 |
| Privacidade do artefato | ✅     | dist livre de `.ai/`/corpus interno (gate SEC no build)                                                                                                                                                                           |
| Riscos residuais        | 🟡     | clickjacking · MIME sniffing · Permissions-Policy · CSP reporting · IP nos logs do Pages · domínio `*.github.io` · harvesting de email — mitigação: CSP meta (SPEC-008), HSTS enforced, LGPD by design, 5 HIGH dev-only (ADR-006) |

Métricas DORA (atualização mensal): Deploys — · Lead Time — · CFR — · MTTR —.

## 🙌 Padrões

- **Conventional commits (EN)** — `feat`, `fix`, `docs`, `chore`, … bloqueados por hook.
- **Astro estático** — sem hidratação por default; busca = único script, same-origin.
- **Tailwind utility-only** · IDs sem acento (ADR-000) · sem `style=""` inline.
- **Privacidade por design** — sem trackers (analytics quando houver = GoatCounter/Umami) ·
  sem cookies de identificação · formulário com honeypot + validação HTML5.

## 🗒️ Changelog Arquitetural (CONSTITUTION §C6)

Mais recente no topo. Uma entrada por mudança relevante merged em `main`.

- [2026-10-20] · [ADR-010 D15 v2] · ci(deps): majors npm held globalmente (wildcard; 2 datapoints de peer-bloqueio no mesmo ciclo — TS7 ^5–^6, ESLint10 ^3..^9) → upgrade path manual ADR-gated; PRs #16/#17 fechados · [624e774](https://github.com/Royal-Data-Core/site-io/commit/624e774)
- [2026-10-20] · [ADR-010 D15] · ci(deps): typescript held (^5, peer bloqueia TS7 — evidência de registro) fora do lint group; reviewers placeholder removido (D-01); PR #15 fechado com evidência · [d8137ed](https://github.com/Royal-Data-Core/site-io/commit/d8137ed)
- [2026-10-20] · [ADR-010 D13/D14] · fix: `.nojekyll` no artefato (`include-hidden-files`) + smoke distinguindo instância do CDN de regressão real · [1a592f4](https://github.com/Royal-Data-Core/site-io/commit/1a592f4)
- [2026-10-20] · [ADR-010 D12] · fix: LHCI na receita comprovada (mirror base-mounted + fallback 0.14.x, 5m31) — vista dist-direta nunca rodou no remoto · [68dda1f](https://github.com/Royal-Data-Core/site-io/commit/68dda1f)
- [2026-10-20] · [ADR-010 D11] · fix: lock alinhado cross-npm 10/11/12 (proxy-agent@8.0.2 satisfaz peer opcional de @puppeteer/browsers) + gate §C5 mede o repo (exclui node_modules/.git) · [5f2f98d](https://github.com/Royal-Data-Core/site-io/commit/5f2f98d)
- [2026-10-20] · [ADR-010] · pipeline: battery canônica única (workflow_call), verify paralela unit|e2e|a11y|links, deploy thin-caller, smoke backoff limitado, §C9 lint:copy bloqueia CI · [a004ea8](https://github.com/Royal-Data-Core/site-io/commit/a004ea8)
- [2026-10-20] · [ADR-009 D1] · chore: `.gitignore` = política de publicação única; gates lint:md/eslint determinísticos (superfície publicada); `globals` declarado; alias `audit:bundle` removido · [2eab70f](https://github.com/Royal-Data-Core/site-io/commit/2eab70f)
- [2026-10-20] · [§C12.3] · test(unit): cobertura real em src/lib (56 specs, 95 %/85.5 %/100 %/94.9 %); validator morto + tailwind.config.ts removidos · [1849be7](https://github.com/Royal-Data-Core/site-io/commit/1849be7)
- [2026-10-20] · [ADR-010 D1] · chore(bloat): cd.yml zumbi + control-plane SDD interno (4 scripts python + validate-ecosystem.yml) removidos · [49bfad2](https://github.com/Royal-Data-Core/site-io/commit/49bfad2)
- [2026-10-19] · [ADR-009] · saneamento onda 1: `.ai/` + `.opencode/` despublicados do índice (47 arquivos), gates de contexto herméticos, hooks de commit, CSP smoke estável
- [2026-10-19] · [ADR-008] · CI/deploy sem `configure-pages` (origin/base shell-side), setup-python direto + pin-check como gate bloqueante
- [2026-10-18] · [RFC-001] · pipeline fundação: 4 gates (guard/build/verify/lighthouse) + deploy Pages OIDC + budgets rígidos

---

© Royal Data Core · Conventional commits · Astro SSG · R$ 0,00
