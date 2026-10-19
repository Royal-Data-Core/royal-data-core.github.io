/**
 * scripts/commit-msg-check.mjs — Conventional Commits (EN) gate for the
 * commit-msg husky hook (~SEC-9 of the ops section). No external dependency:
 * lint-staged covers content; this covers the message contract only.
 *
 * Rules: `type(scope)?: subject` — en dash rules are the registry below.
 * Merge commits are exempt (`git merge` responses are system-generated).
 */
import { readFileSync } from "node:fs";

const VALID_TYPES = new Set([
  "feat",
  "fix",
  "docs",
  "style",
  "refactor",
  "perf",
  "test",
  "build",
  "ci",
  "chore",
  "revert",
]);

const msg = (
  process.argv[2] ? readFileSync(process.argv[2], "utf8") : ""
).trim();
if (!msg) {
  console.error("[commit-msg] empty message");
  process.exit(1);
}
if (/^Merge\b/.test(msg) || /^Revert\b/.test(msg)) process.exit(0);

const CHARS_LIMIT = 100;
const HEADER = msg.split("\n")[0];
const m = HEADER.match(
  /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-zA-Z0-9\-/_.]+\))?!?(?::)[ ](.+)$/,
);
if (!m) {
  console.error(
    `[commit-msg] not Conventional (EN): "${HEADER}"\n` +
      `  expected: <type>(<scope>)?: <subject>   types: ${[...VALID_TYPES].join("|")}`,
  );
  process.exit(1);
}
if (msg.startsWith("WIP") || /[\u00c0-\u017f]/.test(m[3])) {
  console.error("[commit-msg] subject must be EN, accent-free (ADR-000)");
  process.exit(1);
}
if (HEADER.length > CHARS_LIMIT) {
  console.error(`[commit-msg] header ${HEADER.length} > ${CHARS_LIMIT} chars`);
  process.exit(1);
}
