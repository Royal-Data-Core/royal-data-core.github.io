# ROADMAP — Roteiro Sequencial de Produção

**Versão:** 3.0.0 · **Duração:** 8 dias úteis · **Custo:** R$ 0,00
**Regra de ouro:** cada Step produz **1 commit em `develop`**. Merge em `main` apenas ao fim de cada Fase, via release PR. Nenhum Step avança com gate vermelho.

---

## 🚧 FASE 0 — PRÉ-REQUISITOS (bloqueantes, ~2 h)

| # | Ação | Responsável | Saída |
|---|---|---|---|
| **0.1** | Responder **D-01**: handle GitHub disponível? `royaldatacore` livre? | 🧑 Humano | Decisão em `ADR-004` → status `ACCEPTED` |
| **0.2** | Responder **D-03**: email corporativo + telefone/WhatsApp definitivos | 🧑 Humano | `.env.example` preenchível |
| **0.3** | Responder **D-04**: URLs de LinkedIn e GitHub | 🧑 Humano | `site.json` |
| **0.4** | Responder **D-02**: CNAE principal real | 🧑 Humano | JSON-LD `ProfessionalService` |
| **0.5** | Criar organização/conta GitHub + repo vazio com o nome decidido | 🧑 Humano | repo inicializado |
| **0.6** | Configurar **Settings → Pages → Source = GitHub Actions** | 🧑 Humano | publishing source correto |
| **0.7** | Configurar **Branch protection** em `main` e `develop` (público ⇒ gratuito) | 🧑 Humano | gates ativos |
| **0.8** | Criar **Environment `github-pages`** com deployment branch policy = `main` | 🧑 Humano | deploy protegido |

> ⛔ `nexus-prime` mantém veredito **BLOCKED** para a Fase 1 enquanto 0.1–0.3 não forem respondidos.

---

## 🏗️ FASE 1 — FUNDAÇÃO (Dias 1–2)

| Step | Ação | Agente SDD | Gate de saída |
|---|---|---|---|
| **1.1** | `npm create astro@latest` (template **minimal**, TS strict, sem integração) | `frontend-astro` | `npm run dev` sobe |
| **1.2** | Materializar `package-lock.json` e confirmar versões reais (`npm view`) | `devops-platform` | lockfile commitado |
| **1.3** | Aplicar `astro.config.mjs` (C8) + `output: 'static'` | `architect-sdd` | `npm run build` gera `dist/index.html` |
| **1.4** | Tailwind v4 via `@tailwindcss/vite` + `global.css` com `@import "tailwindcss"` + tokens | `frontend-astro` | `npm run check` limpo |
| **1.5** | Criar `.nojekyll` em `public/` | `devops-platform` | `dist/.nojekyll` existe |
| **1.6** | Criar `.env.example`, `.editorconfig`, `.gitignore`, `tsconfig.json` (extends `astro/tsconfigs/strictest`) | `architect-sdd` | — |
| **1.7** | Copiar artefatos `.ai/**` desta consolidação | 🧑 Humano | `.ai/` completo |
| **1.8** | Configurar ESLint + Prettier + markdownlint + husky + lint-staged | `devops-platform` | `npm run lint` verde |
| **1.9** | `src/content/site.json` com dados da entidade (SDD-CONTEXT §1) | `content-strategist` | schema validado |
| **1.10** | `src/lib/url.ts::withBase()` + teste unitário | `frontend-astro` | coverage 100 % deste módulo |

**🎯 Critério de conclusão da Fase 1:** `npm run build` produz `dist/` com `index.html` stub + `.nojekyll` + `404.html`, e `npm run check && npm run lint` passam.
**📦 Release PR:** `develop` → `main`. Journal: entrada de fundação.

---

## 🔧 FASE 2 — INFRAESTRUTURA CI/CD (Dias 3–4)

