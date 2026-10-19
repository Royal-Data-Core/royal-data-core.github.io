#!/usr/bin/env node
/**
 * SPEC-002 AC-002.N3 — commercial-copy gate · CONSTITUTION §C9.
 *
 * Scans `src/**` (all files; `src/content/blog/**` is inside that root) for
 * banned marketing vocabulary taken VERBATIM from `.ai/COPY-BRIEF.md`
 * ("Lista negra de termos"). Every hit prints `file:line`, the matched term
 * and the mandatory citation "CONSTITUTION §C9 — alegação não-verificável"
 * (AC-002.N3), then exits 1. Clean scan exits 0.
 *
 * The blacklist mirrors COPY-BRIEF 1:1 with three COPY-BRIEF-sanctioned
 * qualifiers implemented as deterministic number-proximity windows:
 *   - `robusto` (sem número), `escalável` (sem número) and `ágil` (como
 *     adjetivo vazio) only fail when no digit appears in the same sentence
 *     within 60 characters (quantified use is the copied exception).
 *
 * A line carrying `/*lint-copy-allow <code>*\/` suppresses a hit only for the
 * three quantifier-qualified terms above — the only whitelists COPY-BRIEF
 * sanctions. Standard terms never accept the marker.
 *
 * Usage: node scripts/lint-copy.mjs [root] [--terms <file.json>]
 * The positional root argument lets self-tests run against a synthetic tree
 * outside the worktree; `--terms` accepts a JSON array of
 * {key, pattern, flags?} entries to replace the built-in brief.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Word boundary helpers. JS `\b` is ASCII-only outside /u mode (accented
 * letters count as non-word chars), which breaks PT-BR words like "ábi…",
 * so boundaries are expressed with explicit letter/digit lookarounds.
 */
const W_START = "(?<![A-Za-z\\u00C0-\\u024F0-9_])";
const W_END = "(?![A-Za-z\\u00C0-\\u024F0-9_])";
/** COPY-BRIEF-sanctioned quantifier window: no digit in the same sentence. */
const NO_NUMBER = "(?![^.;!?\\r\\n]{0,60}\\d)";

const TERM_SOURCES = [
  {
    key: "inovador",
    allowance: false,
    source: `${W_START}inovador(?:es|e|as|a)?${W_END}`,
  },
  {
    key: "disruptivo",
    allowance: false,
    source: `${W_START}disruptiv(?:o|a|os|as)${W_END}`,
  },
  {
    key: "solucoes-de-ponta",
    allowance: false,
    source: `${W_START}solu\\u00e7\\u00f5es.{0,40}?de\\s+ponta`,
  },
  {
    key: "apaixonado-por",
    allowance: false,
    source: `${W_START}apaixonad(?:o|a)s?\\s+(?:por|pel[ao]s?)${W_END}`,
  },
  {
    key: "lider-de-mercado",
    allowance: false,
    source: `${W_START}l(?:\\u00ed|i)der(?:es)?\\s+de\\s+mercado`,
  },
  {
    key: "referencia-nacional",
    allowance: false,
    source: `${W_START}refer(?:\\u00ea|e)ncia\\s+nacional${W_END}`,
  },
  {
    key: "transformacao-digital",
    allowance: false,
    source: `${W_START}transforma\\u00e7(?:\\u00e3o|\\u00f5es)\\s+digita(?:l|is)${W_END}`,
  },
  {
    key: "sinergia",
    allowance: false,
    source: `${W_START}sinergia(?:s)?${W_END}`,
  },
  {
    key: "estado-da-arte",
    allowance: false,
    source: `${W_START}estado\\s+da\\s+arte${W_END}`,
  },
  {
    key: "melhor-do-mercado",
    allowance: false,
    source: `${W_START}melhor(?:es)?\\s+do\\s+mercado`,
  },
  {
    key: "paradigma",
    allowance: false,
    source: `${W_START}paradigma(?:s)?${W_END}`,
  },
  {
    key: "holistico",
    allowance: false,
    source: `${W_START}hol(?:\\u00ed|i)stic(?:o|a|os|as)${W_END}`,
  },
  {
    key: "robus-sem-numero",
    allowance: true,
    source: `${W_START}robust(?:o|a|os|as)${W_END}${NO_NUMBER}`,
  },
  {
    key: "escalavel-sem-numero",
    allowance: true,
    source: `${W_START}escal(?:\\u00e1|a)v(?:el|eis)${W_END}${NO_NUMBER}`,
  },
  {
    key: "agil-adjetivo-vazio",
    allowance: true,
    source: `${W_START}(?:\\u00e1|a)g(?:il|eis)${W_END}${NO_NUMBER}`,
  },
];

const BRIEF_TERMS = TERM_SOURCES.map((entry) => ({
  key: entry.key,
  allowance: entry.allowance,
  pattern: new RegExp(entry.source, "iu"),
}));

const ALLOW_MARK = /\/\*\s*lint-copy-allow\s+([a-z0-9-]+)\s*\*\//g;

function parseArgs(argv) {
  let termsPath = null;
  let root = "src";
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--terms") {
      termsPath = argv[i + 1];
      i += 1;
      continue;
    }
    if (argv[i].startsWith("--terms=")) {
      termsPath = argv[i].slice("--terms=".length);
      continue;
    }
    if (!argv[i].startsWith("--")) root = argv[i];
  }
  return { root, termsPath };
}

function loadTerms(termsPath) {
  if (!termsPath) return BRIEF_TERMS;
  const raw = JSON.parse(readFileSync(termsPath, "utf8"));
  if (!Array.isArray(raw)) {
    throw new Error("[lint-copy] --terms file must hold a JSON array");
  }
  return raw.map((entry) => ({
    key: String(entry.key),
    pattern: new RegExp(entry.pattern, entry.flags ?? "i"),
    allowance: false,
  }));
}

function collectFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) files.push(...collectFiles(path));
    else files.push(path);
  }
  return files;
}

const { root, termsPath } = parseArgs(process.argv.slice(2));
if (!existsSync(root)) {
  console.error(`[lint-copy] root not found: ${root}`);
  process.exit(1);
}

const terms = loadTerms(termsPath);
const violations = [];

for (const file of collectFiles(root)) {
  const text = readFileSync(file, "utf8");
  const lines = text.split(/\r\n|\n/);
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    const marks = [];
    ALLOW_MARK.lastIndex = 0;
    let mark;
    while ((mark = ALLOW_MARK.exec(line)) !== null) marks.push(mark[1]);
    for (const term of terms) {
      if (!term.pattern.test(line)) continue;
      if (term.allowance && marks.includes(term.key)) continue; // sanctioned
      violations.push({
        file: relative(process.cwd(), file),
        line: lineIndex + 1,
        term: term.key,
      });
    }
  }
}

if (violations.length > 0) {
  console.error(
    `[lint-copy] ${violations.length} banned marketing term(s) · CONSTITUTION §C9 — alegação não-verificável (COPY-BRIEF)`,
  );
  for (const v of violations) {
    console.error(
      `  ${v.file}:${v.line} · term "${v.term}" · CONSTITUTION §C9 — alegação não-verificável`,
    );
  }
  process.exit(1);
}
console.log("✓ lint-copy: 0 banned terms (SPEC-002 AC-002.N3)");
process.exit(0);
