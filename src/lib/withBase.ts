/**
 * ADR-004 — every internal URL is resolved through `withBase()`.
 *
 * SPEC-001 AC-001.9: internal `href`/`src` literals starting with "/" are
 * forbidden in Astro templates and TypeScript sources. Anchors (`#fragment`)
 * and absolute URLs (`mailto:`, `tel:`, `https://`) never receive the base prefix and are the
 * only sanctioned exceptions.
 *
 * `import.meta.env.BASE_URL` is inlined by Vite at build time, so this helper
 * adds zero runtime cost and works in both `.astro` templates and `.ts` modules.
 */

const RAW_BASE: string = import.meta.env.BASE_URL ?? '/';

/** Normalized base: always ends with "/" ("" would be invalid; "/" is the user-site case). */
const BASE: string =
  RAW_BASE.length > 1 && !RAW_BASE.endsWith('/') ? `${RAW_BASE}/` : RAW_BASE;

/** Detects absolute/protocol URLs: mailto:, tel:, https:, data:, javascript:. */
const ABSOLUTE_PATH_RE = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

export function withBase(path: string): string {
  if (path.startsWith('#') || path.startsWith('//') || ABSOLUTE_PATH_RE.test(path)) {
    return path;
  }
  const internal = path.startsWith('/') ? path : `/${path}`;
  if (BASE === '/') {
    return internal;
  }
  // Idempotent: never attach the base prefix twice.
  if (internal.startsWith(BASE)) {
    return internal;
  }
  return `${BASE}${internal.slice(1)}`;
}
