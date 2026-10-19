#!/usr/bin/env node
/**
 * CONSTITUTION §C8 §C10 · SPEC-008 · static-analysis-enforcer
 *
 * Auditoria deterministica do artefato publicado (dist/):
 *   1. Budget de bundle: JS <= 50 KB gzip (rota inicial), CSS <= 30 KB gzip total
 *   2. Zero script inline fora de application/ld+json            (SPEC-008 AC-008.5)
 *   3. Zero handler "on*"                                        (SPEC-008 AC-008.5)
 *   4. Zero recurso externo (src/href, @import)                   (SPEC-008 AC-008.6)
 *      Um URL absoluto so e "externo" quando o host difere da origem do site
 *      E nao e link[rel~=(canonical|alternate|icon|sitemap|manifest)] nem
 *      ancora de navegacao <a> (ancoras externas seguem exigindo
 *      rel="noopener noreferrer" — SPEC-005/AC-005.5).
 *   5. SRI obrigatorio em script externo                          (SPEC-008 AC-008.7)
 *   6. Zero mixed content "http://"                               (SPEC-008 AC-008.9)
 *   7. data-testid em elementos interativos                       (§C12.6)
 *   8. CSP-meta presente e byte-identica ao canone                (SPEC-008 AC-008.1/2/4)
 *      Parse de atributo quote-aware (a aspa de abertura define o fechamento)
 *      + des-entitizacao: valores com 'self' nao sao mais truncados em
 *      "default-src" (defeito historico do regex [^']+).
 *   9. Trackers (Kill Switch §C9 / §C7) — scan APENAS em superficies de RECURSO:
 *      `<script src>`, corpo de `<script>`/`<style>`, `<link href>`, `<img src>`,
 *      diretrizes CSP (script-src/connect-src/img-src) e valores citados de
 *      atributos nao-textuais. Texto visivel (text nodes, title/alt/aria-label/
 *      placeholder, meta description/og:*) NUNCA e scanneado — /privacidade/
 *      cita nomes de trackers EM TEXTO por design (COPY-BRIEF) e CITAR nao e
 *      INJETAR. Um runtime real injetado (script src/corpo, CSP liberando
 *      host externo) continua a KILL como antes, sem Bypass.
 *
 * Uso: node scripts/audit-bundle.mjs --dist dist [--budget-js 51200] [--budget-css 30720] [--origin https://...]
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { gzipSync } from "node:zlib";

const argv = process.argv.slice(2);
const opt = (flag, dflt) => {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : dflt;
};
const DIST = opt("--dist", "dist");
const BUDGET_JS = Number(opt("--budget-js", 50 * 1024)); // §C10
const BUDGET_CSS = Number(opt("--budget-css", 30 * 1024)); // §C10

/** Politica canonica — SPEC-008. Qualquer divergencia = falha. */
const CSP_CANON = [
  "default-src 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "media-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

const TRACKERS = [
  "google-analytics",
  "googletagmanager",
  "gtag(",
  "googletagservices",
  "doubleclick",
  "facebook.net",
  "fbq(",
  "connect.facebook",
  "hotjar",
  "clarity.ms",
  "mouseflow",
  "fullstory",
  "mixpanel",
  "segment.io",
  "segment.com",
  "amplitude",
  "heap.io",
  "plausible.io",
  "umami",
  "matomo",
  "piwik",
  "linkedin.com/px",
  "licdn.com/lms",
  "twitter.com/i/adsct",
  "t.co/i/adsct",
];

/** Token URL de tracker para superficies de recurso (attrs citados / strings). */
const TRACKER_URL_TOKEN =
  /(hotjar|mixpanel|googletagmanager|facebook|clarity|amazon-aws(?:clickbeacon)?)\.[a-z]{2,}\//gi;

/** Namespaces legitimos que usam http:// sem efetuar fetch (SPEC-008 AC-008.9). */
const HTTP_ALLOWLIST = [
  "http://www.w3.org/",
  "http://schema.org",
  "http://purl.org/",
];

const errors = [];
const warnings = [];
const fail = (rule, file, msg) => errors.push(`[${rule}] ${file}: ${msg}`);
const warn = (rule, file, msg) => warnings.push(`[${rule}] ${file}: ${msg}`);

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) {
      if (entry === "_pagefind") continue; // indice gerado, nao e codigo nosso
      yield* walk(p);
    } else yield p;
  }
}

