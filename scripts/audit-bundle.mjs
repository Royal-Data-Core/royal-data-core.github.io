#!/usr/bin/env node
/**
 * CONSTITUTION §C8 §C10 · SPEC-008 · static-analysis-enforcer
 *
 * Auditoria deterministica do artefato publicado (dist/):
 *   1. Budget de bundle: JS <= 50 KB gzip (rota inicial), CSS <= 30 KB gzip total
 *   2. Zero script inline fora de application/ld+json            (SPEC-008 AC-008.5)
 *   3. Zero handler "on*"                                        (SPEC-008 AC-008.5)
 *   4. Zero recurso externo (src/href/url()/@import)             (SPEC-008 AC-008.6)
 *   5. SRI obrigatorio em qualquer excecao externa               (SPEC-008 AC-008.7)
 *   6. Zero mixed content "http://"                              (SPEC-008 AC-008.9)
 *   7. data-testid em elementos interativos                      (§C12.6)
 *   8. CSP-meta presente e byte-identica ao canone               (SPEC-008 AC-008.1/2/4)
 *   9. Ausencia de trackers (Kill Switch §C9 / §C7)
 *
 * Uso: node scripts/audit-bundle.mjs --dist dist [--budget-js 51200] [--budget-css 30720]
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

const argv = process.argv.slice(2);
const opt = (flag, dflt) => {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : dflt;
};
const DIST = opt('--dist', 'dist');
const BUDGET_JS = Number(opt('--budget-js', 50 * 1024));   // §C10
const BUDGET_CSS = Number(opt('--budget-css', 30 * 1024)); // §C10

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
  'upgrade-insecure-requests',
].join('; ');

const TRACKERS = [
  'google-analytics', 'googletagmanager', 'gtag(', 'googletagservices',
  'doubleclick', 'facebook.net', 'fbq(', 'connect.facebook',
  'hotjar', 'clarity.ms', 'mouseflow', 'fullstory', 'mixpanel',
  'segment.io', 'segment.com', 'amplitude', 'heap.io', 'plausible.io',
  'umami', 'matomo', 'piwik', 'linkedin.com/px', 'licdn.com/lms',
  'twitter.com/i/adsct', 't.co/i/adsct',
];

/** Namespaces legitimos que usam http:// sem efetuar fetch (SPEC-008 AC-008.9). */
const HTTP_ALLOWLIST = ['http://www.w3.org/', 'http://schema.org', 'http://purl.org/'];

const errors = [];
const warnings = [];
const fail = (rule, file, msg) => errors.push(`[${rule}] ${file}: ${msg}`);
const warn = (rule, file, msg) => warnings.push(`[${rule}] ${file}: ${msg}`);

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) {
      if (entry === '_pagefind') continue; // indice gerado, nao e codigo nosso
      yield* walk(p);
    } else yield p;
  }
}

const files = [...walk(DIST)];
const htmlFiles = files.filter((f) => f.endsWith('.html'));
const jsFiles = files.filter((f) => f.endsWith('.js'));
const cssFiles = files.filter((f) => f.endsWith('.css'));

// ── 1. Budget de bundle ────────────────────────────────────────────
const gz = (p) => gzipSync(readFileSync(p), { level: 9 }).byteLength;
const totalJs = jsFiles.reduce((a, p) => a + gz(p), 0);
const totalCss = cssFiles.reduce((a, p) => a + gz(p), 0);

console.log(`\n── Bundle audit (${DIST}) ───────────────────────────`);
console.log(`HTML files : ${htmlFiles.length}`);
console.log(`JS  total  : ${(totalJs / 1024).toFixed(2)} KB gzip  (budget ${(BUDGET_JS / 1024).toFixed(0)} KB)`);
console.log(`CSS total  : ${(totalCss / 1024).toFixed(2)} KB gzip  (budget ${(BUDGET_CSS / 1024).toFixed(0)} KB)`);

if (totalCss > BUDGET_CSS) fail('§C10', DIST, `CSS ${(totalCss / 1024).toFixed(1)} KB gzip excede budget de ${(BUDGET_CSS / 1024).toFixed(0)} KB`);
if (totalJs > BUDGET_JS) fail('§C10', DIST, `JS ${(totalJs / 1024).toFixed(1)} KB gzip excede budget de ${(BUDGET_JS / 1024).toFixed(0)} KB — SPEC-007 permite ate 20 KB na rota /busca; o restante do site deve ser 0 KB`);

// ── 2..9. Auditoria por arquivo HTML ───────────────────────────────
const rel = (p) => relative(process.cwd(), p);

