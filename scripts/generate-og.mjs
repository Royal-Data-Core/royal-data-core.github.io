#!/usr/bin/env node
/**
 * scripts/generate-og.mjs — produces the Open Graph images:
 *   public/og-default.png (pt-BR) and public/og-en.png (en) — 1200x630, ≤ 100 KB each.
 *
 * ADR-001/ADR-002: `sharp` is the ONLY image pipeline (local, no CDN, no
 * external font hosts — text is drawn as SVG with a system font stack, so the
 * PNG is rendered server-side deterministically). Run once; commit the PNGs.
 *
 * SPEC-010 §8 — brand lockup: the isotyper (public/brand/isotyper-color-alpha.webp,
 * 18 KB) is composited on a white plate in the top-right corner, so social
 * shares carry the mark instead of a flat colour rectangle.
 *
 * SPEC-012 AC-012.8 — one image per locale: a shared OG would leak the
 * Portuguese headline into English shares.
 *
 * Usage: node scripts/generate-og.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const brand700 = "#1d4ed8";
const brand900 = "#172554";
const white = "#ffffff";
const slate200 = "#e2e8f0";

const W = 1200;
const H = 630;
const LIMIT = 100 * 1024;

/**
 * SVG text uses ONLY generic system families (interface/sans-serif) — no webfont
 * fetch, keeping SPEC-008 font-src 'self' and PERF-5 (no download) satisfied.
 */
function buildSvg({ titleLines, subtitle }) {
  const titleSpans = titleLines
    .map(
      (line, index) =>
        `    <text x="80" y="${300 + index * 88}" font-family="system-ui, sans-serif" font-size="70" font-weight="800" fill="${white}">${line}</text>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${brand700}"/>
  <rect x="0" y="${H - 12}" width="${W}" height="12" fill="${slate200}" opacity="0.35"/>
  <rect x="80" y="120" width="120" height="8" fill="${white}" opacity="0.9"/>
${titleSpans}
  <text x="80" y="512" font-family="system-ui, sans-serif" font-size="34" font-weight="500" fill="${white}" opacity="0.92">${subtitle}</text>
  <text x="80" y="566" font-family="ui-monospace, monospace" font-size="24" fill="${brand900}">royaldatacore.github.io</text>
</svg>`;
}

/** Brand plate — white rounded square + isotyper (SPEC-010 §8). */
const PLATE = 180;
const logoBuffer = await sharp("public/brand/isotyper-color-alpha.webp")
  .resize({ width: 138, withoutEnlargement: true })
  .png()
  .toBuffer();
const plateSvg = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${PLATE}" height="${PLATE}">` +
    `<rect width="${PLATE}" height="${PLATE}" rx="32" fill="#ffffff"/></svg>`,
);
const plateWithLogo = await sharp(plateSvg)
  .composite([{ input: logoBuffer, top: 21, left: 21 }])
  .png()
  .toBuffer();

const VARIANTS = [
  {
    file: "og-default.png",
    titleLines: ["Engenharia de qualidade", "para software crítico"],
    subtitle: "Consultoria em testes de software · Royal Data Core",
  },
  {
    file: "og-en.png",
    titleLines: ["Quality engineering", "for critical software"],
    subtitle: "Software testing consulting · Royal Data Core",
  },
];

const outDir = path.resolve("public");
await mkdir(outDir, { recursive: true });

for (const variant of VARIANTS) {
  const basePng = await sharp(Buffer.from(buildSvg(variant)), { density: 96 })
    .resize(W, H, { fit: "cover" })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();

  const png = await sharp(basePng)
    .composite([{ input: plateWithLogo, top: 56, left: W - PLATE - 56 }])
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true,
      palette: true,
      colors: 64,
    })
    .toBuffer();

  const outPath = path.join(outDir, variant.file);
  await writeFile(outPath, png);

  const stat = await sharp(outPath).metadata();
  const bytes = png.byteLength;
  if (bytes > LIMIT) {
    console.error(
      `[${variant.file}] ${outPath} = ${bytes} bytes excede limite de ${LIMIT}`,
    );
    process.exitCode = 1;
  } else {
    console.log(
      `[${variant.file}] ok — ${outPath} = ${bytes} bytes (${stat.width}x${stat.height}, limite ${LIMIT})`,
    );
  }
}
