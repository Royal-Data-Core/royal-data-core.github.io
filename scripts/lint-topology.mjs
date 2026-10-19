#!/usr/bin/env node
/**
 * SPEC-001 AC-001.9 / AC-001.N2 — internal-URL topology gate (ADR-004).
 *
 * Scans .astro and .ts sources under `src` for root-absolute URL literals on
 * href/src that bypass the withBase() helper (src/lib/withBase.ts). Checked forms:
 *
 *   href="/servicos"                      raw string attribute
 *   href='/servicos'                      raw string attribute
 *   href={'/servicos'}  href={`…/…`}      expression / template literal
 *   href: "/servicos"                     object literal feeding a component
 *
 * Allowed exceptions (SPEC-001 AC-001.9, verbatim scope):
 *   - fragment links  href="#…" (never routed, no base semantics);
 *   - exactly "/favicon.svg" and "/robots.txt", the two spec-cited artifacts
 *     resolved through the helper elsewhere;
 *   - any form whose expression window contains withBase( ).
 *
 * Exit 0 when the topology is clean; exit 1 printing `file:line` and the
 * mandatory citation "ADR-004: use withBase()" per P-failure (AC-001.N2).
 *
 * Usage: node scripts/lint-topology.mjs [root]   (default root: "src")
 * The positional root argument exists so CI and local use the same code path;
 * self-tests run it against a synthetic tree outside the worktree.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const SOURCE_EXTENSIONS = new Set([".astro", ".ts"]);
const ALLOWLISTED_VALUES = new Set(["/favicon.svg", "/robots.txt"]);
const WITH_BASE = /withBase\s*\(/;
/** Lines scanned around a match to find a withBase( wrap. */
const LOOKAHEAD_LINES = 2;

const forms = [
  // href="/x" — value starts with a quote directly after `=`.
  {
    id: "attribute",
    regex: /\b(?:href|src)\s*=\s*(["'`])(\/[^"'`\s]*)\1/g,
    wrapped: true,
  },
  // href={'/x'} — value starts with a quote directly inside `{ }`.
  {
    id: "expression",
    regex: /\b(?:href|src)\s*=\s*\{\s*([`"'])\s*(\/[^"'`\s}]*)/g,
    wrapped: true,
  },
  // href: "/x" — object-literal property passed as a component prop.
  {
    id: "property",
    regex: /\b(?:href|src)\s*:\s*([`"'])(\/[^"'`\s]*)\1/g,
    wrapped: true,
  },
];

function collectFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) files.push(...collectFiles(path));
    else if (SOURCE_EXTENSIONS.has(extname(path))) files.push(path);
  }
  return files;
}

function isExempt(value, window) {
  if (value.startsWith("#")) return true; // fragment anchor, never routed
  if (ALLOWLISTED_VALUES.has(value)) return true;
  return WITH_BASE.test(window); // wrapped by the helper
}

const rootArg = process.argv[2] ?? "src";
if (!existsSync(rootArg) || !statSync(rootArg).isDirectory()) {
  console.error(`[lint-topology] root directory not found: ${rootArg}`);
  process.exit(1);
}

const violations = [];
for (const file of collectFiles(rootArg)) {
  const text = readFileSync(file, "utf8");
  const lines = text.split(/\r\n|\n/);
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    for (const form of forms) {
      form.regex.lastIndex = 0;
      let match;
      while ((match = form.regex.exec(lines[lineIndex])) !== null) {
        const value = match[2] ?? "";
        if (isExempt(value, lines[lineIndex])) continue;
        const window = lines
          .slice(lineIndex, lineIndex + 1 + LOOKAHEAD_LINES)
          .join("\n");
        if (isExempt(value, window)) continue;
        violations.push({
          file: relative(process.cwd(), file),
          line: lineIndex + 1,
          snippet: match[0].trim().slice(0, 90),
        });
      }
      form.regex.lastIndex = 0;
    }
  }
}

if (violations.length > 0) {
  console.error(
    `[lint-topology] ${violations.length} hardcoded internal URL(s) — ADR-004: use withBase()`,
  );
  for (const v of violations) {
    console.error(
      `  ${v.file}:${v.line} · ADR-004: use withBase() · ${v.snippet}`,
    );
  }
  process.exit(1);
}
console.log("✓ lint-topology: 0 hardcoded internal URLs (SPEC-001 AC-001.9)");
process.exit(0);