const files = [...walk(DIST)];
const htmlFiles = files.filter((f) => f.endsWith(".html"));
const jsFiles = files.filter((f) => f.endsWith(".js"));
const cssFiles = files.filter((f) => f.endsWith(".css"));

// ── Origem do site (defeito b: base para julgar "externo") ─────────
// Precedencia deterministica: --origin > env SITE > literal de fallback
// em astro.config.mjs (ADR-004). Resolve uma vez; deterministico.
function resolveSiteOrigin() {
  const fromFlag = opt("--origin", null);
  if (fromFlag) return fromFlag.replace(/\/+$/, "");
  if (process.env.SITE) return process.env.SITE.replace(/\/+$/, "");
  try {
    const cfg = readFileSync(resolve("astro.config.mjs"), "utf8");
    const m = /\?\?\s*(["'])(https:\/\/[^'"\s]+)\1/.exec(cfg); // literal de fallback de SITE
    if (m) return m[2].replace(/\/+$/, "");
  } catch {
    /* config ausente — segue default */
  }
  return "https://royaldatacore.github.io"; // default local de astro.config.mjs
}

let ORIGIN_HOST = null;
{
  const raw = resolveSiteOrigin();
  try {
    ORIGIN_HOST = new URL(raw).host.toLowerCase();
  } catch {
    fail(
      "SPEC-001/AC-001.N1",
      "--",
      `origem do site invalida (env SITE / --origin): ${raw}`,
    );
  }
}
const sameOrigin = (url) => {
  if (ORIGIN_HOST === null) return false; // fail-closed
  try {
    return new URL(url).host.toLowerCase() === ORIGIN_HOST;
  } catch {
    return false; // URL malformado -> tratado como externo (fail-closed)
  }
};

// ── Bundle budget ─────────────────────────────────────────────────
const gz = (p) => gzipSync(readFileSync(p), { level: 9 }).byteLength;
const totalJs = jsFiles.reduce((a, p) => a + gz(p), 0);
const totalCss = cssFiles.reduce((a, p) => a + gz(p), 0);

console.log(`\n── Bundle audit (${DIST}) ───────────────────────────`);
console.log(`HTML files : ${htmlFiles.length}`);
console.log(
  `JS  total  : ${(totalJs / 1024).toFixed(2)} KB gzip  (budget ${(BUDGET_JS / 1024).toFixed(0)} KB)`,
);
console.log(
  `CSS total  : ${(totalCss / 1024).toFixed(2)} KB gzip  (budget ${(BUDGET_CSS / 1024).toFixed(0)} KB)`,
);
console.log(`Site origin: ${ORIGIN_HOST ?? "(invalida — fail-closed)"}`);

if (totalCss > BUDGET_CSS)
  fail(
    "§C10",
    DIST,
    `CSS ${(totalCss / 1024).toFixed(1)} KB gzip excede budget de ${(BUDGET_CSS / 1024).toFixed(0)} KB`,
  );
if (totalJs > BUDGET_JS)
  fail(
    "§C10",
    DIST,
    `JS ${(totalJs / 1024).toFixed(1)} KB gzip excede budget de ${(BUDGET_JS / 1024).toFixed(0)} KB — SPEC-007 permite ate 20 KB na rota /busca; o restante do site deve ser 0 KB`,
  );

