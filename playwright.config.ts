/**
 * Playwright config — qa-shiftleft jurisdiction (qa chain v2).
 *
 * Tooling contract (SDD-CONTEXT §5): Playwright ^1.49 · viewports 375x667 +
 * 1280x800 (§4). Config rewritten from CommonJS `require` to ESM import:
 * package.json declares "type": "module", and the shipped CJS stubs did not
 * load under it.
 */
import { defineConfig } from "@playwright/test";
import { SITE_BASE } from "./tests/base.js";

// Local preview (astro preview serves dist/). The webServer.url readiness
// check must hit the artifact base ("astropreview serves routes under it
// when astro.config's base is non-empty; SITE_BASE is injected via
// webServer.env). Tests always navigate via tests/base.ts helper R().
const PREVIEW_HOST = "http://localhost:4321";
const PREVIEW_URL =
  SITE_BASE === "" ? PREVIEW_HOST : `${PREVIEW_HOST}${SITE_BASE}`;

export default defineConfig({
  // Platform prep — serve the built artifact; astro preview is the mandated
  // server for static output (no server-side runtime, CONSTITUTION §C1).
  webServer: {
    // --ignore-lock: astro v7 preview keeps a lock file; a server killed
    // externally leaves a stale lock and every subsequent invocation exits
    // non-zero BEFORE binding (localOS failure mode observed 2026-10-20;
    // CI runners are always fresh — no-op there). Readiness is still
    // enforced by webServer.url, so this cannot mask a broken artifact.
    command: "npx astro preview --port 4321 --ignore-lock",
    url: `${PREVIEW_URL}/`,
    env: { SITE_BASE },
    reuseExistingServer: true,
    timeout: 60_000,
  },

  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium", viewport: { width: 1280, height: 800 } },
    },
    {
      name: "mobile",
      use: { browserName: "chromium", viewport: { width: 375, height: 667 } },
    },
  ],
  // Both suites (tests/e2e + tests/a11y) must be discoverable via
  // `playwright test tests/e2e` and `playwright test tests/a11y`.
  testDir: "./tests",
  timeout: 30000,
  retries: 2,
  workers: 4,
  expect: { timeout: 10000 },
  use: {
    baseURL: PREVIEW_HOST,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
});