for (const f of htmlFiles) {
  const src = readFileSync(f, 'utf8');
  const file = rel(f);

  // 2. Script inline (exceto JSON-LD)
  for (const m of src.matchAll(/<script\b([^>]*)>/gi)) {
    const attrs = m[1] ?? '';
    const hasSrc = /\bsrc\s*=/i.test(attrs);
    const isLdJson = /type\s*=\s*["']application\/ld\+json["']/i.test(attrs);
    if (!hasSrc && !isLdJson) {
      fail('SPEC-008/AC-008.5', file, `script inline sem src e sem type=application/ld+json viola script-src 'self' → ${m[0].slice(0, 90)}`);
    }
    // 5. SRI em script externo
    if (hasSrc) {
      const srcVal = /\bsrc\s*=\s*["']([^"']+)["']/i.exec(attrs)?.[1] ?? '';
      if (/^https?:\/\//i.test(srcVal)) {
        if (!/integrity\s*=\s*["']sha(256|384|512)-/i.test(attrs)) {
          fail('SPEC-008/AC-008.7 · §C8', file, `script externo sem SRI: ${srcVal}`);
        }
        if (!/crossorigin\s*=\s*["']anonymous["']/i.test(attrs)) {
          fail('§C8', file, `script externo sem crossorigin="anonymous": ${srcVal}`);
        }
      }
    }
  }

  // 3. Handlers inline on*
  for (const m of src.matchAll(/\son[a-z]+\s*=\s*["'][^"']*["']/gi)) {
    fail('SPEC-008/AC-008.5', file, `handler inline detectado → ${m[0].trim().slice(0, 60)}`);
  }

  // 4. Recursos externos (src/href/url())
  for (const m of src.matchAll(/\b(?:src|href)\s*=\s*["'](https?:\/\/[^"']+)["']/gi)) {
    const url = m[1];
    const host = new URL(url).host;
    const isCanonical = /rel\s*=\s*["'][^"']*canonical/i.test(src) && false;
    // links de navegacao externa legitimos (redes sociais, wa.me, mailto) sao permitidos
    const isAnchor = /<a\b[^>]*href\s*=\s*["']https?:\/\//i.test(m[0]) || src.slice(Math.max(0, m.index - 200), m.index).includes('<a');
    if (!isAnchor) {
      fail('SPEC-008/AC-008.6', file, `recurso externo carregado (${host}) — apenas 'self' e permitido`);
    } else {
      const relAttr = /rel\s*=\s*["']([^"']*)["']/i.exec(src.slice(Math.max(0, m.index - 300), m.index + 200))?.[1] ?? '';
      if (!/\bnoopener\b/.test(relAttr)) {
        fail('SPEC-005/AC-005.5 · ASVS V8.3', file, `link externo sem rel="noopener noreferrer": ${url}`);
      }
    }
  }

  // 6. Mixed content
  for (const m of src.matchAll(/["'(](http:\/\/[^"')\s]+)/g)) {
    const url = m[1];
    if (!HTTP_ALLOWLIST.some((p) => url.startsWith(p))) {
      fail('SPEC-008/AC-008.9', file, `mixed content: ${url}`);
    }
  }

  // 7. data-testid em interativos
  for (const m of src.matchAll(/<(button|input|select|textarea)\b([^>]*)>/gi)) {
    if (!/data-testid\s*=/.test(m[2] ?? '')) {
      warn('§C12.6', file, `<${m[1].toLowerCase()}> sem data-testid → ${m[0].slice(0, 80)}`);
    }
  }

  // 8. CSP-meta
  const cspMatch = /<meta\s+http-equiv\s*=\s*["']Content-Security-Policy["']\s+content\s*=\s*["']([^"']+)["']/i.exec(src)
    ?? /<meta\s+content\s*=\s*["']([^"']+)["']\s+http-equiv\s*=\s*["']Content-Security-Policy["']/i.exec(src);
  if (!cspMatch) {
    fail('SPEC-008/AC-008.1', file, 'meta Content-Security-Policy ausente');
  } else {
    const got = cspMatch[1].replace(/\s+/g, ' ').replace(/;\s*$/g, '').trim();
    if (got !== CSP_CANON) {
      fail('SPEC-008/AC-008.1', file, `CSP diverge do canone de SPEC-008.\n      esperado: ${CSP_CANON}\n      obtido  : ${got}`);
    }
    for (const banned of ['frame-ancestors', 'report-uri', 'report-to', 'sandbox']) {
      if (new RegExp(`\\b${banned}\\b`).test(got)) {
        fail('SPEC-008/AC-008.2 · ADR-002', file, `diretiva "${banned}" e ignorada em meta-tag — remove-la e obrigatorio (documentacao enganosa)`);
      }
    }
    const scriptSrc = /script-src\s+([^;]*)/i.exec(got)?.[1] ?? '';
    if (/'unsafe-inline'/.test(scriptSrc)) fail('SPEC-008/AC-008.4 · §C9', file, "'unsafe-inline' em script-src e KILL SWITCH");
    if (/'unsafe-eval'/.test(scriptSrc) && !/'wasm-unsafe-eval'/.test(scriptSrc)) fail('SPEC-008/AC-008.4', file, "'unsafe-eval' em script-src e proibido");
    if (!/'wasm-unsafe-eval'/.test(scriptSrc)) warn('SPEC-007/AC-007.N1', file, "script-src sem 'wasm-unsafe-eval' quebrara o WASM do Pagefind");
  }

  // 8b. referrer meta (ADR-002 D2)
  if (!/<meta\s+name\s*=\s*["']referrer["']\s+content\s*=\s*["']strict-origin-when-cross-origin["']/i.test(src)) {
    fail('ADR-002 D2', file, '<meta name="referrer" content="strict-origin-when-cross-origin"> ausente');
  }

  // 9. Trackers (Kill Switch)
  for (const t of TRACKERS) {
    if (src.toLowerCase().includes(t.toLowerCase())) {
      fail('§C7 · §C9 KILL SWITCH', file, `tracker detectado: "${t}" — sem Bypass disponivel`);
    }
  }
}

// ── CSS: @import externo e trackers ────────────────────────────────
for (const f of cssFiles) {
  const src = readFileSync(f, 'utf8');
  const file = rel(f);
  for (const m of src.matchAll(/@import\s+(?:url\()?["']?(https?:\/\/[^"')\s]+)/gi)) {
    fail('SPEC-008/AC-008.6', file, `@import externo: ${m[1]} — ADR-001 determina system font stack`);
  }
  for (const t of TRACKERS) {
    if (src.toLowerCase().includes(t.toLowerCase())) fail('§C9 KILL SWITCH', file, `tracker em CSS: ${t}`);
  }
}

// ── JS: storage, trackers, secrets, fetch externo ──────────────────
const SECRET_PATTERNS = [
  [/ghp_[A-Za-z0-9]{36}/, 'GitHub PAT'],
  [/github_pat_[A-Za-z0-9_]{22,}/, 'GitHub fine-grained PAT'],
  [/AKIA[0-9A-Z]{16}/, 'AWS access key'],
  [/xox[baprs]-[A-Za-z0-9-]{10,}/, 'Slack token'],
  [/sk-[A-Za-z0-9]{20,}/, 'OpenAI-style secret key'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'chave privada'],
];

for (const f of jsFiles) {
  const src = readFileSync(f, 'utf8');
  const file = rel(f);
  if (/localStorage\.(setItem|removeItem|clear)|sessionStorage\.(setItem|removeItem|clear)|document\.cookie\s*=/.test(src)) {
    fail('§C7 · SPEC-009/AC-009.N2', file, 'escrita em storage/cookie detectada — zero rastreamento');
  }
  for (const t of TRACKERS) {
    if (src.toLowerCase().includes(t.toLowerCase())) fail('§C9 KILL SWITCH', file, `tracker em JS: ${t}`);
  }
  for (const [re, label] of SECRET_PATTERNS) {
    if (re.test(src)) fail('§C12.5 · static-analysis-enforcer', file, `possivel secret no bundle client-side: ${label}`);
  }
  for (const m of src.matchAll(/fetch\(\s*["'`](https?:\/\/[^"'`]+)/g)) {
    fail('SPEC-008/AC-008.6', file, `fetch() a host externo: ${m[1]} — connect-src 'self'`);
  }
}

// ── Artefatos obrigatorios ─────────────────────────────────────────
for (const required of ['index.html', '404.html', '.nojekyll', 'robots.txt']) {
  if (!files.some((f) => relative(DIST, f) === required)) {
    fail('BLUEPRINT §2 · RFC-001 FM-06', DIST, `artefato obrigatorio ausente: ${required}`);
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
  console.error('\nAudit falhou. Corrija ou solicite Bypass Protocol com os 3 pilares (§C4).');
  process.exit(1);
}
console.log(`\n✓ audit-bundle: 0 violacoes · ${htmlFiles.length} HTML · ${jsFiles.length} JS · ${cssFiles.length} CSS`);
process.exit(0);
