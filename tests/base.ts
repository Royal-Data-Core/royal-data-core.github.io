/**
 * Deployment context (ADR-008 D7 / RFC-001 §2.6(4)).
 *
 * SITE_BASE — sub-path the artifact is built against (production currently
 * `/site-io`; `""` for root-hosted builds). SITE_URL — canonical origin.
 * Both are env-injected per pipeline job; `playwright.config.ts` forwards
 * SITE_BASE to `astro preview` so served routes match the artifact base.
 * Defaults preserve the root-hosted values used by local/CI-matrix builds.
 */
export const SITE_BASE = (process.env.SITE_BASE ?? "").replace(/\/+$/, "");
/* SITE_URL — canonical origin (real Pages origin; see .env.example). */
export const SITE_URL =
  process.env.SITE_URL ?? "https://royal-data-core.github.io";

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Resolve a site-internal path against the deployment base. */
export function R(path: string): string {
  return `${SITE_BASE}${path}`;
}

/** POST_HREF_RE — `/<base>/blog/<slug>` (exactly one slug segment). */
export const POST_HREF_RE = new RegExp(
  `^${escapeRegExp(SITE_BASE)}/blog/[^/]+$`,
);

/** ASTRO_ASSET_RE — `/<base>/_astro/…` (same-origin island scripts). */
export const ASTRO_ASSET_RE = new RegExp(`^${escapeRegExp(SITE_BASE)}/_astro/`);
