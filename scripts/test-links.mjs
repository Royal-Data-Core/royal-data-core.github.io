/**
 * scripts/test-links.mjs — hermetic link-integrity gate (RFC-001 §2.2 /
 * SPEC-001 AC-001.7). Replaces the raw `linkinator ./dist` call.
 *
 * Design rules:
 *  - Zero network: every absolute URL to the Pages origin (og:image, canonical,
 *    JSON-LD id) is matched by a skip regex; social/mailto/tel are skipped.
 *    Only RELATIVE internal links are validated against the artifact itself.
 *  - Base-mounted artifacts (SITE_BASE non-empty — ADR-008 D7): the artifact is
 *    root-layout with base-prefixed routes, so it is mirrored under
 *    `.lhciview/<base>/` — URL paths like `/<base>/x/` then resolve inside the
 *    scan root exactly like the real Pages layout. Root-hosted artifacts are
 *    scanned directly at ./dist.
 *  - Directory-format URLs (`/blog/x/`) resolve to `dir/index.html` via
 *    linkinator's `directoryListing`; `cleanUrls` covers extensionless
 *    fallbacks. FOS-style: same tool, constrained deterministically.
 */
import { rm, cp, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { LinkChecker } from "linkinator";

const SITE_URL = process.env.SITE_URL ?? "https://royaldatacore.github.io";
const SITE_BASE = (process.env.SITE_BASE ?? "").replace(/\/+$/, "");
const DIST = "dist";
const MIRROR = ".linkinator-mirror";

if (!existsSync(DIST) || !existsSync(path.join(DIST, "index.html"))) {
  console.error(
    "[test-links] dist/index.html ausente — rode `npm run build` antes.",
  );
  process.exit(1);
}

let scanPath = DIST;
if (SITE_BASE && SITE_BASE !== "/") {
  const baseDir = path.join(MIRROR, SITE_BASE); // .lhciview/site-io
  await rm(MIRROR, { recursive: true, force: true });
  await mkdir(baseDir, { recursive: true });
  await cp(DIST, baseDir, { recursive: true });
  // Bootstrap: linkinator's dir scan starts at <root>/index.html; the artifact
  // layout keeps index at root and routes under <base>/ — mirror it there so
  // crawling begins (hrefs are base-prefixed → resolve into .lhciview/site-io/).
  await cp(path.join(DIST, "index.html"), path.join(MIRROR, "index.html"));
  scanPath = MIRROR;
  console.log(
    `[test-links] base-mounted mirror: ${baseDir} (scan root ${scanPath})`,
  );
} else {
  console.log("[test-links] root-hosted scan: ./dist");
}

/** Absolute origins are skipped — the gate must never depend on remote I/O. */
const SKIPS = [
  `${SITE_URL}(/.*)?`, // canonical / og:url / JSON-LD (own origin)
  "https://royaldatacore\\.github\\.io(/.*)?", // own origin (hyphenless apex), belt&braces
  "https://royal-data-core\\.github\\.io(/.*)?", // legacy hyphenful origin (pre-rename)
  "https?://[^/]*linkedin\\.com(/.*)?",
  "https?://wa\\.me(/.*)?",
  "https?://([a-zA-Z0-9.-]*\\.)?instagram\\.com(/.*)?", // social anchors are hermetic by design
  "https?://([a-zA-Z0-9.-]*\\.)?github\\.com(/.*)?",
  "^(mailto|tel):",
];

const checker = new LinkChecker();
const result = await checker.check({
  path: scanPath,
  recurse: true,
  linksToSkip: SKIPS,
  directoryListing: true,
  cleanUrls: true,
  checkCss: false,
  markdown: false,
  timeout: 10_000,
  retryErrors: true,
  retryErrorsCount: 2,
});

const broken = result.links.filter((link) => link.state === "BROKEN");
if (!result.passed || broken.length > 0) {
  console.error(`[test-links] ${broken.length} link(s) quebrado(s):`);
  for (const link of broken.slice(0, 50)) {
    const parent =
      link.parents && link.parents.length ? ` ← ${link.parents.at(-1)}` : "";
    console.error(`  ${link.status ?? "?"} ${link.url}${parent}`);
  }
  process.exit(1);
}
console.log(
  `✓ test-links: ${result.links.length} resolve check(s), 0 broken (hermetic)`,
);
