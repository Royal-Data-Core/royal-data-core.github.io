# Project Blueprint (Quick Reference)

> **Authoritative source:** ADR-001. This file is a condensed view for daily use.

## Stack (Pinned)
- **Astro** 5.x | **Tailwind** 4.x | **TypeScript** 5.x (strict)
- **Node** 22 LTS | **pnpm** 10.x
- **DecapCMS** 3.x | **Formspree** (free) | **GoatCounter** (free)
- **Playwright** (E2E) | **Vitest** (unit) | **Lighthouse CI** (perf)

## Directory Map

    .ai/specs/          → ADRs, RFCs, PRDs, features, runbooks, handoffs
    .github/workflows/  → ci.yml, deploy.yml
    public/admin/       → DecapCMS config
    src/components/ui/  → Primitives (Button, Card)
    src/components/sections/ → Page sections (Hero, Features)
    src/components/schema/   → JSON-LD
    src/content/        → Content Collections (blog, services, authors)
    src/layouts/        → BaseLayout, BlogLayout
    src/pages/          → File-based routing
    src/styles/         → global.css (Tailwind imports)
    src/utils/          → Validation schemas
    tests/e2e/          → Playwright tests
    tests/a11y/         → axe-core tests

## Naming Rules
- Components: PascalCase (`HeroSection.astro`)
- Dirs/files: kebab-case (`src/components/ui/`)
- Slugs: kebab-case (`reduzir-divida-tecnica.md`)
- Frontmatter keys: camelCase (`pubDate`)
- Branches: `<type>/<description>` (`feat/hero-section`)
- Commits: Conventional Commits in English

## Forbidden on Day 1
- React, Vue, Svelte (as frameworks)
- Icon libraries, UI component libraries
- Date libraries (use `Intl`)
- Any dependency without ADR justification

## Dependency Budget
astro, @astrojs/tailwind, tailwindcss, sharp, zod, typescript,
@playwright/test, vitest, @axe-core/playwright, lighthouse-ci
