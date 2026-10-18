# BLUEPRINT — TOPOLOGIA DE DIRETÓRIOS (TRAVADA por `architect-sdd`)

**Versão:** 3.0.0 · **Qualquer desvio exige ADR.**

```
royal-data-core/
├── .ai/                              # SSOT — não publicado no build
│   ├── SDD-CONTEXT.md
│   ├── CONSTITUTION.md
│   ├── BLUEPRINT.md
│   ├── ROADMAP.md
│   ├── AGENT-PLAYBOOK.md
│   ├── adr/
│   │   ├── ADR-000-language-policy.md
│   │   ├── ADR-001-static-stack.md
│   │   ├── ADR-002-pages-security-limits.md
│   │   ├── ADR-003-contact-zero-saas.md
│   │   ├── ADR-004-repo-topology.md
│   │   └── ADR-TEMPLATE.md
│   └── specs/
│       ├── features/SPEC-001 … SPEC-009
│       └── rfc/RFC-001, RFC-002
├── .github/
│   ├── workflows/ci.yml
│   ├── workflows/deploy.yml
│   ├── dependabot.yml
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── CODEOWNERS
├── .vscode/extensions.json             # astro-vscode, tailwind, eslint, prettier
├── public/
│   ├── favicon.svg
│   ├── robots.txt
│   ├── contato.vcf                   # RFC 6350 (ADR-003 D1)
│   ├── og-default.png                # 1200×630, ≤ 120 KB, AVIF+PNG fallback
│   └── icons/                        # SVG inline-able, sem biblioteca de ícones
├── scripts/
│   ├── verify-no-postinstall.mjs     # ADR-001 D4 — gate
│   ├── audit-bundle.mjs              # §C10 — gate
│   ├── pin-actions.sh                # BYPASS-001 exit plan
│   └── new-post.mjs                  # scaffolding de artigo (§C11 liberdade instrumental)
├── src/
│   ├── components/
│   │   ├── BaseLayout.astro          # CSP-meta, referrer, SEO, JSON-LD slot
│   │   ├── SiteHeader.astro
│   │   ├── SiteFooter.astro          # CNPJ, razão social, canais (SPEC-009)
│   │   ├── ObfuscatedMailto.astro    # ADR-003 D3
│   │   ├── SocialLinks.astro
│   │   ├── ServiceCard.astro
│   │   ├── PostCard.astro
│   │   ├── JsonLd.astro              # injeta <script type="application/ld+json">
│   │   ├── SkipLink.astro            # a11y — primeiro elemento focável
│   │   └── search/SearchDialog.astro # SPEC-007 — única ilha do site
│   ├── layouts/
│   │   ├── PageLayout.astro          # páginas institucionais
│   │   └── PostLayout.astro          # artigos (TOC, JSON-LD BlogPosting, tempo de leitura)
│   ├── lib/
│   │   ├── url.ts                    # withBase() — ADR-004. OBRIGATÓRIO em toda URL interna
│   │   ├── seo.ts                    # monta meta/OG/Twitter/canonical
│   │   ├── jsonld.ts                 # builders tipados de schema.org
│   │   ├── date.ts                   # formatação PT-BR determinística (Intl, TZ fixa)
│   │   └── obfuscate.ts              # entity-encode (ADR-003 D3)
│   ├── styles/global.css             # @import "tailwindcss"; + tokens
│   ├── content.config.ts             # Astro 5 Content Layer — schemas Zod (F-07)
│   ├── content/
│   │   ├── blog/*.mdx
│   │   ├── services/*.mdx            # cada serviço = 1 doc tipado
│   │   └── site.json                 # dados da entidade (SDD-CONTEXT §1)
│   └── pages/
│       ├── index.astro               # SPEC-002
│       ├── servicos.astro            # SPEC-003
│       ├── sobre.astro               # SPEC-003
│       ├── qualidade.astro           # S3 — laboratório vivo
│       ├── contato.astro             # SPEC-005
│       ├── privacidade.astro         # SPEC-009
│       ├── 404.astro                 # SPEC-006
│       ├── blog/
│       │   ├── index.astro           # SPEC-004
│       │   ├── [...slug].astro       # SPEC-004
│       │   ├── rss.xml.ts            # SPEC-004
│       │   └── tag/[tag].astro       # SPEC-004
│       └── busca.astro               # SPEC-007
├── tests/
│   ├── helpers/csp-guard.ts          # ADR-002 D5 — falha em violação de CSP
│   ├── helpers/fixtures.ts
│   ├── e2e/*.spec.ts                 # 1:1 com cenários Gherkin das SPECs
│   ├── a11y/*.spec.ts                # axe-core, 2 viewports
│   └── unit/*.test.ts                # Vitest — src/lib/**
├── .editorconfig
├── .env.example                      # SITE_BASE, PUBLIC_* (nunca SECRET_*)
├── .gitignore                        # inclui dist/, node_modules/, .astro/, coverage/
├── .nojekyll                         # OBRIGATÓRIO — desabilita build Jekyll padrão
├── astro.config.mjs
├── eslint.config.mjs
├── .prettierrc.json
├── lighthouserc.json
├── playwright.config.ts
├── tsconfig.json                     # extends astro/tsconfigs/strictest
├── vitest.config.ts
├── package.json
├── package-lock.json                 # SSOT de versões (§C11)
└── README.md                         # JOURNAL (§C6)
```

## REGRAS DE TOPOLOGIA
1. `.nojekyll` na **raiz do artefato publicado**. Como usamos Actions com `upload-pages-artifact`, o `.nojekyll` deve estar em `public/` (é copiado para `dist/`). Sem ele, o Pages pode tentar build Jekyll sobre o output.
2. `src/content.config.ts` (não `src/content/config.ts`) — Astro 5.
3. Toda URL interna passa por `src/lib/url.ts::withBase()`. Proibido literal absoluto.
4. Zero arquivo secreto no repo. `.env.example` lista apenas chaves não-secretas.
5. `dist/` jamais é commitado (deploy via artifact, não via branch `gh-pages`).
6. `.ai/` é excluído do build (não está em `src/` nem `public/`).

## GRAFO DE DEPENDÊNCIAS (direção permitida)
```
pages → layouts → components → lib
pages → content (via getCollection/render)
components → lib
lib → (nada interno)
```
Import reverso (ex.: `lib` importa de `components`) = falha de lint (`eslint-plugin-boundaries` ou regra `no-restricted-imports`).
