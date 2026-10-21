/**
 * SPEC-011 — i18n: locales, route map, counterparts and hreflang.
 *
 * Design constraints (CONSTITUTION §C1/§C2/§C7 + ADR-001 D2 + ADR-013):
 * - ZERO dependency: no i18n framework, no polyfill, no client-side switcher.
 * - The locale is a BUILD-TIME concern: the server renders the right markup
 *   for the requested locale; the switcher is a plain link (§C7 — no
 *   localStorage, no cookie, no identifier).
 * - One route tree per locale under the SAME origin (`/en/**`), because the
 *   deployment is a single GitHub Pages site (one pipeline, one artifact,
 *   zero recurring cost — §C2).
 * - `withBase()` stays the only authority for the deployment base (ADR-004);
 *   this module only deals with the LOCALE segment.
 */

import ROUTES_JSON from "./routes.json";

export type Locale = "pt-BR" | "en";

export const LOCALES: readonly Locale[] = ["pt-BR", "en"] as const;

/** Default locale = the root of the site (x-default target). */
export const DEFAULT_LOCALE: Locale = "pt-BR";

/** URL segment that identifies the non-default locale. */
export const LOCALE_SEGMENTS: Record<Locale, string> = {
  "pt-BR": "",
  en: "en",
};

/**
 * Canonical route keys. Every PT route has exactly one EN counterpart —
 * the EN slug is an English translation of the PT slug (SEO surface for a
 * global audience), never a machine transliteration of the path.
 *
 * SSOT: `src/lib/routes.json` — shared with `astro.config.mjs` (the sitemap
 * needs the same map to emit `alternates.languages`). One file, two consumers,
 * zero drift; the artifact gate `scripts/verify-hreflang.mjs` proves the pair.
 */
export const ROUTES = ROUTES_JSON as {
  home: { "pt-BR": string; en: string };
  services: { "pt-BR": string; en: string };
  blog: { "pt-BR": string; en: string };
  contact: { "pt-BR": string; en: string };
  privacy: { "pt-BR": string; en: string };
  search: { "pt-BR": string; en: string };
  notFound: { "pt-BR": string; en: string };
};

export type RouteKey = keyof typeof ROUTES;

/** Deployment base, normalized (same rule as withBase.ts — ADR-008 D7). */
const RAW_BASE: string = import.meta.env.BASE_URL ?? "/";
const BASE: string =
  RAW_BASE.length > 1 && !RAW_BASE.endsWith("/") ? `${RAW_BASE}/` : RAW_BASE;

/** Removes the deployment base from a pathname (never touches the locale). */
export function stripBase(pathname: string): string {
  if (BASE === "/") return pathname;
  if (pathname.startsWith(BASE)) return `/${pathname.slice(BASE.length)}`;
  return pathname;
}

/** True when the value is one of the supported locales. */
export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** Locale of a pathname: `/en/**` → "en"; everything else → "pt-BR". */
export function localeOfPath(pathname: string): Locale {
  const path = stripBase(pathname);
  return path === "/en" || path.startsWith("/en/") ? "en" : "pt-BR";
}

/** Route key of a static path (null for dynamic paths such as posts/tags). */
export function routeKeyOfPath(pathname: string): RouteKey | null {
  const path = stripBase(pathname).replace(/\/+$/, "") || "/";
  const candidates: Array<[RouteKey, string]> = (
    Object.keys(ROUTES) as RouteKey[]
  ).map((key) => [key, ROUTES[key]["pt-BR"].replace(/\/+$/, "") || "/"]);
  for (const [key, ptPath] of candidates) {
    if (path === ptPath) return key;
  }
  // EN paths map back through the same table (the EN slug is a translation).
  for (const key of Object.keys(ROUTES) as RouteKey[]) {
    const enPath = ROUTES[key].en.replace(/\/+$/, "") || "/";
    if (path === enPath) return key;
  }
  return null;
}

