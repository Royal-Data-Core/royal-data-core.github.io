# ADR-001: Stack Selection and Project Blueprint

## Status
**ACCEPTED** — Foundational ADR. Supersedes any conflicting stack choice.

## Context
The project is a greenfield B2B IT consultancy website targeting CTOs and IT Directors in the Brazilian market. The site must signal technical authority through its own architecture: zero-cost hosting, elite Core Web Vitals (Lighthouse 95+), and a codebase that serves as a silent portfolio for technical buyers.

Constraints:
- Solo founder operating the project.
- Zero recurring infrastructure cost.
- GitHub Pages as the sole hosting target (static-only, no backend).
- Content must be editable by a non-technical stakeholder via a Git-based CMS.
- Target audience reads Portuguese; technical documentation is in English.

The following tensions had to be resolved:
1. **Performance vs. interactivity** — How much JavaScript is acceptable?
2. **Simplicity vs. scalability** — How much structure is needed on day 1?
3. **Developer experience vs. bundle cost** — Which tools justify their weight?

## Decision

### Stack Selection (Pinned Versions)

| Layer | Choice | Version | Rationale |
|---|---|---|---|
| **Framework** | Astro | 5.x (latest stable) | Islands architecture ships 0 KB JS by default. Content Collections provide type-safe data. View Transitions replace SPA frameworks for page navigation. |
| **Styling** | Tailwind CSS | 4.x | Utility-first eliminates CSS file management. v4 uses a Rust-based engine (Lightning CSS) — faster builds, smaller output. No config file needed for basic setup. |
| **Language** | TypeScript | 5.x (strict mode) | Type safety catches bugs at build time. Strict mode is non-negotiable. |
| **Runtime** | Node.js | 22 LTS | Active LTS until April 2027. Aligns with Astro's recommended runtime. |
| **Package Manager** | pnpm | 10.x | 2-3x faster than npm, disk-efficient via content-addressable store, strict dependency resolution prevents phantom deps. |
| **CMS** | DecapCMS | 3.x | Git-based, runs 100% in the browser, no backend required. Free tier sufficient for solo operation. |
| **Forms** | Formspree | Free tier | 50 submissions/month free. Honeypot + client-side validation mitigate spam. |
| **Analytics** | GoatCounter | Free tier | Privacy-friendly, lightweight (<1 KB script), self-hostable if needed. |
| **Testing (E2E)** | Playwright | latest | Faster than Cypress, native multi-browser, better CI integration. |
| **Testing (Unit)** | Vitest | latest | Native Vite integration, shares config with Astro, fast. |
| **Validation** | Zod | latest | Type-safe schema validation for Content Collections and forms. |
| **Deployment** | GitHub Actions + Pages | — | Zero cost, global CDN (Fastly), OIDC authentication. |

### Rejected Alternatives

| Alternative | Rejection Reason |
|---|---|
| Next.js / Nuxt / Remix | SSR/ISR adds complexity and runtime cost for a content site. Astro's SSG is sufficient and ships less JS. |
| React / Vue / Svelte as framework | Adds JS to every page. Astro allows islands (React/Vue/Svelte components) only where hydration is strictly needed — and none is needed on day 1. |
| npm / yarn | npm is slower and less strict. yarn v1 is deprecated. pnpm wins on speed, disk, and correctness. |
| Netlify / Vercel | Free tiers are generous but introduce vendor lock-in and potential cost surprise at scale. GitHub Pages is permanent and free. |
| WordPress / Contentful | WordPress requires a server. Contentful has a free tier but adds SaaS dependency. DecapCMS is FOSS and Git-native. |
| Google Analytics | Heavy (~45 KB), privacy-hostile, bad for Core Web Vitals. GoatCounter is <1 KB and privacy-friendly. |
| Cypress | Slower than Playwright, Electron-based, worse CI story. |

### Project Blueprint

