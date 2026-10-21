<div align="center">

# Royal Data Core

**Engenharia de qualidade para software crítico** · Consultoria em testes

[![Pipeline main · battery + deploy + smoke](https://github.com/royaldatacore/royaldatacore.github.io/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/royaldatacore/royaldatacore.github.io/actions/workflows/deploy.yml)
![Lighthouse Perf](https://img.shields.io/badge/Lighthouse_Perf-0.99→1.0-2ea44f)
![Lighthouse A11y](https://img.shields.io/badge/Lighthouse_A11y-100-2ea44f)
![JS inicial](https://img.shields.io/badge/JS_inicial-2.12KB-informational)
![Auditoria do artefato](https://img.shields.io/badge/auditoria_arte-0_violacoes-success)
![Custo mensal](https://img.shields.io/badge/custo-R%240.00-success)

🌐 https://royaldatacore.github.io/ · Matão/SP

</div>

---

## 🔍 Raio-x do projeto

Site institucional B2B (vitrine + blog técnico) da Royal Data Core LTDA, construído
como **case público de engenharia de qualidade**: 100 % estático, custo recorrente
zero, spec antes de código e auditoria em cada commit. O site passa pelos mesmos
gates que a consultoria propõe aos clientes — e os reports de CI são públicos.

| Dimensão       | Snapshot medido (bateria local completa, 2026-10-20)                                                                                                                                                                         |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Artefato       | 28 páginas estáticas (Astro SSG) · **2 idiomas** (pt-BR + en) · zero hydrated JS, exceto busca Pagefind (SPEC-007)                                                                                                           |
| Bundle         | JS **2.00 KB** gzip (orçamento 50) · CSS **5.78 KB** gzip (orçamento 30) · audit **0 violações**                                                                                                                             |
| Lighthouse     | 13 URLs (perfil prod PT+EN): perf **0.96–1.0** · a11y **1.0** · best-practices **1.0** · SEO **1.0** · LCP ≤ 2199 ms · CLS 0 · TBT 0 ms                                                                                      |
| Testes         | e2e **52/52** (2 viewports) · a11y axe-core **28/28** (12 rotas, PT+EN) · unit **81/81** (src/lib crítica)                                                                                                                   |
| Cobertura real | statements **93.2 %** · branches **84.5 %** · funções **95.7 %** · linhas **93.6 %** (gate ≥ 80 %)                                                                                                                           |
| Links          | **981 checks / 0 broken** · escaneamento hermético (zero rede)                                                                                                                                                               |
| Identidade     | SPEC-010 + ADR-012: 3 temas (light/mid/dark) por tokens semânticos · contraste AA **auditado em build** (gate unit) · ícones SVG inline · 0 webfont · CTA fixo no mobile                                                     |
| Idiomas        | SPEC-011 + ADR-013/014: `/en/**` na mesma origem · 1 deploy · hreflang recíproco + x-default · switch por link (0 JS, 0 storage) · 1 índice de busca filtrado por locale · claim regional auditado (raio 100 km de Matão/SP) |
| Supply chain   | `npm audit --omit=dev` **0 vulnerabilidades** · 20 Actions SHA-pinadas + 1 reuse local · 0 lifecycle scripts · Dependabot majors npm **held** (ADR-gated), minors/patches validados pela bateria completa                    |
| Infra          | GitHub Pages + Actions (OIDC, least-privilege) · custo **R$ 0,00/mês**                                                                                                                                                       |

### 🧬 De onde viemos — o desenho

| Decisão                                 | Efeito medido                                                                              |
| --------------------------------------- | ------------------------------------------------------------------------------------------ |
| Astro SSG `output: static` (ADR-001)    | Zero runtime server; LCP ≤ 1.7 s; um único script autorizado (busca, SPEC-007)             |
| Tailwind v4 CSS-first (`@theme`)        | CSS 5,8 KB gzip; config JS morta eliminada (v4 lê styles/global.css — sem tailwind.config) |
| TypeScript `strictest` + Zod            | Contratos de conteúdo e build falham antes do deploy (§C12)                                |
| CSP por meta tag (ADR-002/SPEC-008)     | Console limpo: 0 violações em runtime nos e2e                                              |
| Cobertura em src/lib                    | Unit specs 11→**56**; cobertura deixou de ser "falsa" (antes media módulo morto)           |
| Bateria CI em matriz paralela (ADR-010) | Wall-clock do gate 3 = suite mais lenta (≈2 min) em vez de unit→e2e→a11y→links em série    |

## 🧱 Topologia publicada

| Rota                       | Papel                                                                            |
| -------------------------- | -------------------------------------------------------------------------------- |
| `/`                        | Vitrine — proposta de valor, prova (case), CTA                                   |
| `/servicos/`               | Catálogo de serviços + pacote de engajamento                                     |
| `/blog/` + `/blog/<slug>/` | Blog técnico S1 (3 posts, MDX, Shiki, tags)                                      |
| `/blog/tag/<tag>/`         | 8 páginas de tag                                                                 |
| `/contato/`                | Canal de conversão: mailto/WhatsApp direto — sem formulário/CRM (ADR-003 D1)     |
| `/busca/`                  | Busca client-side Pagefind (zero query a servidores)                             |
| `/privacidade/`            | LGPD — política de privacidade                                                   |
| `/en/**`                   | Superfície EN (Remote · Global) — home, services, contact, privacy, blog, search |
| `/404/`                    | Página de erro customizada                                                       |

**Stack:** Astro 7 + Content Collections (MDX + Zod) · Tailwind CSS v4 (utility-only) ·
TypeScript `strictest` · Pagefind · CSP meta · GitHub Pages (org-site —
apex `/`, sem prefixo de path).

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

### Ambientes locais homologados (Docker — ADR-015)

```bash
npm run dev:docker   # dev server com hot reload → http://localhost:4321
npm run qa:docker    # bateria canônica completa dentro do container QA
```

- `dev` — `node:24-slim` + bind-mount (hot reload); `qa` — imagem oficial
  Playwright `v1.64.1-noble` travada ao lockfile, bateria completa:
  `test:guard` (shift-left) → `build` + `lint:security` → `test:all`
  (unit/e2e/a11y/links). LHCI e gitleaks permanecem gates nativos de CI
  (ADR-015 D5). Reports (Playwright/coverage) bind-mounted de volta ao
  workspace. Payload **nunca roda como root**: o entrypoint faz `chown` dos
  alvos graváveis para `HOST_UID`/`HOST_GID` (default 1000) e executa o CMD
  via `setpriv` (ADR-015 D7). Host uid divergente?
  `HOST_UID=$(id -u) HOST_GID=$(id -g) npm run …`.
- Docker é **instrumental** (§C11): nunca integra o artefato publicado (§C1).
  Caminho nativo (`npm run …`) segue primário — sem Docker, nada quebra.

### 🌍 Operação bilíngue (checklist do operador)

| #   | Ação                                                                                                                          | Onde                            | Quando            |
| --- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ----------------- |
| 1   | **Confirmar a janela de sobreposição com horário dos EUA** (~07:00–13:00 ET) e ajustar a copy EN se a operação real for outra | `src/pages/en/contact.astro`    | antes de divulgar |
| 2   | Acompanhar impressões EN                                                                                                      | GSC → Segmentação internacional | semanal, 90 dias  |
| 3   | Vigiar canibalização PT×EN (consulta em PT apontando para `/en/`)                                                             | GSC → consultas × URL           | mensal            |
| 4   | Conferir indexação da superfície EN                                                                                           | GSC → páginas indexadas         | semanal           |
| 5   | Propriedade GSC separada para `/en/` **só** se o KPI justificar                                                               | GSC → propriedades              | opcional          |

> Sem analytics, sem tracker, sem cookie (CONSTITUTION §C7): a única leitura de demanda é o
> Search Console — relatório de segmentação internacional, filtro por página `/en/`.

### §Scripts — automação versionada (CONSTITUTION §C11c)

| Script                      | Função                                                                                               |
| --------------------------- | ---------------------------------------------------------------------------------------------------- |
| `audit-bundle.mjs`          | Auditoria determinística do artefato: budgets, CSP, externos, SRI, `data-testid`                     |
| `verify-no-postinstall.mjs` | Invariante ADR-001 D4 — nenhum lifecycle script (torna `npm ci --ignore-scripts` seguro)             |
| `test-links.mjs`            | Gate hermético de integridade de links (espelho `/site-io/`, zero rede)                              |
| `lint-copy.mjs`             | §C9 — vocabulário de marketing não verificável (gate bloqueante no guard CI)                         |
| `lint-topology.mjs`         | ADR-004 — `withBase()` obrigatório em URL interna                                                    |
| `verify-hreflang.mjs`       | SPEC-012 — reciprocidade `hreflang`, `x-default` e par do sitemap no artefato (gate no job `build`)  |
| `generate-og.mjs`           | Regenera `public/og-default.png` (sharp local, sem rede) — run-once                                  |
| `new-post.mjs`              | Scaffolding de post (frontmatter Zod + slug)                                                         |
| `notify-indexnow.mjs`       | IndexNow — notifica Bing/Yandex/Seznam/Naver a cada publish (key file + `keyLocation`, non-blocking) |
| `commit-msg-check.mjs`      | Hook `commit-msg` — Conventional Commits (EN) sem dependências externas                              |
| `pin-actions.sh`            | RFC-001 §2.7 — pin de Actions por SHA-40 via API oficial; `--check` = gate                           |

### Bateria de testes

| Comando                 | Gate                                                            |
| ----------------------- | --------------------------------------------------------------- |
| `npm run check`         | `astro check` + `tsc --noEmit` (strictest)                      |
| `npm run lint`          | ESLint `--max-warnings 0`                                       |
| `npm run format:check`  | Prettier                                                        |
| `npm run lint:md`       | markdownlint-cli2 — superfície publicada (determinístico)       |
| `npm run lint:copy`     | CONSTITUTION §C9 — vocabulário de marketing proibido            |
| `npm run lint:topology` | ADR-004 — `withBase()` obrigatório em URL interna               |
| `npm run lint:security` | `audit-bundle` no artefato dist/                                |
| `npm run test:unit`     | Vitest + cobertura v8 (≥ 80 % todos os eixos, src/lib)          |
| `npm run test:e2e`      | Playwright (cenários Gherkin das SPECs, 2 viewports)            |
| `npm run test:a11y`     | Playwright + axe-core (WCAG 2.1 AA)                             |
| `npm run test:links`    | linkinator hermético (espelho `/site-io/`, zero rede)           |
| `npm run test:lh`       | Lighthouse CI (orçamentos abaixo)                               |
| `npm run test:all`      | unit + e2e + a11y + links (bateria verify completa)             |
| `npm run test:guard`    | suite shift-left: check + lint + format + md + copy + topologia |
| `npm run dev:docker`    | dev server homologado em container (ADR-015)                    |
| `npm run qa:docker`     | bateria canônica completa dentro do container QA (ADR-015)      |
| `npm run test`          | unit + e2e + a11y                                               |

Hooks: `pre-commit` = lint-staged (eslint + prettier + markdownlint); `commit-msg`
= Conventional Commits (EN). Commits em PT-BR são rejeitados pelo hook.

## 🚦 Pipeline

**Um topology, dois gatilhos (ADR-010):** `.github/workflows/ci.yml` é o
canonical battery consumido diretamente (PR e push develop) e re-invocado via
`workflow_call` pelo `deploy.yml` em main — sem duplicação de YAML e sem drift.

| Workflow            | Gatilho                          | Sequência                                                                                                                                                                                                                                                              |
| ------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ci.yml`            | PR main/develop · push develop   | `guard` (no-browser ~90 s: deps, ADR-001/D4, check, eslint, prettier, md, **§C9 copy**, C1, ADR-000, topologia, gitleaks, pin-check) → `build` (matriz Node 22/24/26 + pagefind + audits) → `verify` em **matriz paralela `unit │ e2e │ a11y │ links`** ∥ `lighthouse` |
| `deploy.yml`        | push main · manual               | `battery` (revalida TUDO sobre main — RFC-001 §2.2, sem confiar no verde anterior) → `deploy` (baixa o artefato validado do mesmo run, empacota Pages, OIDC, smoke test com backoff limitado + §C6 journal notice)                                                     |
| `docker-parity.yml` | semanal (seg 08:00 UTC) · manual | build da imagem QA + bateria canônica completa dentro do ambiente Docker homologado (ADR-015 D4) — detector de drift local↔CI; nunca bloqueia PR                                                                                                                       |

**Orçamentos bloqueantes:** Lighthouse perf/bp ≥ 0.95, a11y/SEO = 1.0; LCP ≤ 2500 ms ·
CLS ≤ 0.1 · TBT ≤ 200 ms; JS ≤ 50 KB / CSS ≤ 30 KB gzip; artifact ≤ 100 MB;
repo ≤ 500 MB; build < 8 min; deploy ≤ 6 min. Actions pinadas por SHA-40
(`pin:actions:check` é gate); o único valor não-pinnável é o reuse local
`./.github/workflows/ci.yml` — same-commit por definição da plataforma.

**Fonte de PRs de dependência (ADR-010 D15):** Dependabot abre apenas estados
que a bateria consegue validar — majors npm **held** (upgrade path manual,
ADR-gated: o ecossistema ratifica peers depois do major; minors/patches voam
no ciclo semanal segunda 06:00 BRT). Primeiro PR de dependência GREEN foi
mergeado nativamente (#18, bateria 9/9).

**Badge público:** um só, apontando para `deploy.yml?branch=main` — status real
da main a cada push (battery + publish + smoke num run único, sem confiar em
verde anterior). `ci.yml` não tem badge: seus runs diretos são de PR/develop,
e o estado da main pelo badge de PR seria ruído permanente (runs de PRs
fechados). A bateria da main roda como filha `workflow_call` do Deploy, que não
gera run próprio para badge — por isso o badge pai é o único representante fiel.

## 📦 O que é público aqui — e o que NÃO é

Este repositório carrega **só o produto**: site, tooling de pipeline e documentação
operacional pública. O corpus interno (constituição normativa, ADRs, specs
Gherkin, RFCs e brief de copy) é material de trabalho **local**, `gitignored`
por decisão de privacidade (ADR-009 D1); os derivados públicos vivem neste
README (topologia, orçamentos, §Scripts, journal) e nos sumários dos jobs.

Pendências de decisão humana (não-bloqueantes, site funcional com fallbacks
honestos `[[EMAIL]]`/`[[PHONE]]`):
`D-01` handle/canonical do site · `D-02` coordenadas de Matão (serviceArea)
(despejo de GeoCircle aguardando verificação) · rotacionar a chave SSH histórica ·
purgar blobs de `.ai/`/`.opencode/` do histórico git (os arquivos fora do
índice permanecem acessíveis no histórico — ver entrada de journal de
2026-10-19; comando documentado no relatório de decisão).

D-03/D-04 **resolvidas** (2026-10-20): canais oficiais (email, WhatsApp/
telefone) e redes sociais verificadas (Instagram @royaldatacore, LinkedIn
fundador, GitHub) — placeholders vivem apenas em builds sem env (SSOT
honesto).

## 📊 Status

> Estado de rede — _2026-10-20, pós-saneamento estrutural_ · **ALL GREEN**:
> zero runs falhos ativos, zero PRs/issues abertos, `main == origin/main`.

| Área                    | Status | Evidência                                                                                                                                                                                                                         |
| ----------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Code hygiene            | ✅     | bloat zero: sem handlers mortos, deps fantasmas ou stubs · 69 arquivos rastreados; índice livre de corpus interno (ADR-009)                                                                                                       |
| Pipeline (topologia)    | ✅     | 1 battery canônica + matriz paralela (unit\|e2e\|a11y\|links ∥ lighthouse); duplicação de YAML ~230 → 0 linhas; §C9 lint:copy bloqueia CI                                                                                         |
| Pipeline (remoto)       | ✅     | Deploy head `d1f0210` (run 39423394641) **SUCCESS** — 10/10 jobs; bateria local completa green na mesma data; deploys da onda: 5 SUCCESS                                                                                          |
| Bateria                 | ✅     | unit 56/56 · e2e 28/28 · a11y 16/16 · links 336/0 · LHCI 9 URLs verdes · bundle audit 0 violações · JS 2.12 KB / CSS 4.05 KB gzip                                                                                                 |
| Fonte de dependências   | ✅     | Dependabot majors held (ADR-010 D15, evidência de registro); minors/patches validados pela bateria; PR #18 (minor) GREEN 9/9 mergeado; PRs inválidos #15/#16/#17 fechados com evidência                                           |
| Smoke pós-deploy        | ✅     | 6 rotas públicas 200 · `/rota-fantasma/` 404 by-design · `sitemap-index.xml` 200 · CSP meta ✓ · `robots.txt` corrigido no build (`23b9c13` — fix fonte: Sitemap derivado de site/base)                                            |
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

- [2026-10-21] · [ADR-003 D4 rev|SPEC-005] · feat(cta): **assuntos mailto com prefixo bracket e bodies por origem** — SSOT `CONTACT_SUBJECTS` (PT) na gramática `[{{CTX}}] - Royal Data Core` (CONTATO VIA SITE · CONSULTORIA QA B2B · OPORTUNIDADE CLT QA · CONTATO GERAL) e CTAs de home/contato/servicos consumindo a tabela (zero literal inline de subject) · `defaultMailtoBody` com corpo por origem (root `/`, `/contato`, `/servicos`): razão social + URL de origem (SPEC-005 AC-005.2) ⇒ inbox pastas por CTA sem analytics · gates: check 0 · unit verde (locks de tabela + origem) · [8688ef2](https://github.com/royaldatacore/royaldatacore.github.io/commit/8688ef2)
- [2026-10-21] · [RFC 6068|ADR-003 D4] · fix(cta): **serialização mailto com %20 (RFC 6068 §5)** — `buildMailtoHref` normaliza o filler form-urlencoded `+` para `%20` (clientes de e-mail não são obrigados a decodificar `+` como espaço e vários o renderizam literal); `+` literal em valor sai como `%2B` ⇒ todo `+` remanescente é filler seguro · ledger de ocorrências: zero `+` em qualquer mailto URI, `%20` universal (7 mailtos PT — GERAL 3 · VIA-SITE 1 · B2B 2 · CLT 1; bodies raiz 7 · /contato 3 · /servicos 5) · PR #57 · gates: unit 83/83 · run 39639012851 · [d7ece00](https://github.com/royaldatacore/royaldatacore.github.io/commit/d7ece00)
- [2026-10-21] · [CR-001|ADR-003 D4 rev|SPEC-005|SPEC-012] · feat(cta): **ecossistema mailto padronizado (CR-001)** — tabelas PT/EN constant-only na gramática bracket (`servicesB2B` sem params) · canal morto `post` deletado (alias reservado SPEC-004, não implementado) · `privacyRequest`/`linkBroken` adotados nas 4 superfícies diagnóstico/privacidade (PT+EN, literais inline mortos) · body locale-aware EN ("Sent from the official Royal Data Core LTDA website") · body wired a todo mailto com origem da página (root/contato/servicos/privacidade/404/en/*) incl. branches EN de CTA fixo/barra e footer locale-aware · builder RFC 6068 intocado · gates: check 0 · tsc 0 · unit 88/88 · lint:copy ✓ · e2e EN-no-CLT: chapéu em CI (browser não disponível local) · dist (método d7ece00): 78 mailtos, zero `+`, `%20` 78/78, zero legados, zero em-dash em `subject=` · pós-journal ao vivo: PR #58 · bateria 9/9 green (run 39646676824 — chapéu e2e EN-no-CLT fechado em CI) · deploy ~9m23s (run 563s) · ledger de produção reconciliado ±0 (occurrence-audit L0, 9 URLs) vs gates dist acima · superfícies novas live: /privacidade `[CONTATO PRIVACIDADE]` + corpo · 404 jaaps/dead ends `[CONTATO LINK QUEBRADO]` · `/en/*` GEoNorm INTACT (GENERAL CONTACT ×3 /en · QA CONSULTING B2B ×6 · CONTACT PRIVACY ×1 · CONTACT BROKEN LINK ×1) · [61285ea](https://github.com/royaldatacore/royaldatacore.github.io/commit/61285ea)
- [2026-10-21] · [ADR-015|ADR-016] · build(env): **ambientes locais homologados** (Docker Dev/QA) + estratégia de branches formalizada — `Dockerfile` multi-stage (deps/dev/qa) + `docker-compose.yml` (perfis `dev` e `qa`) + `.dockerignore` (sem `.git`/`.ai`/`.env`/artefatos do host no contexto de build) · scripts `test:guard` (shift-left), `test:all` (unit+e2e+a11y+links), `dev:docker`, `qa:docker` · workflow **docker-parity** semanal (drift detector, **não bloqueante**, fora da bateria canônica — `ci.yml` segue sendo a topologia única de validação) · Docker é ferramenta **instrumental** (§C11), nunca runtime publicado (§C1) · validação local: `docker compose config` OK · pin-actions 21 SHA-pinned (0 pendente) · `test:guard` verde · `test:all` verde (81 unit + 52 e2e + 28 a11y + 981 links) · a build da imagem não pôde rodar no sandbox (sem daemon Docker) — o workflow semanal é a prova executável · [2406e22](https://github.com/royaldatacore/royaldatacore.github.io/commit/2406e22)
- [2026-10-21] · [SPEC-012|ADR-013 D9] · feat(seo): **escopo global no PT + par SEO internacional auditado** — a entrega remota deixa de ser “para todo o Brasil” e passa a ser “no Brasil e no exterior” (FAQ nova + seção “Clientes no exterior” no /contato, com contratos em inglês e o descarte explícito de emprego/benefícios/visto) · `routes.json` vira o SSOT do mapa de rotas (TypeScript **e** `astro.config.mjs` — um arquivo, dois consumidores) · sitemap com `xhtml:link` (par PT/EN) e 404s fora · **gate novo** `scripts/verify-hreflang.mjs` (npm `lint:seo`, job `build`): nenhum par pendurado, reciprocidade com o `hreflang` correto de cada lado, `x-default` presente quando há par e sitemap espelhando o `<head>` → 28 páginas / 36 pares recíprocos · marca: o isotyper com alfa do operador (fonte Inkscape de 30 MB, local) vira WebP de 32 KB com alfa e passa a ser usado no header, nos heroes e na placa do OG (sem caixa branca em nenhuma superfície) · README: checklist de operação bilíngue (GSC segmentação internacional, confirmação da janela ET, vigia de canibalização) · gates: unit 81/81 · e2e 52/52 · a11y 28/28 · links 981/0 · audit 0 violações · verify-hreflang 36 pares · [26809b6](https://github.com/royaldatacore/royaldatacore.github.io/commit/26809b6)
- [2026-10-21] · [SPEC-011|ADR-013|ADR-014] · feat(i18n): **superfície EN (Remote · Global)** — `/en/**` na mesma origem (1 repo · 1 deploy · 1 índice de busca · 0 JS · 0 storage · 0 tracker) · 6 rotas EN (home, services, contact, privacy, blog, search) + 3 artigos EN nativos + 404 EN + `/en/rss.xml` + `og-en.png` · `hreflang` recíproco + `x-default` + `html lang`/`og:locale` por locale · JSON-LD com **identidade única** (`@id` único; `areaServed` e `inLanguage` por locale) · switch por link server-rendered (WCAG 2.5.3 + 3.1.2) · **EN sem promessa de employment/CLT** (grep + cenário e2e) · claim regional **verificável**: raio de 100 km de Matão/SP (haversine no gate unit; "ponto médio de equidistância" rejeitado — Araraquara↔Ribeirão Preto = 30,6 km) · copy PT corrigida (escopo de país removido) · vocabulário de marketing ENincluído ao gate `lint:copy` (ADR-014 D2) · LHCI reprofilado (teto de 12 min) + smoke `/en/` pós-deploy · gates: unit 81/81 (cobertura 93,2/84,5/95,7/93,6 %) · e2e 52/52 · a11y 28/28 (12 rotas PT+EN) · links 981/0 · audit 0 violações (JS 2,00 KB · CSS 5,78 KB) · LHCI prod 13 URLs perf 0,96–1,0 · a11y 1,0 · bp 1,0 · seo 1,0 · LCP ≤ 2199 ms · CLS 0 · TBT 0 ms · [51b6a5d](https://github.com/royaldatacore/royaldatacore.github.io/commit/51b6a5d)
- [2026-10-20] · [SPEC-010|ADR-012] · feat(brand): **identidade visual completa** — 3 temas (light/mid/dark) por tokens semânticos + **gate de contraste AA em build** (unit) · ícones SVG inline (14 glifos, zero dependência) · marca otimizada (isotyper WebP 17,9 KB; favicon SVG plano 441 B; OG com placa da marca) · CTA fixo no mobile (thumb zone, canal direto) · motion **transform-only** (opacity em texto reprova axe color-contrast) · **Google Fonts CDN rejeitado** (SPEC-008 AC-008.6/N3 + `font-src 'self'` + PERF-5 ⇒ tipografia por pilhas de sistema com papéis display/body/mono) · `public/` 13,3 MB → 76 KB · gates: check 0/0 · lint 0/0 · unit 68/68 · e2e 38/38 · a11y 16/16 · links 577/0 · audit 0 violações (JS 2,04 KB · CSS 5,75 KB) · LHCI 17 URLs perf 0,97–1,0 · a11y 1,0 · bp 1,0 · seo 1,0 · LCP ≤ 2019 ms · CLS 0 · TBT 0 ms · [077111b](https://github.com/royaldatacore/royaldatacore.github.io/commit/077111b)
- [2026-10-20] · [analytics-decidido] · docs(analytics): **GSC-only — zero JS, zero custo** (ratificado pelo operador) — GA4 bloqueado no gate constitucional ([DON'T] non nodded trackers · SEC-5 · zero-js_default AFA) e por incompatibilidade com o promise-trust publicado (`privacidade.astro`: "sem analytics"); GoatCounter SaaS (US$12/ano) recusado no custo e Umami (VPS) recusado na entropy · o que SIM mede: demanda orgânica (GSC/Bing reports + IndexNow 202) e **conversões de canal por design** — mailto/wa.me inbound já chegam autoflagrados (`defaultMailtoBody`/URL de origem no assunto, D-03/A-DRR-003) · fora do regime: download de vcf, cliques anônimos, engagement on-page · **critério de reabertura**: GoatCounter SaaS quando primeiro CAC real ou >1k sessões orgânicas/mês · [36d93af](https://github.com/royaldatacore/royaldatacore.github.io/commit/36d93af)
- [2026-10-20] · [links-hermetic] · fix(ci): **contrato hermético do link-integrity** — âncoras absolutas do Instagram passavam por HTTP real na distância (única social fora da skip-list) e derrubaram o run #48 (egress do runner: 429/timeout instagram) · skip-list unifica sociais (`linkedin`/`wa.me`/`instagram`/`github.com`) ⇒ gate volta a 100% offline · deploy do rebrand-apex (`ca8c69c`) aguardava este green em ha · [02190da](https://github.com/royaldatacore/royaldatacore.github.io/commit/02190da)
- [2026-10-20] · [rebrand-apex] · chore(rebrand): migração de apex `royal-data-core.github.io` → `royaldatacore.github.io` (sem hífens) — 9 artefatos locais/defaults/fixtures/vcf/viva-URL reescritos; CI inocente (site/base derivados de `GITHUB_REPOSITORY_OWNER`, ADR-008 D7 ⇒ zero mudança de workflow); origem nova: HTML head/canonical/og/jsonld/robots/sitemap (17/17) + sweep dist: 0 ocorrências hifenadas · gates locais: check 0/0 · unit 63/63 · e2e 38/38 (build fiel ao CI) · a11y 16/16 · links 509/0 · LHCI prod 27/27 asserts (achado lateral NÃO-rebrand: bloco local `lighthouserc.json` falha no 404 — blocklist inerte 0.15.x, mesmo bug de ADR-008 D7 flag; receita prod = o gate canônico) · rename do org GH operador-side pendente (org + repo 1:1) ⇒ live flip em ~2 min pós-push · [7bed9ea](https://github.com/royaldatacore/royaldatacore.github.io/commit/7bed9ea)
- [2026-10-20] · [d-03-d04-closed] · feat(contact): **D-03/D-04 encerradas** — canais oficiais reais (email `royaldatacore@gmail.com`, WhatsApp/telefone `+5516997148778`), redes sociais verificadas (Instagram `@royaldatacore`, LinkedIn fundador `/in/leonardo-setti` — estratégia ratificada pelo operador) + artefato prometido `contato.vcf` ao vivo · **REV ADR-003 D3**: ofuscação de href migrada de entidades (`&#…`) para percent-encode do `@` (`%40`) — o Astro re-escapava entidades em atributo e o mailto nunca era clicável (latente: nenhuma âncora real existia ante D-03) · **WCAG 2.5.3 remediato**: `aria-label=addr` sem o texto visível violava Label-in-Name (axe ×5 assim que âncoras reais renderizaram) · gates: unit 63/63 · e2e 38/38 (novo contact.spec) · a11y 16/16 · links 509/0 · [3577f26](https://github.com/Royal-Data-Core/royal-data-core.github.io/commit/3577f26)
- [2026-10-20] · [d-05-closed] · chore(docs): GSC **propriedade URL-prefix VERIFICADA no apex** (confirmação do operador; token desde a meta [d3152df](https://github.com/Royal-Data-Core/royal-data-core.github.io/commit/d3152df)) — submissão de `sitemap-index.xml` + request-indexing (+ remoção da propriedade Domain/TXT) são cliques no console do operador · sitemap-0.xml 17/17 URLs na raiz, zero remanescente `/site-io/`; head na verificação: 13e8bf0\n- [2026-10-20] · [apex-migration] · chore(repo): rename `site-io` → `royal-data-core.github.io` (org-site) — site na RAIZ `https://royal-data-core.github.io/`; base `/` derivada shell-side (caso especial org-site nos 3 gates, [431547d](https://github.com/Royal-Data-Core/royal-data-core.github.io/commit/431547d)); smoke apex 12/12 ✓ incl. key file no root (IndexNow Option 1) + GSC meta ao vivo · [d3152df](https://github.com/Royal-Data-Core/royal-data-core.github.io/commit/d3152df) · [c37509c](https://github.com/Royal-Data-Core/royal-data-core.github.io/commit/c37509c)
- [2026-10-20] · [indexnow] · ci(deploy): passo pós-publish **non-blocking** notifica IndexNow (Bing/Yandex/Seznam/Naver) — key file público + `keyLocation` sob `/site-io/` (spec Option 2; root impossível em project pages); URLs = sitemap do artefato validado (17, /404 filtrada); prova real: HTTP 202 · 17 URLs · [bddbeb1](https://github.com/Royal-Data-Core/site-io/commit/bddbeb1)
- [2026-10-20] · [pipeline-status] · ci(badge): README passa a carregar um único badge de pipeline — `deploy.yml?branch=main` (battery+publish+smoke a cada push); badge de `ci.yml` removido (runs diretos = PR/develop; badge herdava falha de PRs fechados do Dependabot e `?event=workflow_call` = "no status": filhos não são runs próprios) · [6afb215](https://github.com/Royal-Data-Core/site-io/commit/6afb215)
- [2026-10-20] · [ADR-008 D7] · fix(seo): `robots.txt` gerado no build a partir de site/base (endpoint, padrão `rss.xml.ts`) — o estático apontava `Sitemap:` para subdomínio inexistente (`royaldatacore`, sem hífens) e sem prefixo `/site-io/`; crawlers batiam em 404 · [23b9c13](https://github.com/Royal-Data-Core/site-io/commit/23b9c13)
- [2026-10-20] · [ADR-010 D15 → exec] · ci(deps): PR #18 mergeado (squash) — primeiro PR de dependência GREEN da história (bateria 9/9: guard, build×3, verify×4, LHCI), minor peer-safe `prettier-plugin-tailwindcss 0.6.14→0.8.1`; semântica da fila confirmada: pending na fila é substituído (cancel-in-progress: false protege só o running) · [f29616f](https://github.com/Royal-Data-Core/site-io/commit/f29616f)
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