| Step | Ação | Agente SDD | Gate |
|---|---|---|---|
| **2.1** | Implementar `scripts/verify-no-postinstall.mjs` (C5) | `devops-platform` | roda limpo local |
| **2.2** | Implementar `scripts/audit-bundle.mjs` (C6) | `static-analysis-enforcer` | roda sobre `dist/` stub |
| **2.3** | Implementar `scripts/lint-topology.mjs` (URLs hardcoded + forms remotos) | `static-analysis-enforcer` | 0 falsos positivos |
| **2.4** | Implementar `scripts/lint-copy.mjs` (lista negra de D1 + alegações) | `content-strategist` | 0 falsos positivos |
| **2.5** | `.github/workflows/ci.yml` (C1) — apenas jobs `guard` e `build` | `devops-platform` | workflow verde em PR |
| **2.6** | `.github/dependabot.yml` (C3) | `devops-platform` | 2 ecosystems ativos |
| **2.7** | `.github/PULL_REQUEST_TEMPLATE.md` (C4) + `CODEOWNERS` | `reviewer-gatekeeper` | template renderiza |
| **2.8** | Playwright + `tests/helpers/csp-guard.ts` (ADR-002 D5) | `qa-shiftleft` | helper importável |
| **2.9** | Vitest + coverage config (≥ 80 % critical path) | `qa-shiftleft` | relatório gera |
| **2.10** | `lighthouserc.json` com budgets de `SDD-CONTEXT §4` | `qa-shiftleft` | `npm run test:lh` local verde |
| **2.11** | Adicionar jobs `verify` e `lighthouse` ao `ci.yml` | `devops-platform` | 4 jobs verdes |
| **2.12** | `.github/workflows/deploy.yml` (C2) **desativado** (sem `on: push`) até Fase 4 | `devops-platform` | arquivo presente |
| **2.13** | Runbooks em `docs/runbooks/` (RFC-001 §6) | `devops-platform` | 6 runbooks |
| **2.14** | **INFRA-001:** `bash scripts/pin-actions.sh` → converter todas as tags em SHA | `devops-platform` | `pin:actions:check` exit 0 |

**🎯 Critério de conclusão:** PR deliberadamente quebrado (ex.: link externo sem SRI) é **bloqueado** pelo CI. Prova de que os gates funcionam.
**📦 Release PR** + Journal.

---

## 🎨 FASE 3 — CONTEÚDO & UI (Dias 5–7)

| Step | Ação | Spec | Agente | Gate |
|---|---|---|---|---|
| **3.1** | `BaseLayout.astro` — SEO, JSON-LD, skip-link, CSP-meta, referrer-meta | SPEC-001, SPEC-008 | `frontend-astro` + `integrations-security` | AC-001.1…9 + AC-008.1…5 |
| **3.2** | `SiteHeader.astro` + `SiteFooter.astro` (CNPJ, razão social, privacidade) | SPEC-001, SPEC-009 | `frontend-astro` | AC-009.1 |
| **3.3** | `ObfuscatedMailto.astro` + `src/lib/obfuscate.ts` + testes | SPEC-005 | `frontend-astro` | AC-005.3 |
| **3.4** | `/` Homepage (copy D1 §1) | SPEC-002 | `frontend-astro` + `content-strategist` | AC-002.1…6 |
| **3.5** | Content Collection `services` + `/servicos` (copy D1 §2) | SPEC-003 | `frontend-astro` | AC-003.1…6 |
| **3.6** | `/sobre` (copy D1 §3) | SPEC-003 | `content-strategist` | AC-003.5 |
| **3.7** | Content Collection `blog` + `PostLayout` + `/blog` + `/blog/[slug]` + `/blog/tag/[tag]` | SPEC-004 | `frontend-astro` | AC-004.1…8 |
| **3.8** | Publicar **3 artigos seed** (D1 §10) | SPEC-004 | `content-strategist` | AC-004.8 (references ≥ 1) |
| **3.9** | RSS (`/blog/rss.xml.ts`) + sitemap | SPEC-004 | `frontend-astro` | AC-004.6 |
| **3.10** | `/contato` (copy D1 §4) + `public/contato.vcf` | SPEC-005 | `frontend-astro` | AC-005.1…8 |
| **3.11** | `/privacidade` (copy D1 §5) | SPEC-009 | `content-strategist` | AC-009.2, 5 |
| **3.12** | `/404.astro` (copy D1 §6) | SPEC-006 | `frontend-astro` | AC-006.1…5 |
| **3.13** | `/qualidade` (copy D1 §8) | SPEC-002 | `frontend-astro` | — |
| **3.14** | Pagefind: `/busca` + `SearchDialog.astro` (única ilha) | SPEC-007 | `frontend-astro` | AC-007.1…7 |
| **3.15** | JSON-LD completo (`Organization`, `WebSite`, `Service`, `BlogPosting`, `FAQPage`, `BreadcrumbList`) | SPEC-001, 003, 004 | `content-strategist` | validador schema.org |
| **3.16** | Escrever suite E2E 1:1 com os cenários Gherkin | todas | `qa-shiftleft` | todos os cenários cobertos |
| **3.17** | Escrever suite a11y (axe-core, 2 viewports, todas as rotas) | todas | `qa-shiftleft` | 0 violações WCAG AA |