// ── Parse deterministico de HTML (defeito a: aspas apostrofadas) ───
const ENTITIES = {
  quot: '"',
  "#34": '"',
  "#x22": '"',
  apos: "'",
  "#39": "'",
  "#x27": "'",
  amp: "&",
  "#38": "&",
  "#x26": "&",
  lt: "<",
  "#60": "<",
  "#x3c": "<",
  gt: ">",
  "#62": ">",
  "#x3e": ">",
};
/** Des-entitiza os caracteres usados em valores de atributo (deterministico). */
const decodeEntities = (s) =>
  s.replace(
    /&(quot|apos|lt|gt|amp|#x?(?:22|27|26|3c|3e)|#(?:34|39|38|60|62));/gi,
    (tok, name) => ENTITIES[name.toLowerCase()] ?? tok,
  );

/**
 * Valor de atributo: a aspa de abertura define o fechamento correspondente.
 * `"<...>"` engole apostrofos internos ('self'); `'...'` engole aspas duplas;
 * entidades (&quot;/&apos;/&amp;/&lt;/&gt;) e escapes (\") nao terminam o valor.
 * Terceira alternativa: valor nao-entre-aspas (grammar HTML5).
 */
const ATTR_VALUE =
  /([a-zA-Z][\w:-]*)\s*=\s*("(?:[^"]|\\.|&[^;]+;)*"|'(?:[^']|\\.|&[^;]+;)*'|[^\s"'=<>]+)/g;

/** Extrai atributos de uma string de attrs: Map<lowercase, valor decodificado>. */
const parseAttrs = (attrsRaw) => {
  const map = new Map();
  for (const m of attrsRaw.matchAll(ATTR_VALUE)) {
    let v = m[2];
    if (v[0] === '"' || v[0] === "'") v = v.slice(1, -1);
    map.set(m[1].toLowerCase(), decodeEntities(v));
  }
  return map;
};

