# SDD-CONTEXT — DOSSIÊ DE PROJETO (SSOT RAIZ)

**Projeto:** royal-data-core
**Versão do Dossiê:** 3.0.0
**Ratificado:** 2026-10-16
**Ecossistema SDD:** v8.0.0-AFA
**Precedência:** Este arquivo é a fonte de verdade FACTUAL. `.ai/CONSTITUTION.md` é a fonte de verdade NORMATIVA. Em conflito de fato, este prevalece; em conflito de regra, a CONSTITUTION prevalece.

---

## 1. ENTIDADE JURÍDICA (dados verificados)

| Campo | Valor | Fonte |
|---|---|---|
| Razão Social | ROYAL DATA CORE LTDA | cnpj.biz/69527139000194 |
| CNPJ | 69.527.139/0001-94 | idem |
| Natureza | Sociedade Limitada Unipessoal (SLU) | declarado pelo cliente |
| Data de Fundação | 2026-10-06 | idem |
| Município / UF | Matão / São Paulo | idem |
| CNAE Principal | `[PENDING-VERIFICATION]` | ⚠️ não exposto na fonte consultada |
| Porte | Microempresa (ME) — inferido | verificar |

> ⚠️ **DIRETIVA VINCULANTE `content-strategist`:** A PJ tem **10 dias de existência** na data de ratificação.
> É **PROIBIDO** qualquer claim de tempo de mercado, número de clientes atendidos pela PJ, ou histórico corporativo.
> Framing obrigatório: **empresa recém-constituída, profissional com trajetória prévia**. Toda alegação de experiência deve ser atribuível à pessoa física e, quando quantificada, acompanhada de fonte verificável.
> Base legal: CDC Art. 37 (publicidade enganosa) + AFA Kill Switch Ético.

---

## 2. OBJETO DO SITE

Site de **contexto híbrido** com três superfícies coexistindo sob um único build estático:

| Superfície | Audiência | Objetivo | Rotas |
|---|---|---|---|
| **S1 — Vitrine Profissional** | Decisores B2B / RH (CLT) | Gerar contato qualificado | `/`, `/servicos`, `/sobre` |
| **S2 — Blog Técnico** | Pares de engenharia, buscadores | Autoridade técnica + SEO cauda longa | `/blog`, `/blog/[slug]` |
| **S3 — Laboratório Vivo** | Clientes de QA | Provar competência por evidência | `/qualidade` (dashboards públicos do próprio repo) |

> **Insight estratégico ratificado:** S3 é o diferencial competitivo. Um site de consultoria de QA cujos próprios relatórios de Lighthouse, cobertura de testes e histórico de CI são públicos e linkados é uma **prova de competência autoevidente**. Nenhum concorrente faz isso.

---

## 3. RESTRIÇÕES DE PLATAFORMA (não-negociáveis)

Hospedagem: **GitHub Pages**, plano **GitHub Free (conta pessoal)**, repositório **PÚBLICO**.

| Restrição | Limite | Margem de projeto adotada |
|---|---|---|
| Tamanho do repo | 1 GB recomendado | **≤ 500 MB** (hard gate no CI) |
| Tamanho do site publicado | 1 GB | **≤ 100 MB** |
| Timeout de deploy | 10 min (hard) | **≤ 6 min** |
| Banda | 100 GB/mês (soft) | **≤ 40 GB/mês** projetado |
| Builds | 10/hora (soft, N/A via Actions) | N/A — usamos Actions custom |
| Rate limit | HTTP 429 | mitigado por cache de assets imutáveis |
| **Server-side runtime** | **PROIBIDO** (PHP, Ruby, Python, Node) | 100% estático |
| **Headers HTTP customizados** | **NÃO SUPORTADO** | ver `ADR-002` |
| **MIME types customizados** | NÃO suportado | N/A (mime-db cobre tudo que usamos) |
| Actions minutes | ilimitado em repo público | budget interno ≤ 1500 min/mês |
| Sites por conta | 1 user-site | ver `ADR-004` |

