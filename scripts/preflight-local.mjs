/**
 * RUNBOOK-001 — Local deploy pre-flight: artifact sanity, Pages-parity.
 *
 * Deterministic, offline, stdlib-only. Validates the dist/ artifact BEFORE
 * the operator authorizes a pipeline deploy (push → ci.yml battery →
 * deploy.yml revalidation + publish). This is NOT a deploy channel —
 * CONSTITUTION §C2 admits exactly one (GitHub Actions → Pages) and the
 * `no_manual_deploy` slug is binding.
 *
 * Contract (mirrors ci.yml build gate + deploy.yml pre-pack sanity, RFC-001
 * FM-04/FM-06, ADR-002 D1, SPEC-007):
 *   [R1] required files present in dist/
 *   [R2] Pagefind index + wasm present and ≤ 5 MB (SPEC-007)
 *   [R3] dist/ ≤ 100 MB (§C5)
 *   [R4] CSP meta present in index.html (ADR-002 D1 — Pages-served parity)
 *   [R5] (advisory) git working tree clean — stale-artifact risk signal
 */
import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

// Runbook-invariant: the pre-flight must audit THE repo's dist/ regardless of
// the invocation cwd (§C11e — same artifact on Linux/macOS).
const DIST = path.resolve(import.meta.dirname, "..", "dist");
const TAG = "[RUNBOOK-001]";
const BYTE = 1024;
const MB = 1024 * BYTE;

const failures = [];
const advisory = [];

function sizeMb(dir) {
  let total = 0;
  const walk = (entry) => {
    // lstat (never follow): a symlink in the artifact is itself a finding
    // (astro emits none today) — skipping keeps the audit throw-free.
    const stat = lstatSync(entry);
    if (stat.isSymbolicLink()) {
      advisory.push(
        `symlink skipped in size audit: ${path.relative(DIST, entry)}`,
      );
      return;
    }
    if (stat.isDirectory()) {
      for (const child of readdirSync(entry)) walk(path.join(entry, child));
    } else {
      total += stat.size;
    }
  };
  walk(dir);
  return total / MB;
}

function fail(id, message) {
  failures.push(message);
  console.error(`${TAG} ${id}: ${message}`);
}

function ok(id, message) {
  console.log(`${TAG} ✓ ${id}: ${message}`);
}

// [R1] — required artifact files (deploy.yml "Final artifact sanity" parity)
const requiredFiles = [
  "index.html",
  "404.html",
  ".nojekyll",
  "robots.txt",
  "rss.xml",
  "sitemap-index.xml",
  "_pagefind/pagefind.js",
  "_pagefind/pagefind-entry.json",
];

if (!existsSync(DIST)) {
  fail(
    "[R1]",
    "dist/ missing — run the build phase of the runbook first (npm run build)",
  );
  process.exit(1);
}

for (const file of requiredFiles) {
  if (existsSync(path.join(DIST, file))) {
    ok("[R1]", file);
  } else {
    fail("[R1]", `artifact file missing: dist/${file}`);
  }
}

// [R2] — Pagefind wasm (string filename: wasm.<hash>.pagefind — SPEC-007)
const pagefindDir = path.join(DIST, "_pagefind");
const pagefindExists = existsSync(pagefindDir);
const hasWasm =
  pagefindExists &&
  (existsSync(path.join(pagefindDir, "pagefind.wasm")) ||
    readdirSync(pagefindDir).some(
      (name) => name.startsWith("wasm.") && name.endsWith(".pagefind"),
    ));
if (hasWasm) {
  ok("[R2]", "Pagefind wasm present");
} else {
  fail(
    "[R2]",
    `Pagefind wasm missing in ${pagefindDir}/ — the build phase must run the full pagefind stage (npm run build, not plain astro build)`,
  );
}

if (pagefindExists) {
  const pagefindMb = sizeMb(pagefindDir);
  if (pagefindMb > 5) {
    fail("[R2]", `Pagefind index ${pagefindMb.toFixed(1)} MB > 5 MB budget`);
  } else {
    ok("[R2]", `Pagefind index ${pagefindMb.toFixed(1)} MB ≤ 5 MB`);
  }
}

const distMb = sizeMb(DIST);
if (distMb > 100) {
  fail("[R3]", `dist/ ${distMb.toFixed(1)} MB > 100 MB (CONSTITUTION §C5)`);
} else {
  ok("[R3]", `dist/ ${distMb.toFixed(1)} MB ≤ 100 MB (§C5)`);
}

// [R4] — CSP meta in the served HTML (deploy.yml smoke parity, ADR-002 D1)
const indexHtml = existsSync(path.join(DIST, "index.html"))
  ? readFileSync(path.join(DIST, "index.html"), "utf8")
  : "";
if (indexHtml.includes('http-equiv="Content-Security-Policy"')) {
  ok("[R4]", "CSP meta present in dist/index.html");
} else {
  fail("[R4]", "CSP meta missing from dist/index.html (ADR-002 D1 regression)");
}

// [R5] — advisory only: dirty tree ⇒ artifact may not match HEAD
try {
  const dirOpts = { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] };
  const dirty = execSync("git status --porcelain", dirOpts).trim();
  if (dirty.length > 0) {
    advisory.push(
      "git working tree is dirty — pre-flight validates YOUR workspace, not HEAD",
    );
  }
  // Artifact freshness vs HEAD: dist/ built BEFORE the newest commit means the
  // authorization evidence predates the intended payload. Caught live during
  // the RUNBOOK-001 rollout (2026-10-21): CR-001 landed after the build and the
  // board was green against a stale artifact. The runbook's build-before-check
  // phase is the control; this advisory makes the control self-documenting.
  const headEpoch = Number(execSync("git log -1 --format=%ct", dirOpts).trim());
  const indexStat = statSync(path.join(DIST, "index.html"));
  if (headEpoch * 1000 > indexStat.mtimeMs) {
    advisory.push(
      `dist/index.html predates HEAD (${new Date(headEpoch * 1000).toISOString()}) — rebuild before authorizing deploy`,
    );
  }
} catch {
  advisory.push("git unavailable — staleness checks skipped");
}

if (advisory.length > 0) {
  for (const note of advisory)
    console.warn(`${TAG} ⚠ [R5] (advisory): ${note}`);
}

if (failures.length > 0) {
  console.error(
    `${TAG} ✗ pre-flight FAILED: ${failures.length} violation(s) — do NOT authorize deploy`,
  );
  process.exit(1);
}
console.log(
  `${TAG} ✓ pre-flight PASSED — artifact is deploy-eligible (authorization is still the operator's)`,
);
