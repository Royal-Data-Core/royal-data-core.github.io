# ADR-001 — Stack Estática: Astro 5 + Tailwind 4 + npm

**Status:** ACCEPTED · **Data:** 2026-10-16 · **Substitui:** decisão informal da v2.0 (pnpm)
**Enforcer:** `architect-sdd` · **Auditores:** `static-analysis-enforcer`, `reviewer-gatekeeper`

## Contexto
Requisitos simultâneos e potencialmente conflitantes:
1. Custo recorrente zero (`CONSTITUTION §C2`).
2. Zero runtime de servidor (`§C1`, restrição física do GitHub Pages).
3. Lighthouse ≥ 95 / A11y = 100 (`§C10`).
4. Blog com tipagem forte de conteúdo (`SPEC-004`).
5. Suportar refactor arquitetural contínuo — é um piloto deliberadamente mutável (premissa do cliente).
6. Bundle inicial ≤ 50 KB gzip.
7. Busca full-text sem backend.

## Decisão

### D1 — Astro 5 como SSG
Astro entrega HTML puro por padrão. Ilhas (`client:*`) são opt-in e granulares. Content Layer API provê schema Zod sobre MDX. O requisito (5) é decisivo: Astro permite trocar de framework de UI interno (React↔Svelte↔Vue) sem reescrever layouts, e trocar de SSG com custo moderado porque o conteúdo é MDX puro portável.

### D2 — Tailwind CSS v4 via `@tailwindcss/vite`
⚠️ **Correção da v2.0:** `@astrojs/tailwind` é integração de **Tailwind v3** e está em modo de manutenção. Tailwind v4 usa o plugin Vite e `@import "tailwindcss";` no CSS raiz. A deteção de fontes é automática (não há `content: []` em `tailwind.config.js`). O purge nativo atende o requisito de "0 classes não-utilizadas" do `static-analysis-enforcer`, medido pelo budget de CSS ≤ 30 KB gzip.

### D3 — npm como package manager (REVOGA pnpm da v2.0)
O contrato de `devops-platform` determina `npm ci --ignore-scripts` **exclusivamente**. Adotar pnpm exigiria `pnpm/action-setup` (action third-party a ser pinada por SHA) + Corepack + lockfile divergente. npm é pré-instalado no runner `ubuntu-24.04`, `actions/setup-node` provê cache nativo `cache: 'npm'`, e a cadeia de suprimentos passa integralmente pelo Dependabot já configurado para o ecossistema `npm`.
**Bun:** rejeitado para CI. Permitido apenas em dev local sob condição de `package-lock.json` como SSOT (`§C11`).

### D4 — `npm ci --ignore-scripts` + invariante verificada
O flag previne execução arbitrária de código em postinstall (OWASP ASVS V6.3, ataque de supply-chain tipo `event-stream`/`ua-parser-js`). Contudo, historicamente quebra `esbuild` e `sharp`.
**Resolução:** desde esbuild ≥ 0.16 e sharp ≥ 0.33, binários nativos são distribuídos via `optionalDependencies` de plataforma (`@esbuild/linux-x64`, `@img/sharp-linux-x64`) — **sem scripts de ciclo de vida**. A premissa deixa de ser presumida e passa a ser **enforçada**: `scripts/verify-no-postinstall.mjs` roda no job `guard` e falha closed se qualquer dependência (inclusive transitiva) declarar `preinstall`/`install`/`postinstall`.

### D5 — Pagefind para busca
FOSS (MIT), binário Rust único, gera índice estático fragmentado em `dist/_pagefind/`, carrega sob demanda via WASM. Custo zero, zero superfície de privacidade, nenhum request a terceiros. **Implicação:** exige `'wasm-unsafe-eval'` em `script-src` (`SPEC-008`) e adiciona ~13 KB gzip de JS apenas na rota de busca (lazy).

### D6 — linkinator para validação de links
`html-proofer` (Ruby) exigiria toolchain Ruby no runner. `lychee` (Rust) exigiria download de binário com verificação de checksum manual. **linkinator** é npm (Apache-2.0), entra na cadeia já coberta por Dependabot, não requer action third-party não-pinada.

### D7 — Output mode: `static` (explícito)
`astro.config.mjs` declara `output: 'static'`. Qualquer tentativa de `output: 'server'` ou `'hybrid'` falha o gate `guard` (grep no config).

## Consequências
✅ Zero JS por padrão ⇒ LCP dominado por HTML+CSS ⇒ Performance ≥ 95 atingível sem heroísmo.
✅ Tipagem de conteúdo elimina classe inteira de bug de frontmatter.
✅ Portabilidade de conteúdo (MDX) preserva o requisito de mutabilidade arquitetural.
⚠️ Astro 5 tem breaking changes vs. 4 (`content.config.ts`, `<ClientRouter />`, Content Layer `render()`). **Mitigação:** specs já escritas contra a API 5.
⚠️ `npm ci --ignore-scripts` exige manutenção do gate D4. Aceito: o gate é barato e determinístico.

## Alternativas Rejeitadas
| Alternativa | Motivo da rejeição |
|---|---|
| **Jekyll** (default Pages) | Ruby; sem type-safety; build mais lento; ecossistema de plugins em declínio; exigiria `.nojekyll` de qualquer forma. |
| **Hugo** | Performance de build superior, porém Go templates têm curva íngreme e não oferecem Content Collections tipadas nativas. Menor aderência ao requisito (5). |
| **Eleventy** | Excelente e minimalista, mas exige montagem manual de Content Collections + Zod + image optimization. Over-engineering de setup. |
| **Next.js (export estático)** | Proibição contratual de `architect-sdd`. `output: 'export'` é modo degradado: sem Image Optimization nativo, várias features quebram. |
| **VitePress / Docusaurus** | Orientados a documentação, não a site institucional híbrido com vitrine B2B. |
| **Site hand-written HTML** | Não escala para blog com > 10 posts. Viola DRY. |

## Reversibilidade
**Moderada.** Conteúdo (MDX) e copy migram com custo ~zero. Layouts e componentes exigem reescrita (estimativa: 3–5 dias de trabalho). A decisão é reversível mediante `ADR-00X` sucessor + Bypass se houver lock-in detectado.

## Referências
Astro Docs v5 (Content Layer API, ClientRouter, `output: 'static'`) · Tailwind CSS v4 Upgrade Guide · Pagefind Docs · OWASP ASVS v4.0.3 §V6 (Built Components) · npm Docs (`ci --ignore-scripts`) · esbuild/sharp platform-binary migration notes.
