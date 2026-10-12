# ADR-002: CI/CD Pipeline Architecture

## Status
**ACCEPTED** — Governs all pipeline decisions. Supersedes ad-hoc workflow changes.

## Context
The project requires an automated path from commit to production with zero manual intervention. The pipeline must enforce quality gates (lint, typecheck, tests, performance budgets) before any code reaches `main`, and deploy atomically to GitHub Pages on merge.

Constraints:
- GitHub Actions is the sole CI/CD platform (free for public repos).
- GitHub Pages is the sole deployment target.
- Build must complete under 5 minutes on the free tier.
- No secrets should ever appear in logs or artifacts.

Tensions resolved:
1. **Speed vs. thoroughness** — Cache aggressively, run checks in parallel.
2. **Simplicity vs. safety** — Two workflows (CI + Deploy) instead of one monolith.
3. **Flexibility vs. reproducibility** — Pin every action version, pin Node, pin pnpm.

## Decision

### Pipeline Topology
Two separate workflows with distinct responsibilities:

1. **`ci.yml`** — Runs on every Pull Request. Executes quality gates. Never deploys.
2. **`deploy.yml`** — Runs on push to `main` and manual dispatch. Builds and deploys to GitHub Pages.

### CI Workflow (`ci.yml`)
- **Trigger:** `pull_request` (all branches targeting `main`).
- **Concurrency:** Group by PR number, cancel superseded runs.
- **Jobs (parallel where possible):**
  - `lint`: ESLint + Prettier check.
  - `typecheck`: `astro check` + `tsc --noEmit`.
  - `test-unit`: Vitest with coverage threshold.
  - `test-e2e`: Playwright on Chromium (mobile + desktop viewports).
  - `test-a11y`: axe-core via Playwright on critical routes.
  - `lighthouse`: Lighthouse CI with budgets from `lighthouserc.js`.
- **Cache strategy:**
  - pnpm store via `actions/setup-node` built-in cache.
  - Astro build cache (`.astro/`) via `actions/cache`.
- **Gate rule:** All jobs must pass for the PR to be mergeable.

### Deploy Workflow (`deploy.yml`)
- **Trigger:** `push` to `main`, `workflow_dispatch`.
- **Permissions:** `contents: read`, `pages: write`, `id-token: write` (OIDC).
- **Environment:** `github-pages` (with branch protection).
- **Concurrency:** Group `pages`, cancel in-progress.
- **Jobs (sequential):**
  - `build`: Uses `withastro/action@v2` (handles install + build + upload).
  - `deploy`: Uses `actions/deploy-pages@v4` (atomic deploy).
- **Cache strategy:** Same as CI (pnpm store + Astro cache).

### Action Version Pinning Policy
- Pin to major version tag (e.g., `@v4`) for GitHub-maintained actions.
- Pin to commit SHA for third-party actions (e.g., `withastro/action`).
- **Never** use `@main`, `@master`, or `@latest`.
- Dependabot handles version updates via PRs.

### Node.js and pnpm Version Pinning
- Node version pinned via `.node-version` file (read by `actions/setup-node`).
- pnpm version pinned via `package.json` `packageManager` field.

## Consequences

### Positive
- **Fail-fast feedback:** PR authors get results in <3 minutes.
- **Zero manual deploy:** Merge to `main` = live in <2 minutes.
- **Reproducible builds:** Pinned versions eliminate "works on my machine".
- **Secure by default:** OIDC, no hardcoded secrets, minimal permissions.

### Negative
- **Two workflows to maintain** instead of one — acceptable trade-off for clarity.
- **Playwright browser download** adds ~30s to CI — mitigated by caching.

### Risks
- **Risk:** GitHub Actions free tier minutes exhausted.
  - **Mitigation:** Public repos get unlimited free minutes. This repo is public.
- **Risk:** `withastro/action` breaking change on version bump.
  - **Mitigation:** Pin to SHA, update via Dependabot PR with review.

## Compliance
- No workflow change may bypass a quality gate without an ADR amendment.
- All new actions must be pinned and documented in this ADR.

## References
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [withastro/action](https://github.com/withastro/action)
- [actions/deploy-pages](https://github.com/actions/deploy-pages)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