**Referências normativas:** GitHub Pages Docs (Usage limits, MIME types, Securing with HTTPS) · GitHub Plans Docs · CSP Level 3 (W3C) · OWASP ASVS v4.0.3 L3 · RFC 9110 (HTTP Semantics).

---

## 4. ORÇAMENTOS TÉCNICOS (BUILD BUDGETS — `nexus-prime` enforça)

| Métrica | Budget | Gate | Ferramenta |
|---|---|---|---|
| Lighthouse Performance | **≥ 95** | hard fail | `@lhci/cli` |
| Lighthouse Accessibility | **= 100** | hard fail | `@lhci/cli` |
| Lighthouse Best Practices | **≥ 95** | hard fail | `@lhci/cli` |
| Lighthouse SEO | **= 100** | hard fail | `@lhci/cli` |
| LCP | **≤ 2500 ms** | hard fail | LHCI + Core Web Vitals |
| CLS | **≤ 0.10** | hard fail | idem |
| INP | **≤ 200 ms** | hard fail | idem |
| TBT | **≤ 200 ms** | hard fail | idem |
| JS inicial (gzip) | **≤ 50 KB** | hard fail | `scripts/audit-bundle.mjs` |
| CSS total (gzip) | **≤ 30 KB** | hard fail | idem |
| JS por componente (gzip) | **≤ 5 KB** | warn→fail | idem |
| Imagens | AVIF/WebP, `width`+`height` explícitos | hard fail | `frontend-astro` |
| Build Astro (cold) | **≤ 8 min** | hard fail | CI timeout |
| Build Astro (warm) | **≤ 4 min** | hard fail | CI timeout |
| Deploy total | **≤ 6 min** | hard fail | timeout-minutes: 6 |
| Cobertura (critical path) | **≥ 80 %** | hard fail | Vitest + c8 |
| Viewports testados | 375×667 e 1280×800 | obrigatório | Playwright |

---

## 5. STACK RATIFICADA (ver `ADR-001`)

| Camada | Escolha | Versão-alvo | Justificativa |
|---|---|---|---|
| SSG | **Astro** | `^5.0.0` | Islands Architecture = zero JS por padrão. Content Layer API nativa. |
| Build | Vite (embutido) | via Astro | — |
| Pacote | **npm** | ≥ 10 | Contrato `devops-platform`: `npm ci --ignore-scripts`. Pré-instalado no runner. |
| Runtime CI | Node | `22.x` (LTS) | Alinhado ao suporte do Astro 5. |
| Estilização | **Tailwind CSS** | `^4.0.0` | v4 usa `@tailwindcss/vite` + deteção automática de fontes (purge nativo). |
| Conteúdo | **Astro Content Collections** (MDX) | nativo | Schema Zod obrigatório. Zero dependência externa. |
| Busca | **Pagefind** | `^1.3.0` | FOSS (MIT), WASM, 100% client-side, índice gerado no build. Custo zero. |
| Sitemap | `@astrojs/sitemap` | `^3.x` | SEO técnico. |
| RSS | `@astrojs/rss` | `^4.x` | Distribuição B2B. |
| E2E | **Playwright** | `^1.49` | Derivado dos cenários Gherkin. |
| A11y | `@axe-core/playwright` | `^4.x` | WCAG 2.1 AA. |
| Unit | **Vitest** + `@vitest/coverage-v8` | `^2.x` | Funções utilitárias não-triviais. |
| Perf | `@lhci/cli` | `^0.14` | Budgets rígidos. |
| Links | **`linkinator`** | `^6.x` | npm (Apache-2.0). Evita action third-party não-pinada. |
| Lint | `astro check`, ESLint, Prettier, markdownlint-cli2 | latest | — |
| Hosting | GitHub Pages via Actions | — | Custo zero. |
| CI/CD | GitHub Actions | — | Custo zero em repo público. |

### ❌ Stack EXPLICITAMENTE REJEITADA

