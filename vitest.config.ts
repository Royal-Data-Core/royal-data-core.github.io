import { defineConfig } from "vitest/config";

/**
 * Unit-test gate — SDD-CONTEXT §4 (critical-path coverage >= 80 %, hard fail)
 * bound to `npm run test:unit` in ci.yml/deploy.yml (verify job).
 *
 * Scope: only small unit specs under src/utils and siblings (test.ts pairs).
 * Playwright suites live in tests/e2e and tests/a11y and are driven by
 * playwright.config.ts — never through Vitest.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["tests/**", "node_modules/**", "dist/**"],
    coverage: {
      provider: "v8",
      // §C4 «critical path» = routes "/", "/servicos", "/blog", "/blog/[slug]",
      // "/contato"; their shared pure logic is the utils layer.
      include: ["src/utils/**"],
      reporter: ["text", "lcov"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
