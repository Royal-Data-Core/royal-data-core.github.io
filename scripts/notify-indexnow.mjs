/**
 * IndexNow notification — operational growth decision (2026-10-20).
 * Protocol: https://www.indexnow.org/documentation.html
 *
 * - Option 2 of the spec: the key file is hosted WITHIN the host and every
 *   submission declares its location via `keyLocation`. Root hosting is
 *   impossible here (project pages live under the /site-io/ path of a
 *   shared host). Scope rule: a key at .../site-io/indexnow-<key>.txt
 *   validates only URLs under .../site-io/ — exactly our site.
 * - The key file is PUBLIC by protocol (it proves ownership, it is not a
 *   secret — SEC-1 intact). The POST is CI/server-side only: no browser
 *   script, no tracker, Zero-JS and LGPD-by-design untouched.
 * - URL source of truth: dist/sitemap-0.xml from the same validated
 *   artifact that was just published — no second source to drift.
 * - NON-BLOCKING by contract: the deploy step wraps this script with
 *   continue-on-error — a notification failure must never fail a deploy.
 */
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const DIST = path.join(process.cwd(), "dist");

// 1. Key file (published by the build, inside the artifact scope).
const entries = await readdir(DIST);
const keyFile = entries.find((name) =>
  /^indexnow-[0-9a-f]{32}\.txt$/.test(name),
);
if (!keyFile) throw new Error("[indexnow] key file not found in dist/");
const key = (await readFile(path.join(DIST, keyFile), "utf8")).trim();

// 2. Sitemap URLs (single source: the validated artifact).
const xml = await readFile(path.join(DIST, "sitemap-0.xml"), "utf8");
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (urls.length === 0)
  throw new Error("[indexnow] no URLs in dist/sitemap-0.xml");

// 3. Host + base from the deploy output (PAGE_URL), never hardcoded.
const pageUrl = process.env.PAGE_URL;
if (!pageUrl)
  throw new Error("[indexnow] PAGE_URL is required (deploy page_url output)");
const parsed = new URL(pageUrl);
const origin = parsed.origin;
const basePath = parsed.pathname.replace(/\/+$/, "");
const keyLocation = `${origin}${basePath}/indexnow-${key}.txt`;

// 4. Protocol scope rule: only URLs under the key file's own path prefix.
const prefix = `${origin}${basePath}/`;
const owned = urls.filter((url) => url.startsWith(prefix));
if (owned.length === 0) {
  throw new Error(`[indexnow] no sitemap URLs under ${prefix}`);
}

// 5. Submit: homepage first, then deterministic order. Full-list submit is
// accepted at our volume (single-digit pages per publish; pushes are
// episodic in production); engines deduplicate on their side.
const home = prefix;
const sorted = [...owned].sort((a, b) =>
  a === home ? -1 : b === home ? 1 : a.localeCompare(b),
);

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: origin.replace(/^https?:\/\//, ""),
    key,
    keyLocation,
    urlList: sorted,
  }),
});

const bodyText = await response.text();
console.log(
  `[indexnow] HTTP ${response.status} · ${sorted.length} URLs · ${keyLocation}`,
);
if (response.status === 200 || response.status === 202) {
  console.log("[indexnow] submitted ✓ (200/202 = received for indexing)");
} else {
  console.error(`[indexnow] submission failed: ${bodyText || response.status}`);
  process.exit(1); // step-level continue-on-error keeps the deploy green
}
