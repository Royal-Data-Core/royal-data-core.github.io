#!/usr/bin/env node
/**
 * SPEC-012 AC-012.10 — hreflang reciprocity gate (artifact level).
 *
 * The head of every page declares its PT/EN counterpart (SPEC-011 AC-012.2).
 * This script proves the declaration is TRUE for the built artifact:
 *
 *   1. every `alternate` target exists in the artifact (no dangling pair);
 *   2. every pair is RECIPROCAL — if A (locale X) points to B (locale Y), then
 *      B declares an alternate with hreflang=X pointing back to A;
 *   3. every page that has a counterpart declares `x-default`;
 *   4. the sitemap mirrors the head pairs (xhtml:link) for the same URLs.
 *
 * Fail-closed: any violation exits 1 with the offending URLs.
 *
 * Usage: node scripts/verify-hreflang.mjs [--dist dist]
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const argv = process.argv.slice(2);
const distIndex = argv.indexOf("--dist");
const DIST = distIndex >= 0 ? argv[distIndex + 1] : "dist";

/** Recursively collects .html files under a directory. */
function collectHtml(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) collectHtml(full, out);
    else if (full.endsWith(".html")) out.push(full);
  }
  return out;
}

/** Normalizes a deployed path: "/servicos/" and "/servicos" are the same URL. */
function normalizePath(path) {
  const clean = path.replace(/\/+$/, "");
  return clean === "" ? "/" : clean;
}

/** Canonical URL of an artifact file (dist path → deployed URL). */
function urlOf(file) {
  const rel = relative(DIST, file).split("\\").join("/");
  const clean = normalizePath(rel.replace(/index\.html$/, ""));
  return clean.startsWith("/") ? clean : `/${clean}`;
}

/** Alternate declarations of a page: hreflang → absolute href. */
function alternatesOf(html) {
  const found = new Map();
  const pattern =
    /<link[^>]*rel="alternate"[^>]*hreflang="([^"]+)"[^>]*href="([^"]+)"/g;
  let match = pattern.exec(html);
  while (match !== null) {
    found.set(match[1], match[2]);
    match = pattern.exec(html);
  }
  return found;
}

/** Locale declared by the page itself (`<html lang>`). */
function langOf(html) {
  const match = /<html[^>]*\slang="([^"]+)"/.exec(html);
  return match?.[1] ?? null;
}

const pages = new Map(); // url → { file, lang, alternates }
for (const file of collectHtml(DIST)) {
  const html = readFileSync(file, "utf8");
  pages.set(urlOf(file), {
    file,
    lang: langOf(html),
    alternates: alternatesOf(html),
  });
}

const errors = [];

// 1 + 2 — dangling targets and reciprocity.
for (const [url, page] of pages) {
  for (const [lang, href] of page.alternates) {
    if (lang === "x-default") continue;
    const targetPath = normalizePath(new URL(href).pathname);
    const target = pages.get(targetPath);
    if (!target) {
      errors.push(
        `[SPEC-012/AC-012.10] ${url} declara hreflang="${lang}" para ${href}, que não existe no artefato`,
      );
      continue;
    }
    // The counterpart must point back to THIS page, with THIS page's locale.
    const back = [...target.alternates.entries()].find(
      ([, backHref]) =>
        normalizePath(new URL(backHref).pathname) === url &&
        backHref !== undefined,
    );
    if (!back) {
      errors.push(
        `[SPEC-012/AC-012.10] ${url} → ${href} não é recíproco: a contraparte não declara alternate apontando para ${url}`,
      );
      continue;
    }
    if (page.lang && back[0] !== page.lang) {
      errors.push(
        `[SPEC-012/AC-012.10] ${url} (lang="${page.lang}") → ${href}: a contraparte responde com hreflang="${back[0]}" (esperado "${page.lang}")`,
      );
    }
  }
}

// 3 — x-default must exist and point to the default-locale surface
// (only for pages that actually have a locale counterpart).
for (const [url, page] of pages) {
  const hasLocaleAlternates = [...page.alternates.keys()].some(
    (lang) => lang !== "x-default",
  );
  if (!hasLocaleAlternates) continue;
  const xDefault = page.alternates.get("x-default");
  if (!xDefault) {
    errors.push(`[SPEC-012/AC-012.10] ${url} não declara hreflang="x-default"`);
    continue;
  }
  const targetPath = normalizePath(new URL(xDefault).pathname);
  if (!pages.has(targetPath)) {
    errors.push(
      `[SPEC-012/AC-012.10] ${url} declara x-default para ${xDefault}, que não existe no artefato`,
    );
  }
}

// 4 — the sitemap mirrors the head pairs.
const sitemapFiles = readdirSync(DIST).filter((name) =>
  /^sitemap-\d+\.xml$/.test(name),
);
let sitemapLinks = 0;
for (const name of sitemapFiles) {
  const xml = readFileSync(join(DIST, name), "utf8");
  sitemapLinks += (xml.match(/xhtml:link/g) ?? []).length;
}
const headPairs = [...pages.values()].reduce(
  (total, page) =>
    total +
    [...page.alternates.keys()].filter((lang) => lang !== "x-default").length,
  0,
);
if (sitemapLinks !== headPairs) {
  errors.push(
    `[SPEC-012/AC-012.10] o sitemap declara ${sitemapLinks} par(es) xhtml:link e o <head> declara ${headPairs} — as duas superfícies devem espelhar`,
  );
}

if (errors.length > 0) {
  console.error(
    `[verify-hreflang] ${errors.length} violação(ões) de hreflang — SPEC-012/AC-012.10`,
  );
  for (const error of errors) console.error(`  ${error}`);
  process.exit(1);
}

console.log(
  `✓ verify-hreflang: ${pages.size} páginas · ${headPairs} par(es) recíprocos · sitemap espelha ${sitemapLinks} xhtml:link`,
);