/** Path of a route key in the given locale (without the deployment base). */
export function routePath(key: RouteKey, locale: Locale): string {
  return ROUTES[key][locale];
}

/**
 * Slug of a blog post in a given locale — posts live in `src/content/blog`
 * (PT) and `src/content/blog/en` (EN); the EN id carries the `en/` prefix.
 */
export function postSlug(postId: string, locale: Locale): string {
  const stripped = postId.replace(/^en\//, "");
  return locale === "en" ? stripped : postId;
}

/**
 * Counterpart path of the current page in the target locale.
 * - static routes map through ROUTES;
 * - blog posts map by slug (the EN collection mirrors the PT slugs when the
 *   translated article exists, otherwise the caller falls back to the index);
 * - anything unknown falls back to the target locale home.
 */
export function counterpartPath(pathname: string, target: Locale): string {
  const path = stripBase(pathname);
  const key = routeKeyOfPath(path);
  if (key) return ROUTES[key][target];
  const postMatch = /^\/blog\/([^/]+)\/?$/.exec(path);
  if (postMatch?.[1]) {
    return target === "en"
      ? `/en/blog/${postMatch[1]}`
      : `/blog/${postMatch[1]}`;
  }
  const enPostMatch = /^\/en\/blog\/([^/]+)\/?$/.exec(path);
  if (enPostMatch?.[1]) {
    return target === "en"
      ? `/en/blog/${enPostMatch[1]}`
      : `/blog/${enPostMatch[1]}`;
  }
  return ROUTES.home[target];
}

/** Label of the switcher entry for a locale (shown in the target language). */
export const LOCALE_LABELS: Record<Locale, string> = {
  "pt-BR": "Português (Brasil)",
  en: "English",
};

/** `hreflang` value for a locale. */
export const HREFLANG: Record<Locale, string> = {
  "pt-BR": "pt-BR",
  en: "en",
};

/** Short label used in the compact switcher. */
export const LOCALE_SHORT: Record<Locale, string> = {
  "pt-BR": "PT-BR",
  en: "EN",
};

/** Shared UI chrome strings (header, footer, switcher). */
export interface UiStrings {
  nav: Record<"home" | "services" | "blog" | "contact" | "search", string>;
  footer: {
    contact: string;
    services: string;
    blog: string;
    contactLink: string;
    search: string;
    privacy: string;
    legalSuffix: string;
    language: string;
  };
  switcher: {
    label: string;
    current: string;
  };
  /** Sticky mobile conversion CTA (SPEC-010 §9). */
  cta: {
    mobileSpecialist: string;
  };
  skipLink: string;
  brandHome: string;
}

export const UI_STRINGS: Record<Locale, UiStrings> = {
  "pt-BR": {
    nav: {
      home: "Início",
      services: "Serviços",
      blog: "Blog",
      contact: "Contato",
      search: "Buscar",
    },
    footer: {
      contact: "Contato",
      services: "Serviços",
      blog: "Blog",
      contactLink: "Contato",
      search: "Buscar",
      privacy: "Privacidade",
      legalSuffix: "Conteúdo e código deste site são auditáveis publicamente.",
      language: "Idioma",
    },
    switcher: { label: "Alternar idioma", current: "Idioma atual" },
    cta: { mobileSpecialist: "Falar com especialista" },
    skipLink: "Pular para o conteúdo principal",
    brandHome: "Royal Data Core — início",
  },
  en: {
    nav: {
      home: "Home",
      services: "Services",
      blog: "Blog",
      contact: "Contact",
      search: "Search",
    },
    footer: {
      contact: "Contact",
      services: "Services",
      blog: "Blog",
      contactLink: "Contact",
      search: "Search",
      privacy: "Privacy",
      legalSuffix:
        "The content and code behind this site are publicly auditable.",
      language: "Language",
    },
    switcher: { label: "Switch language", current: "Current language" },
    cta: { mobileSpecialist: "Talk to a specialist" },
    skipLink: "Skip to the main content",
    brandHome: "Royal Data Core — home",
  },
};