**🎯 Critério de conclusão:** Lighthouse 95/100/95/100 em mobile nas 5 rotas do critical path · axe-core 0 violações · linkinator 0 erros · coverage ≥ 80 %.
**📦 Release PR** + Journal.

---

## 🚀 FASE 4 — HARDENING & LANÇAMENTO (Dia 8)

| Step | Ação | Agente | Gate |
|---|---|---|---|
| **4.1** | Executar checklist pré-launch completo (SPEC-008) | `integrations-security` | 14/14 itens ✅ |
| **4.2** | Ativar **Enforce HTTPS** em Settings → Pages | 🧑 Humano | `curl -I` mostra HSTS |
| **4.3** | Validar `dist/` contra OWASP ASVS L3 (itens aplicáveis a site estático) | `integrations-security` | relatório anexado ao PR |
| **4.4** | Teste de penetração leve manual: XSS refletido na 404, open redirect, path traversal | `qa-shiftleft` | 0 achados |
| **4.5** | Habilitar `deploy.yml` (`on: push: branches: [main]`) | `devops-platform` | workflow ativo |
| **4.6** | **Primeiro deploy de produção** | `devops-platform` | smoke test HTTP 200 + CSP-meta presente |
| **4.7** | Validar site publicado manualmente (mobile real + desktop) | 🧑 Humano | checklist assinado |
| **4.8** | Submeter sitemap ao Google Search Console | 🧑 Humano | indexação iniciada |
| **4.9** | Verificar `page_url` de saída do `deploy-pages` | `devops-platform` | URL correta |
| **4.10** | Registrar métricas DORA baseline no Journal | `devops-platform` | tabela preenchida |

**🎯 Critério de conclusão:** site no ar em `https://<owner>.github.io[/]`, HTTP 200, HSTS ativo, CSP-meta presente, 404 custom servida, Lighthouse ≥ 95 em produção.

---

## 🔮 FASE 5 — PÓS-LANÇAMENTO (opcional / contínuo)

| # | Item | Condição | Custo |
|---|---|---|---|
| **5.1** | Domínio próprio `.com.br` (resolve **RRR-08**) | Recomendado fortemente para B2B | ~R$ 40/ano |
| **5.2** | Configurar DNS: `A` → `185.199.108.153` … `.111.153` e `AAAA` → `2606:50c0:8000::153` … `::153` (apex) **ou** `CNAME` → `<owner>.github.io` (subdomínio) | Após 5.1 | R$ 0 |
| **5.3** | Aguardar provisionamento do certificado Let's Encrypt + ativar Enforce HTTPS | Após 5.2 | R$ 0 |
| **5.4** | `RFC-002` Edge Hardening (Cloudflare Free) — resolve RRR-01/02/03/04 | **Exige Bypass + pilar 1 satisfeito** | R$ 0 |
| **5.5** | `ADR-006` Agendamento (Cal.com self-hosted) | Gatilho: 1º cliente B2B | R$ 0 (self-host) |
| **5.6** | Reavaliação trimestral do RRR | Recorrente | R$ 0 |
| **5.7** | Publicar 2 artigos/mês (SEO cauda longa) | Recorrente | R$ 0 |

> **5.2 — Restrição crítica:** o domínio apex **não pode** ter registros `A`/`AAAA`/`ALIAS`/`ANAME` extras além dos IPs do GitHub, nem `CNAME` em `www` apontando para outro lugar — caso contrário **o certificado TLS não é emitido** (GitHub Docs, *Verifying the DNS configuration*). O `CNAME` deve apontar para `<owner>.github.io` **sem** o nome do repositório.

---

## 📈 RESUMO DE CUSTO TOTAL

| Item | Custo |
|---|---|
| GitHub Free (repo público + Pages + Actions ilimitado) | **R$ 0,00** |
| Astro, Tailwind, Pagefind, Playwright, Vitest, LHCI, linkinator | **R$ 0,00** (FOSS) |
| Let's Encrypt (TLS) | **R$ 0,00** |
| Domínio `.com.br` (opcional, Fase 5.1) | ~R$ 40/ano |
| **Total obrigatório** | **R$ 0,00/mês** |
