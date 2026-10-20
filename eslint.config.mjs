/**
 * ESLint 9 flat config — `static-analysis-enforcer` · CONSTITUTION §C12.7.
 *
 * Plugins shipped in devDependencies (no new installs): @typescript-eslint 8,
 * eslint-plugin-astro 1.7.0 (flat build-in), eslint-plugin-jsx-a11y 6.10.2,
 * and the `globals` package for environment definitions (ADR-000 · CONSTITUTION
 * §C12.4). Gate: `npm run lint` → `eslint . --max-warnings 0`.
 */
import eslintPluginAstro from "eslint-plugin-astro";
import jsxA11y from "eslint-plugin-jsx-a11y";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";

/**
 * Generated artifacts and caches are never hand-written sources; excluding
 * them keeps the guard job inside its 6-minute budget (§C5). `.ai/**` and
 * `.opencode/**` are local-only internal corpus (ADR-009 D1): ignoring them
 * makes `npm run lint` deterministic across operator/CI environments — the
 * gate evaluates the identical file set whether or not the local corpus is
 * present on disk.
 */
const ignoredPaths = [
  ".ai/**",
  ".opencode/**",
  "specs/**",
  "specs-*/**",
  "dist/**",
  ".astro/**",
  "node_modules/**",
  "coverage/**",
  ".lighthouseci/**",
  "playwright-report/**",
  "test-results/**",
  ".linkinator/**",
];

/**
 * WCAG 2.1 AA is a Kill-Switch domain (§C9). The jsx-a11y recommended set is
 * promoted to "error" uniformly: with `--max-warnings 0` every severity fails
 * the build, so "error" also keeps intent explicit and fail-closed.
 */
const jsxA11yRules = Object.fromEntries(
  Object.entries(jsxA11y.flatConfigs.recommended.rules).map(
    ([rule, severity]) => [
      rule,
      Array.isArray(severity) ? ["error", ...severity.slice(1)] : "error",
    ],
  ),
);

export default [
  {
    name: "site-io/ignores",
    ignores: ignoredPaths,
  },

  /**
   * eslint-plugin-astro flat set: registers the `astro` plugin, wires
   * astro-eslint-parser (+ TS-in-astro layers) and enables its recommended
   * rules (astro/no-conflict-set-directives, astro/valid-compile, …).
   */
  ...eslintPluginAstro.configs.recommended,

  {
    name: "site-io/typescript",
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    languageOptions: {
      parser: tsParser,
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // §C12 static floor — `any` defeats every type gate this repo ships.
      "@typescript-eslint/no-explicit-any": "error",
      "no-eval": "error",
      "no-new-func": "error",
    },
  },

  {
    name: "site-io/node-scripts",
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      sourceType: "module",
      globals: globals.node,
    },
    rules: {
      "no-eval": "error",
      "no-new-func": "error",
    },
  },

  {
    name: "site-io/root-config-js",
    files: ["*.mjs", "*.cjs"],
    languageOptions: {
      sourceType: "module",
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      "no-eval": "error",
      "no-new-func": "error",
    },
  },

  {
    name: "site-io/jsx-a11y",
    files: ["**/*.astro"],
    plugins: {
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...jsxA11yRules,
      /**
       * astro-eslint-parser emits component attributes verbatim (no React
       * `htmlFor` remap), so the rule's transpiled "id" check fires on valid
       * `for=` HTML. Explicit configuration keeps the association contract
       * (label must attach through nesting OR the `for`/`id` pair) while the
       * output stays valid HTML5 — §C9-oriented strictness is unchanged: a
       * disassociated label still fails across both rules.
       */
      "jsx-a11y/label-has-for": [
        "error",
        { required: { some: ["nesting", "id"] }, depth: 1 },
      ],
    },
  },
];