The directory structure enforces separation of concerns and aligns with Astro's conventions:

    /
    ├── .ai/                              # SDD artifacts (specs, handoffs, runbooks)
    │   ├── specs/
    │   │   ├── adr-*.md                  # Architecture Decision Records
    │   │   ├── rfc-*.md                  # Requests for Comments
    │   │   ├── prd-*.md                  # Product Requirements (pt-br)
    │   │   ├── copy-brief-*.md           # Copy briefings (pt-br)
    │   │   ├── features/                 # Gherkin feature files
    │   │   │   └── *.feature
    │   │   ├── runbooks/                 # Operational procedures
    │   │   │   └── *.md
    │   │   └── handoffs/                 # Agent-to-agent handoff docs
    │   │       └── *.md
    │   └── workflows/                    # SDD workflow definitions
    │       └── *.md
    │
    ├── .github/
    │   ├── workflows/
    │   │   ├── ci.yml                    # PR gates (lint, test, lighthouse)
    │   │   └── deploy.yml                # Production deploy to Pages
    │   └── pull_request_template.md      # SDD review checklist
    │
    ├── .opencode/
    │   └── agents/                       # SDD agent prompts (8 agents)
    │       └── *.md
    │
    ├── public/                           # Static assets (copied as-is)
    │   ├── admin/
    │   │   └── config.yml                # DecapCMS configuration
    │   ├── favicon.svg
    │   └── robots.txt
    │
    ├── src/
    │   ├── components/
    │   │   ├── ui/                       # Primitives (Button, Card, Badge)
    │   │   ├── sections/                 # Page sections (Hero, Features, CTA)
    │   │   ├── schema/                   # JSON-LD structured data
    │   │   └── SEO.astro                 # Reusable <head> component
    │   │
    │   ├── content/                      # Astro Content Collections
    │   │   ├── config.ts                 # Zod schemas for each collection
    │   │   ├── blog/                     # Blog posts (Markdown/MDX)
    │   │   ├── services/                 # Service offerings
    │   │   └── authors/                  # Blog authors
    │   │
    │   ├── layouts/
    │   │   ├── BaseLayout.astro          # HTML shell, <head>, CSP headers
    │   │   └── BlogLayout.astro          # Blog-specific layout
    │   │
    │   ├── pages/                        # File-based routing
    │   │   ├── index.astro               # Home
    │   │   ├── sobre.astro               # About
    │   │   ├── contato.astro             # Contact (with Formspree)
    │   │   ├── servicos/
    │   │   │   ├── index.astro           # Services listing
    │   │   │   └── [slug].astro          # Dynamic service pages
    │   │   ├── blog/
    │   │   │   ├── index.astro           # Blog listing
    │   │   │   └── [slug].astro          # Dynamic blog posts
    │   │   ├── 404.astro                 # Custom 404
    │   │   ├── sitemap.xml.ts            # Dynamic sitemap
    │   │   └── robots.txt.ts             # Dynamic robots.txt
    │   │
    │   ├── styles/
    │   │   └── global.css                # Tailwind imports + custom properties
    │   │
    │   ├── utils/
    │   │   └── validation/               # Zod schemas for forms
    │   │
    │   ├── middleware.ts                  # Security headers, CSP
    │   └── env.d.ts                      # TypeScript env declarations
    │
    ├── tests/
    │   ├── e2e/                          # Playwright E2E tests
    │   └── a11y/                         # axe-core accessibility tests
    │
    ├── .env.example                      # Documented env vars (no secrets)
    ├── .node-version                     # Pin Node 22
    ├── astro.config.mjs                  # Astro configuration
    ├── tailwind.config.ts                # Tailwind v4 config (if needed)
    ├── tsconfig.json                     # TypeScript strict config
    ├── playwright.config.ts              # Playwright configuration
    ├── lighthouserc.js                   # Lighthouse CI budgets
    ├── vitest.config.ts                  # Vitest configuration
    └── package.json

### Naming Conventions

| Artifact | Convention | Example |
|---|---|---|
| Astro components | PascalCase | `HeroSection.astro`, `SEO.astro` |
| Directories | kebab-case | `src/components/ui/`, `src/content/blog/` |
| TypeScript files | kebab-case | `global.css`, `validation.ts` |
| Content slugs | kebab-case | `reduzir-divida-tecnica-aws.md` |
| Frontmatter keys | camelCase | `pubDate`, `heroImage`, `authorId` |
| CSS classes | Tailwind utilities only | `flex items-center gap-4` |
| `data-testid` attrs | kebab-case | `data-testid="contact-form-submit"` |
| Git branches | `<type>/<description>` | `feat/hero-section`, `fix/form-validation` |
| Commits | Conventional Commits (English) | `feat(astro): add hero section` |

### Dependency Budget

The initial dependency set is minimal and justified:

| Dependency | Justification |
|---|---|
| `astro` | Core framework. |
| `@astrojs/tailwind` | Tailwind integration. |
| `tailwindcss` | Styling engine. |
| `sharp` | Image optimization (Astro's default). |
| `zod` | Schema validation for Content Collections and forms. |
| `typescript` | Type safety. |
| `@playwright/test` | E2E testing. |
| `vitest` | Unit testing. |
| `@axe-core/playwright` | Accessibility testing. |
| `lighthouse-ci` | Performance budgets in CI. |

**Forbidden on day 1:** React, Vue, Svelte, any icon library, any UI component library (shadcn, radix, headless-ui), any date library (use native `Intl`), any markdown parser beyond Astro's built-in.

## Consequences

### Positive
- **Zero JS by default** — Lighthouse 100 is achievable without heroic effort.
- **Type-safe content** — Content Collections catch schema errors at build time.
- **Fast CI** — pnpm + Astro cache = builds under 60 seconds.
- **No vendor lock-in** — Git-native CMS, GitHub-native hosting.
- **Clear mental model** — Every directory has a single, documented purpose.

### Negative
- **DecapCMS auth complexity** — GitHub Pages requires a proxy or OAuth App setup (mitigated by `integrations-security` agent).
- **Formspree free tier limit** — 50 submissions/month. If exceeded, migrate to Getform or self-hosted alternative (documented in RFC when needed).
- **No server-side logic** — Any future need for auth, payments, or dynamic data requires a third-party service (Supabase, Cloudflare Workers) — accept this constraint now.

### Risks
- **Risk:** Tailwind v4 breaking changes from v3.
  - **Mitigation:** Pin to v4.x, read migration guide before upgrading.
- **Risk:** Astro v5 breaking changes from v4.
  - **Mitigation:** Pin to v5.x, test upgrades in a branch first.
- **Risk:** DecapCMS auth flow breaks on GitHub Pages.
  - **Mitigation:** `integrations-security` agent must produce an RFC before implementation.

## Compliance
- All code must follow the naming conventions above.
- No dependency may be added without an ADR amendment or a new ADR.
- The blueprint must be followed literally — deviations require an ADR.

## References
- [Astro 5 Documentation](https://docs.astro.build/)
- [Tailwind CSS v4 Release Notes](https://tailwindcss.com/blog/tailwind-css-v4)
- [pnpm Motivation](https://pnpm.io/motivation)
- [DecapCMS Documentation](https://decapcms.org/)
- [GitHub Pages with Actions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
