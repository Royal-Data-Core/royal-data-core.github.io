#!/usr/bin/env node
/**
 * SPEC-004 — new-blog-post scaffold (`npm run new:post -- <slug>`).
 *
 * Creates `src/content/blog/<slug>.mdx` from the SPEC-004 frontmatter
 * template, defaulting to `draft: true` so a draft never reaches the
 * published artifact (AC-004.2), and prints the created path.
 *
 * Slugs MUST be EN kebab-case (ADR-000: route/content slugs in EN; no
 * accented identifiers) and validate against /^[a-z0-9]+(?:-[a-z0-9]+)*$/.
 * Refuses to overwrite an existing post (fail-closed).
 *
 * Body skeleton follows `.ai/COPY-BRIEF.md §10` mandatory structure:
 * Contexto → Problema → Análise → Solução → Limitações da solução →
 * Resultado medido → Referências. Zero npm dependencies (§C11).
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const BLOG_DIR = join("src", "content", "blog");

const slug = process.argv[2];
if (!slug) {
  console.error("[SPEC-004] Usage: npm run new:post -- <slug-kebab-case>");
  process.exit(1);
}
if (!SLUG_PATTERN.test(slug)) {
  console.error(
    `[SPEC-004] invalid slug "${slug}" — use EN kebab-case, [a-z0-9-] only (ADR-000)`,
  );
  process.exit(1);
}

const target = join(BLOG_DIR, `${slug}.mdx`);
if (existsSync(target)) {
  console.error(
    `[SPEC-004] post already exists, refusing to overwrite: ${target}`,
  );
  process.exit(1);
}

const publishDate = new Date().toISOString().slice(0, 10);

const template = [
  "---",
  'title: "Título provisório — editar antes de publicar"',
  'description: "Rascunho de resumo do artigo: ponto de partida técnico, evidência e resultado medido, em 80 a 200 caracteres. Editar antes de publicar."',
  `publishDate: "${publishDate}"`,
  'tags: ["quality-engineering"] # 1–6 tags, /^[a-z0-9-]+$/',
  'coverAlt: "Imagem de capa provisória — editar antes de publicar"',
  '# coverSrc: "/blog/<slug>/cover.avif" # optional, resolved via withBase()',
  'lang: "pt-BR"',
  "draft: true # delete this line only when the post is publish-ready",
  "---",
  "",
  "<!-- Editing guide: fill every placeholder, then remove this guide and the",
  "     placeholders. Draft posts are excluded from dist/, rss.xml and the",
  "     Pagefind index (SPEC-004 AC-004.2) until draft: false. -->",
  "",
  "## Contexto",
  "<!-- Why this topic matters now; what the reader already knows. -->",
  "",
  "## Problema",
  "<!-- State the problem with concrete evidence (measurement, log, report). -->",
  "",
  "## Análise",
  "<!-- Root-cause reasoning; how the evidence maps to the hypothesis. -->",
  "",
  "## Solução",
  "<!-- Tested code or configuration that addresses the problem. -->",
  "",
  "## Limitações da solução",
  "<!-- Mandatory session (COPY-BRIEF §10): what this fix does NOT cover. -->",
  "",
  "## Resultado medido",
  "<!-- Numbers after the fix; how they were measured. -->",
  "",
  "## Referências",
  "<!-- Verifiable sources: spec IDs, official docs, exact URL. -->",
  "",
].join("\n");

mkdirSync(BLOG_DIR, { recursive: true });
writeFileSync(target, template, "utf8");
console.log(`✓ [SPEC-004] created ${target} (draft: true)`);
