# Nexus Digital Constitution: Solo IT Consulting Web Presence
<!-- Version: 1.1.0 | Ratified: 2026-10-12 | Last Amended: 2026-10-12 -->

**PREAMBLE: THE SDD MANDATE**
This document is the single source of truth for this repository. In Spec-Driven Development (SDD), the specification dictates the code, not vice versa. Any code, configuration, or dependency that violates this constitution is considered a critical defect and must be rejected by CI/CD or refactored immediately. Generic statements are invalid; all rules are measurable and enforceable.

---

## 1. Mandatory Tech Stack & Allowlist
Deviation requires a formal architectural exception PR.
* **Core Framework:** Astro (v4.x or v5.x) with TypeScript in `strict` mode.
* **Styling:** Tailwind CSS (Utility-first). Inline `style="..."` attributes are strictly prohibited.
* **Hosting & CI/CD:** GitHub Pages + GitHub Actions.
* **Forms:** Formspree or Getform (Free Tier). No custom backend endpoints for form handling.
* **Analytics:** GoatCounter or Umami. Google Analytics, Meta Pixel, or any tracking script injecting >15KB of JS is explicitly banned.
* **Scheduling:** Cal.com (Free Tier) embedded via iframe or lightweight script.
* **Image Formats:** WebP or AVIF only. JPEG/PNG are forbidden unless explicitly justified for specific legacy compatibility (max 1 instance).

---

## 2. Architecture & Code Standards (TypeScript/Astro)
* **Strict Typing:** `tsconfig.json` must enforce `"strict": true`, `"noImplicitAny": true`, and `"noUncheckedIndexedAccess": true`. The `any` type is strictly prohibited. Use `unknown` with type guards or explicit interfaces.
* **Zero-JS by Default:** All Astro components must render server-side by default. The use of `client:load`, `client:visible`, or `client:idle` directives is forbidden unless the component is a proven interactive island (e.g., Cal.com widget, DecapCMS admin UI) and justified in the PR description.
* **Layout Enforcement:** Every `.astro` page in `src/pages/` must import and wrap its content in `BaseLayout.astro`. Standalone pages without the base layout will fail the build.
* **Component Segregation:** 
  * `src/components/ui/`: Dumb, presentational components (Buttons, Cards). Must accept typed props and contain zero business logic.
  * `src/components/islands/`: Interactive components requiring client-side JS. Must be explicitly isolated.
* **Routing:** File-based routing only. Dynamic routes (`[slug].astro`) must include explicit `getStaticPaths()` exports returning typed data.

---

## 3. Performance & Core Web Vitals (Non-Negotiable)
* **Lighthouse Baseline:** CI/CD will fail if Lighthouse scores drop below **95** in Performance, Accessibility, Best Practices, and SEO (tested on mobile emulation).
* **Bundle Budgets:** 
  * Total JavaScript payload (gzipped) for the initial route must remain **< 50KB**.
  * Total CSS payload (gzipped) must remain **< 30KB**.
* **Image Constraints:** 
  * Hero images must be **< 150KB**. 
  * Thumbnails/Icons must be **< 20KB**. 
  * All images must include explicit `width` and `height` attributes to prevent Cumulative Layout Shift (CLS > 0.1 is a build failure).
* **Font Loading:** Custom fonts must use `font-display: swap`. System font stacks (e.g., `font-sans`) are preferred to eliminate network requests for typography.

---

## 4. Security & Compliance Guardrails
* **Secrets Management:** Hardcoded secrets, API keys, or tokens are strictly prohibited. Any commit matching regex patterns for secrets (e.g., `sk-`, `ghp_`, `AKIA`) will be rejected by pre-commit hooks. Use `import.meta.env` validated via a schema (e.g., Zod) at runtime.
* **Content Security Policy (CSP):** A strict CSP meta tag must be present in `BaseLayout.astro`, defaulting to `default-src 'self'` and explicitly allowing only verified third-party domains (e.g., `formspree.io`, `cal.com`).
* **Dependency Hygiene:** `npm audit` must pass with zero high/critical vulnerabilities. Dependabot must be enabled.
* **Form Sanitization:** All form inputs submitted to Formspree/Getform must have HTML5 validation attributes (`required`, `type="email"`, `minlength`) and server-side honeypot fields to prevent bot spam.

---

## 5. SEO, Content & Accessibility (a11y)
* **Metadata Completeness:** Every page must define unique `<title>` (max 60 chars), `<meta name="description">` (max 160 chars), and Open Graph (`og:title`, `og:description`, `og:image`) tags via `BaseLayout.astro` props.
* **Semantic HTML:** Use of `<div>` for interactive or structural elements is prohibited. Use `<button>`, `<a>`, `<section>`, `<article>`, and `<nav>` appropriately.
* **Accessibility Contracts:** 
  * All `<img>` tags must have descriptive `alt` attributes (or `alt=""` for purely decorative images).
  * Color contrast ratios must meet WCAG AA standards (minimum 4.5:1 for normal text).
  * All interactive elements must be focusable and have visible `:focus-visible` outlines.

---

## 6. CI/CD & Automation Rules
* **Pre-commit Hooks:** `husky` and `lint-staged` must be configured to run `eslint`, `prettier`, and `astro check` on staged files before any commit is allowed.
* **GitHub Actions:** 
  * The `.github/workflows/deploy.yml` must trigger on `push` to `main` and `pull_request`.
  * The workflow must include a step to run `npm run build` to verify compilation before deployment.
  * Deployment artifacts must be cached to optimize CI/CD execution time.
* **No Manual Deployments:** All changes to the `main` branch must go through the automated GitHub Actions pipeline. Manual FTP or CLI deployments are forbidden.

---

## 7. Amendment Process
This constitution is immutable during active development sprints. To amend:
1. Open a Pull Request with the title `chore: amend constitution - [Specific Rule]`.
2. The PR description must detail the *pain point* that necessitated the change (e.g., "AI agent generated unoptimized PNGs, causing Lighthouse performance drop").
3. Update the `Version` and `Last Amended` metadata at the top of this file.
4. Approval requires explicit acknowledgment by the Nexus role.
