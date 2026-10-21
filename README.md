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

| Dimensão       | Snapshot medido (bateria local completa, 2026-10-20)                                                                                                                                                      |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Artefato       | 18 páginas estáticas (Astro SSG) · zero hydrated JS, exceto busca Pagefind (SPEC-007)                                                                                                                     |
| Bundle         | JS **2.09 KB** gzip (orçamento 50) · CSS **4.03 KB** gzip (orçamento 30) · audit **0 violações**                                                                                                          |
| Lighthouse     | 9 URLs: perf **0.99–1.0** · a11y **1.0** · best-practices **1.0** · SEO **1.0** · LCP ≤ 1733 ms                                                                                                           |
| Testes         | e2e **28/28** (2 viewports) · a11y axe-core **16/16** · unit **56/56** (src/lib crítica)                                                                                                                  |
| Cobertura real | statements **95 %** · branches **85.5 %** · funções **100 %** · linhas **94.9 %** (gate ≥ 80 %)                                                                                                           |
| Links          | **336 checks / 0 broken** · escaneamento hermético (zero rede)                                                                                                                                            |
| Code health    | 69 arquivos rastreados · **bloat zero**: sem handlers mortos, sem deps fantasmas, sem stubs                                                                                                               |
| Supply chain   | `npm audit --omit=dev` **0 vulnerabilidades** · 20 Actions SHA-pinadas + 1 reuse local · 0 lifecycle scripts · Dependabot majors npm **held** (ADR-gated), minors/patches validados pela bateria completa |
| Infra          | GitHub Pages + Actions (OIDC, least-privilege) · custo **R$ 0,00/mês**                                                                                                                                    |

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

| Rota                       | Papel                                                                        |
| -------------------------- | ---------------------------------------------------------------------------- |
| `/`                        | Vitrine — proposta de valor, prova (case), CTA                               |
| `/servicos/`               | Catálogo de serviços + pacote de engajamento                                 |
| `/blog/` + `/blog/<slug>/` | Blog técnico S1 (3 posts, MDX, Shiki, tags)                                  |
| `/blog/tag/<tag>/`         | 8 páginas de tag                                                             |
| `/contato/`                | Canal de conversão: mailto/WhatsApp direto — sem formulário/CRM (ADR-003 D1) |
| `/busca/`                  | Busca client-side Pagefind (zero query a servidores)                         |
| `/privacidade/`            | LGPD — política de privacidade                                               |
| `/404/`                    | Página de erro customizada                                                   |

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

### §Scripts — automação versionada (CONSTITUTION §C11c)

| Script                      | Função                                                                                               |
| --------------------------- | ---------------------------------------------------------------------------------------------------- |
| `audit-bundle.mjs`          | Auditoria determinística do artefato: budgets, CSP, externos, SRI, `data-testid`                     |
| `verify-no-postinstall.mjs` | Invariante ADR-001 D4 — nenhum lifecycle script (torna `npm ci --ignore-scripts` seguro)             |
| `test-links.mjs`            | Gate hermético de integridade de links (espelho `/site-io/`, zero rede)                              |
| `lint-copy.mjs`             | §C9 — vocabulário de marketing não verificável (gate bloqueante no guard CI)                         |
| `lint-topology.mjs`         | ADR-004 — `withBase()` obrigatório em URL interna                                                    |
| `generate-og.mjs`           | Regenera `public/og-default.png` (sharp local, sem rede) — run-once                                  |
| `new-post.mjs`              | Scaffolding de post (frontmatter Zod + slug)                                                         |
| `notify-indexnow.mjs`       | IndexNow — notifica Bing/Yandex/Seznam/Naver a cada publish (key file + `keyLocation`, non-blocking) |
| `commit-msg-check.mjs`      | Hook `commit-msg` — Conventional Commits (EN) sem dependências externas                              |
| `pin-actions.sh`            | RFC-001 §2.7 — pin de Actions por SHA-40 via API oficial; `--check` = gate                           |

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