| Rejeitado | Motivo |
|---|---|
| Next.js / Nuxt / Remix / SvelteKit (SSR) | `architect-sdd` PROIBIÇÃO contratual. Exigem runtime de servidor. |
| Jekyll (default do Pages) | Build Ruby lento, sem type-safety, ecossistema em declínio. `.nojekyll` obrigatório. |
| `pnpm` / `bun` / `yarn` | Conflito com contrato `npm ci --ignore-scripts`. Risco de lockfile drift. |
| CMS headless (Decap, Sanity, Contentful, Strapi) | Narrowing de escopo `ADR-003`. Conteúdo é versionado em Git. |
| Formspree / Getform / Web3Forms | Narrowing de escopo `ADR-003`. Superfície de spam + dependência SaaS. |
| Google Analytics / GA4 / Meta Pixel / Hotjar | **Kill Switch Ético** ativo. Viola LGPD default-on e `CONSTITUTION §C7`. |
| Cal.com / Calendly (v1.0) | SaaS, lock-in, superfície LGPD. Deferido para `ADR-006` (exigirá Bypass). |
| FontAwesome / ícones via CDN | Peso de bundle + dependência externa sem SRI. Usar SVG inline. |
| Cloudflare (v1.0) | Lock-in de edge. Ver `RFC-002` (deferido). |

---

## 6. GLOSSÁRIO CANÔNICO (elimina ambiguidade semântica)

| Termo | Definição vinculante |
|---|---|
| **SSG** | Static Site Generator. Produz apenas HTML/CSS/JS/WASM. |
| **Island** | Componente Astro hidratado (`client:*`). Exceção, não regra. |
| **Critical Path** | Rotas `/`, `/servicos`, `/blog`, `/blog/[slug]`, `/contato`. |
| **Bundle inicial** | Soma gzip de todos os assets JS carregados no primeiro paint de uma rota do Critical Path. |
| **Spec ID** | `SPEC-NNN`. Todo PR referencia ≥ 1. Sem referência = rejeição automática (`reviewer-gatekeeper`). |
| **ADR** | Architecture Decision Record. Obrigatório para qualquer mudança de topologia (`CONSTITUTION §C3`). |
| **Bypass** | Exceção a uma regra. Exige **3 pilares simultâneos**: força maior + rota FOSS + prazo. Ausência de 1 pilar = recusa. |
| **Kill Switch** | Recusa imediata e irrevogável. Não admite Bypass. |
| **RRR** | Registro de Risco Residual. Risco aceito conscientemente, com mitigação compensatória documentada. |
| **Gate** | Job de CI cujo insucesso bloqueia merge/deploy. |
| **Journal** | Seção reversa-cronológica do `README.md` registrando decisões arquiteturais. |

---

## 7. NARROWING DE ESCOPO DE AGENTES (derrogações explícitas)

Estas capacidades existem nos contratos dos agentes mas estão **DESABILITADAS** para este projeto. Agente que as exercer produz artefato rejeitável.

| Agente | Capacidade DESABILITADA | Base |
|---|---|---|
| `integrations-security` | Configurar Formspree/Getform/Web3Forms | `ADR-003` + diretiva do cliente |
| `integrations-security` | Configurar DecapCMS + fluxo OAuth | `ADR-003` |
| `integrations-security` | Configurar GA4 / qualquer tracker | Kill Switch Ético |
| `integrations-security` | Emitir headers HTTP de segurança | **Fisicamente impossível** no GitHub Pages → `ADR-002` |
| `integrations-security` | CSP via Astro middleware | Substituída por `<meta http-equiv>` → `SPEC-008` |
| `content-strategist` | CTA via formulário | Substituído por `mailto:`/`wa.me` → `SPEC-005` |
| `architect-sdd` | Sugerir SSR/ISR/hybrid output | `CONSTITUTION §C1` |
| `frontend-astro` | `client:load` / `client:only` | Proibido sem Bypass Protocol escrito no PR |
| `devops-platform` | Deploy para qualquer host ≠ GitHub Pages | `CONSTITUTION §C2` |
| Todos | Idioma ≠ EN para identificadores | `ADR-000` |

