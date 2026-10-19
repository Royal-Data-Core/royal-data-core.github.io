/**
 * Playwright config — qa-shiftleft jurisdiction (qa chain v2).
 *
 * Tooling contract (SDD-CONTEXT §5): Playwright ^1.49 · viewports 375x667 +
 * 1280x800 (§4). Config rewritten from CommonJS `require` to ESM import:
 * package.json declares "type": "module", and the shipped CJS stubs did not
 * load under it.
 */
import { defineConfig } from "@playwright/test";

// Local preview (astro preview serves dist/). Must match webServer.url.
const PREVIEW_URL = "http://localhost:4321";

export default defineConfig({
  // Platform prep — serve the built artifact; astro preview is the mandated
  // server for static output (no server-side runtime, CONSTITUTION §C1).
  webServer: {
    command: "npx astro preview --port 4321",
    url: `${PREVIEW_URL}`,
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
    baseURL: `${PREVIEW_URL}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
});
