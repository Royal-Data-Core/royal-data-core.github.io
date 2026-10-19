/**
 * scripts/generate-og.mjs — produces public/og-default.png (1200x630, ≤ 100 KB).
 *
 * ADR-001/ADR-002: `sharp` is the ONLY image pipeline (local, no CDN, no
 * external font hosts — text is drawn as SVG with a system font stack, so the
 * PNG is rendered server-side deterministically). Run once; commit the PNG.
 *
 * Usage: node scripts/generate-og.mjs
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const brand700 = "#1d4ed8";
const brand900 = "#172554";
const white = "#ffffff";
const slate200 = "#e2e8f0";

const W = 1200;
const H = 630;

const titleLines = ["Engenharia de qualidade", "para software crítico"];
const subtitle = "Consultoria em testes de software · Royal Data Core";

/**
 * SVG text uses ONLY generic system families (interface/sans-serif) — no webfont
 * fetch, keeping SPEC-008 font-src 'self' and PERF-5 (no download) satisfied.
 */
function buildSvg(rasterizeTitle = true) {
  const titleSpans = titleLines
    .map(
      (line, index) =>
        `    <text x="80" y="${300 + index * 88}" font-family="system-ui, sans-serif" font-size="76" font-weight="800" fill="${white}">${line}</text>`,
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

const outDir = path.resolve("public");
await mkdir(outDir, { recursive: true });

const svg = Buffer.from(buildSvg());
const png = await sharp(svg, { density: 96 })
  .resize(W, H, { fit: "cover" })
  .png({
    compressionLevel: 9,
    adaptiveFiltering: true,
    palette: true,
    colors: 64,
  })
  .toBuffer();

const outPath = path.join(outDir, "og-default.png");
await writeFile(outPath, png);

const stat = await sharp(outPath).metadata();
const bytes = png.byteLength;
const LIMIT = 100 * 1024;
if (bytes > LIMIT) {
  console.error(
    `[og-default] ${outPath} = ${bytes} bytes excede limite de ${LIMIT}`,
  );
  process.exitCode = 1;
} else {
  console.log(
    `[og-default] ok — ${outPath} = ${bytes} bytes (${stat.width}x${stat.height}, limite ${LIMIT})`,
  );
}