/** Tags com attrs quote-aware (aceita '>' e apostrofos dentro de aspas). */
const TAG_RE = /<([a-zA-Z][a-zA-Z0-9:-]*)\s+((?:[^>'"]|"[^"]*"|'[^']*')*)>/g;
const SCRIPT_RE =
  /<script\b((?:[^>'"]|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/script\s*>/gi;
const STYLE_RE =
  /<style\b((?:[^>'"]|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/style\s*>/gi;

/** Atributos cujo valor e TEXTO VISIVEL — nunca sao scanneados como recurso (§C9). */
const VISIBLE_ATTR = /^(?:title|alt|aria-label|aria-description|placeholder)$/i;
/** Metas cujo content e texto visivel de preview/descricao (inclui SDs sociais). */
const VISIBLE_META =
  /^(?:description|og:title|og:description|og:site_name|og:image:alt|twitter:title|twitter:description)$/i;

// ── 2..9. Auditoria por arquivo HTML ───────────────────────────────
const rel = (p) => relative(process.cwd(), p);

for (const f of htmlFiles) {
  const src = readFileSync(f, "utf8");
  const file = rel(f);

  /** Superficies de recurso p/ §C9 (attrs citados, corpos de script/style, CSP). */
  const surfaces = [];
  /** CSP metas coletadas com parse quote-aware (defeito a). */
  const cspEntries = [];
  /** Metas referrer coletadas (ADR-002 D2). */
  const referrerContents = [];
  let scriptPairs = 0;

  // — <script>: src/corpo via par completo (TAG_RE pula 'script') ————
  for (const m of src.matchAll(SCRIPT_RE)) {
    scriptPairs += 1;
    const attrs = parseAttrs(m[1] ?? "");
    const hasSrc = attrs.has("src");
    const type = (attrs.get("type") ?? "").toLowerCase();
    const isLdJson = type === "application/ld+json";
    const srcValue = attrs.get("src") ?? "";

    for (const [k, v] of attrs) surfaces.push(v);

    // 2. Script inline sem src, fora de ld+json
    if (!hasSrc && !isLdJson) {
      fail(
        "SPEC-008/AC-008.5",
        file,
        `script inline sem src e sem type=application/ld+json viola script-src 'self' → <script${m[1] ?? ""}>`.slice(
          0,
          190,
        ),
      );
    }
    // 5. SRI em script externo
    if (hasSrc && /^https?:\/\//i.test(srcValue)) {
      if (!/^sha(256|384|512)-/i.test(attrs.get("integrity") ?? "")) {
        fail(
          "SPEC-008/AC-008.7 · §C8",
          file,
          `script externo sem SRI: ${srcValue}`,
        );
      }
      if (attrs.get("crossorigin") !== "anonymous") {
        fail(
          "§C8",
          file,
          `script externo sem crossorigin="anonymous": ${srcValue}`,
        );
      }
    }
    // Corpo inline: CODIGO (executado/parseado), nunca texto visivel. Inclui
    // ld+json (dado Inerte; tokens ali nao executam, mas fail-closed do KILL).
    surfaces.push(decodeEntities(m[2] ?? ""));
  }
  // par `<script ...>` sem `</script>` (HTML invalido) — sinaliza a lacuna de parse
  const totalScriptOpenings = (src.match(/<script\b/gi) ?? []).length;
  if (totalScriptOpenings !== scriptPairs) {
    warn(
      "SPEC-008",
      file,
      `<script> sem par fechado: ${totalScriptOpenings - scriptPairs} tag(s) ignorada(s) no parse em pares`,
    );
  }

  // — <style> inline (Astro inlineStylesheets: 'auto' pode inlinar CSS) —
  for (const m of src.matchAll(STYLE_RE)) {
    const body = decodeEntities(m[2] ?? "");
    surfaces.push(body); // CSS é código, não texto visível
    for (const c of body.matchAll(
      /@import\s+(?:url\()?["']?(https?:\/\/[^"')\s]+)/gi,
    )) {
      fail(
        "SPEC-008/AC-008.6",
        file,
        `@import externo em <style>: ${c[1]} — ADR-001 determina assets self-hosted`,
      );
    }
  }

  // — Demais tags: attrs → superficies §C9; href/src → recurso externo (defeito b)
  for (const m of src.matchAll(TAG_RE)) {
    const tag = m[1].toLowerCase();
    if (tag === "script" || tag === "style") continue; // cobertos acima
    const attrs = parseAttrs(m[2] ?? "");
    const href = attrs.get("href");
    const resource = attrs.get("src") ?? href;
    const metaNames =
      tag === "meta"
        ? [attrs.get("name") ?? "", attrs.get("property") ?? ""]
            .filter(Boolean)
            .map((n) => n.toLowerCase())
        : [];
    const visibleMetaContent =
      tag === "meta" && metaNames.some((n) => VISIBLE_META.test(n));
    const relAttr = attrs.get("rel") ?? "";

    // superficies de scan de tracker (§C9): valores citados de atributos,
    // jamais texto visivel (atributos textuais e metas de preview excluidos)
    for (const [k, v] of attrs) {
      if (VISIBLE_ATTR.test(k)) continue;
      if (visibleMetaContent && k === "content") continue;
      surfaces.push(v);
    }

    // 8/8b. CSP e referrer metas coletadas com parse quote-aware (ordem de
    // atributos indiferente — elimina o regex frágil que truncava em 'self')
    if (tag === "meta") {
      if (
        (attrs.get("http-equiv") ?? "").toLowerCase() ===
          "content-security-policy" &&
        attrs.has("content")
      ) {
        cspEntries.push(attrs.get("content"));
      }
      if (
        (attrs.get("name") ?? "").toLowerCase() === "referrer" &&
        attrs.has("content")
      ) {
        referrerContents.push(attrs.get("content"));
      }
    }

    // 7. data-testid em interativos (independente de href/src)
    if (
      tag === "button" ||
      tag === "input" ||
      tag === "select" ||
      tag === "textarea"
    ) {
      if (!attrs.has("data-testid")) {
        warn("§C12.6", file, `<${tag}> sem data-testid → ${m[0].slice(0, 80)}`);
      }
    }

    // 4. Recursos externos (defeito b): externo ⇔ host difere da origem do site
    //    E nao e link[rel~=exempt-list] nem ancora <a> de navegacao
    if (!resource || !/^https?:\/\//i.test(resource)) continue;
    if (sameOrigin(resource)) continue; // mesmo dominio absoluto nao e recurso externo

    if (
      tag === "link" &&
      /\b(?:canonical|alternate|icon|sitemap|manifest)\b/i.test(relAttr)
    ) {
      warn(
        "SPEC-008/AC-008.6",
        file,
        `link[rel="${relAttr}"] fora da origem do site (${new URL(resource).host}): ${resource}`,
      );
      continue;
    }
    if (tag === "a") {
      // ancora de navegacao: exige noopener (SPEC-005/AC-005.5)
      if (!/\b(?:noopener|noreferrer)\b/i.test(relAttr)) {
        fail(
          "SPEC-005/AC-005.5 · ASVS V8.3",
          file,
          `link externo sem rel="noopener noreferrer": ${resource}`,
        );
      }
      continue;
    }
    fail(
      "SPEC-008/AC-008.6",
      file,
      `recurso externo carregado (${new URL(resource).host}) — apenas 'self' e permitido`,
    );
  }

  // 3. Handlers inline on* (quote-tolerante)
  for (const m of src.matchAll(/\son[a-z]+\s*=\s*["'][^"']*["']/gi)) {
    fail(
      "SPEC-008/AC-008.5",
      file,
      `handler inline detectado → ${m[0].trim().slice(0, 60)}`,
    );
  }

  // 6. Mixed content
  for (const m of src.matchAll(/["'(](http:\/\/[^"')\s]+)/g)) {
    const url = m[1];
    if (!HTTP_ALLOWLIST.some((p) => url.startsWith(p))) {
      fail("SPEC-008/AC-008.9", file, `mixed content: ${url}`);
    }
  }

  // 8. CSP-meta (defeito a: aspas pareadas + des-entitizacao)
  if (cspEntries.length === 0)
    fail("SPEC-008/AC-008.1", file, "meta Content-Security-Policy ausente");
  for (const raw of cspEntries) {
    const got = raw.replace(/\s+/g, " ").replace(/;\s*$/g, "").trim();
    if (got !== CSP_CANON) {
      fail(
        "SPEC-008/AC-008.1",
        file,
        `CSP diverge do canone de SPEC-008.\n      esperado: ${CSP_CANON}\n      obtido  : ${got}`,
      );
    }
    for (const banned of [
      "frame-ancestors",
      "report-uri",
      "report-to",
      "sandbox",
    ]) {
      if (new RegExp(`\\b${banned}\\b`).test(got)) {
        fail(
          "SPEC-008/AC-008.2 · ADR-002",
          file,
          `diretiva "${banned}" e ignorada em meta-tag — remove-la e obrigatorio (documentacao enganosa)`,
        );
      }
    }
    const scriptSrc = /script-src\s+([^;]*)/i.exec(got)?.[1] ?? "";
    if (/'unsafe-inline'/.test(scriptSrc))
      fail(
        "SPEC-008/AC-008.4 · §C9",
        file,
        "'unsafe-inline' em script-src e KILL SWITCH",
      );
    if (
      /'unsafe-eval'/.test(scriptSrc) &&
      !/'wasm-unsafe-eval'/.test(scriptSrc)
    )
      fail("SPEC-008/AC-008.4", file, "'unsafe-eval' em script-src e proibido");
    if (!/'wasm-unsafe-eval'/.test(scriptSrc))
      warn(
        "SPEC-007/AC-007.N1",
        file,
        "script-src sem 'wasm-unsafe-eval' quebrara o WASM do Pagefind",
      );
    // diretrizes CSP sao superficie de recurso (§C9): script-src/connect-src/img-src
    for (const d of ["script-src", "connect-src", "img-src"]) {
      const v = new RegExp(`${d}\\s+([^;]*)`, "i").exec(got)?.[1];
      if (v) surfaces.push(v);
    }
  }

  // 8b. referrer meta (ADR-002 D2)
  if (
    !referrerContents.some(
      (c) => c.toLowerCase() === "strict-origin-when-cross-origin",
    )
  ) {
    fail(
      "ADR-002 D2",
      file,
      '<meta name="referrer" content="strict-origin-when-cross-origin"> ausente',
    );
  }

  // 9. Trackers (Kill Switch §C7 · §C9) — APENAS em superficies de recurso
  const reported = new Set();
  for (const surface of surfaces) {
    const low = surface.toLowerCase();
    for (const t of TRACKERS) {
      const tok = t.toLowerCase();
      if (low.includes(tok) && !reported.has(tok)) {
        reported.add(tok);
        fail(
          "§C7 · §C9 KILL SWITCH",
          file,
          `tracker detectado em recurso: "${t}" — sem Bypass disponivel`,
        );
      }
    }
    for (const m of surface.matchAll(TRACKER_URL_TOKEN)) {
      const tok = m[0].toLowerCase();
      if (!reported.has(tok)) {
        reported.add(tok);
        fail(
          "§C7 · §C9 KILL SWITCH",
          file,
          `tracker URL detectada em recurso: ${m[0]}`,
        );
      }
    }
  }
}

// ── CSS: @import externo e trackers ────────────────────────────────
for (const f of cssFiles) {
  const src = readFileSync(f, "utf8");
  const file = rel(f);
  for (const m of src.matchAll(
    /@import\s+(?:url\()?["']?(https?:\/\/[^"')\s]+)/gi,
  )) {
    fail(
      "SPEC-008/AC-008.6",
      file,
      `@import externo: ${m[1]} — ADR-001 determina system font stack`,
    );
  }
  for (const t of TRACKERS) {
    if (src.toLowerCase().includes(t.toLowerCase()))
      fail("§C9 KILL SWITCH", file, `tracker em CSS: ${t}`);
  }
}

// ── JS: storage, trackers, secrets, fetch externo ──────────────────
const SECRET_PATTERNS = [
  [/ghp_[A-Za-z0-9]{36}/, "GitHub PAT"],
  [/github_pat_[A-Za-z0-9_]{22,}/, "GitHub fine-grained PAT"],
  [/AKIA[0-9A-Z]{16}/, "AWS access key"],
  [/xox[baprs]-[A-Za-z0-9-]{10,}/, "Slack token"],
  [/sk-[A-Za-z0-9]{20,}/, "OpenAI-style secret key"],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, "chave privada"],
];

for (const f of jsFiles) {
  const src = readFileSync(f, "utf8");
  const file = rel(f);
  if (
    /localStorage\.(setItem|removeItem|clear)|sessionStorage\.(setItem|removeItem|clear)|document\.cookie\s*=/.test(
      src,
    )
  ) {
    fail(
      "§C7 · SPEC-009/AC-009.N2",
      file,
      "escrita em storage/cookie detectada — zero rastreamento",
    );
  }
  for (const t of TRACKERS) {
    if (src.toLowerCase().includes(t.toLowerCase()))
      fail("§C9 KILL SWITCH", file, `tracker em JS: ${t}`);
  }
  for (const m of src.matchAll(TRACKER_URL_TOKEN)) {
    fail("§C9 KILL SWITCH", file, `tracker URL em JS: ${m[0]}`);
  }
  for (const [re, label] of SECRET_PATTERNS) {
    if (re.test(src))
      fail(
        "§C12.5 · static-analysis-enforcer",
        file,
        `possivel secret no bundle client-side: ${label}`,
      );
  }
  for (const m of src.matchAll(/fetch\(\s*["'`](https?:\/\/[^"'`]+)/g)) {
    fail(
      "SPEC-008/AC-008.6",
      file,
      `fetch() a host externo: ${m[1]} — connect-src 'self'`,
    );
  }
}

// ── Artefatos obrigatorios ─────────────────────────────────────────
for (const required of ["index.html", "404.html", ".nojekyll", "robots.txt"]) {
  if (!files.some((f) => relative(DIST, f) === required)) {
    fail(
      "BLUEPRINT §2 · RFC-001 FM-06",
      DIST,
      `artefato obrigatorio ausente: ${required}`,
    );
  }
}

// ── Resultado ──────────────────────────────────────────────────────
if (warnings.length) {
  console.log(`\n⚠ ${warnings.length} warning(s):`);
  for (const w of warnings) console.log(`  ${w}`);
}
if (errors.length) {
  console.error(`\n✗ ${errors.length} violacao(oes):`);
  for (const e of errors) console.error(`  ${e}`);
  console.error(
    "\nAudit falhou. Corrija ou solicite Bypass Protocol com os 3 pilares (§C4).",
  );
  process.exit(1);
}
console.log(
  `\n✓ audit-bundle: 0 violacoes · ${htmlFiles.length} HTML · ${jsFiles.length} JS · ${cssFiles.length} CSS`,
);
process.exit(0);