### ✅ Capacidades MANTIDAS e priorizadas
`integrations-security`: CSP-meta, SRI, headers de referrer via `<meta name="referrer">`, checklist pré-launch, prevenção de vazamento de secret no bundle.
`devops-platform`: workflows Actions, OIDC least-privilege, caching, Dependabot, runbooks, DORA.
`content-strategist`: JSON-LD, copy PAS, SEO cauda longa, backing de claims.

---

## 8. REGISTRO DE RISCO RESIDUAL (RRR)

| ID | Risco | Severidade | Mitigação compensatória | Aceite |
|---|---|---|---|---|
| **RRR-01** | `frame-ancestors` inaplicável ⇒ site pode ser embutido em iframe (clickjacking) | Baixa | Site não possui autenticação, formulários, transações ou dados sensíveis. Nenhum estado mutável. | ACEITO — `ADR-002` |
| **RRR-02** | `X-Content-Type-Options: nosniff` inaplicável | Baixa | GitHub Pages serve MIME via mime-db (750+ tipos). Nenhum upload de usuário. Nenhum asset de tipo ambíguo. | ACEITO |
| **RRR-03** | `Permissions-Policy` inaplicável | Baixa | Site não usa câmera, microfone, geolocalização, pagamento ou USB. Nenhuma API sensível invocada. | ACEITO |
| **RRR-04** | CSP Report-Only impossível ⇒ sem telemetria de violações | Média | `report-sample` omitido. Testes Playwright falham se `console.error` de CSP aparecer em qualquer rota. | ACEITO com gate |
| **RRR-05** | IP do visitante é logado pelo GitHub (fora do nosso controle) | Baixa | Divulgado em `/privacidade` (LGPD Art. 18). Operador = GitHub Inc. Base legal = legítimo interesse do operador da infraestrutura. | ACEITO — `SPEC-009` |
| **RRR-06** | Repo público expõe todo o código-fonte | Baixa | Nenhum secret no repo (gate `guard` + `gitleaks`). Código aberto é ativo de marketing técnico, não passivo. | ACEITO |
| **RRR-07** | Email exposto no HTML pode ser coletado | Média | Codificação de entidades em build-time (`SPEC-005`). Filtragem no provedor de email. Endereço dedicado. | ACEITO |
| **RRR-08** | `*.github.io` não transmite autoridade B2B plena | Média | Domínio próprio `.com.br` recomendado na Fase 4 (único custo: ~R$ 40/ano). Não bloqueante. | ACEITO temporariamente |
| **RRR-09** | Banda soft-limit 100 GB/mês | Baixa | Assets imutáveis com hash no filename ⇒ cache agressivo. Sem vídeo. Imagens AVIF. Projeção ≤ 40 GB. | ACEITO |

**Saída do RRR:** `RFC-002` (Edge Hardening via Cloudflare Free) resolve RRR-01/02/03/04 de uma vez. **Deferido** — exige Bypass Protocol com 3 pilares.

---

## 9. DECISÕES PENDENTES (bloqueiam fases específicas)

| ID | Decisão | Bloqueia | Default se não respondido |
|---|---|---|---|
| **D-01** | O handle GitHub é `royaldatacore`? Ou o repo será `<handle-pessoal>.github.io`? Ou repo de projeto? | Fase 1 (Step 1.1) | `ADR-004` opção A |
| **D-02** | CNAE principal real da PJ (para JSON-LD `ProfessionalService`) | Fase 3 (`SPEC-002`) | omitir campo `hasOfferCatalog` detalhado |
| **D-03** | Email corporativo definitivo + telefone/WhatsApp | Fase 3 (`SPEC-005`) | placeholders `[[EMAIL]]`/`[[PHONE]]` em `.env.example` |
| **D-04** | LinkedIn / GitHub / outras redes para links sociais | Fase 3 | apenas GitHub |
| **D-05** | Domínio próprio na Fase 4? | Fase 4 | manter `*.github.io` |
