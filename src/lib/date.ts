/**
 * Deterministic date formatting (BLUEPRINT `src/lib/date.ts`).
 *
 * All dates come from frontmatter as UTC midnight (`YYYY-MM-DD`), so formatting
 * is pinned to `timeZone: 'UTC'` to avoid host-TZ drift during CI builds.
 * SPEC-012 AC-012.6 — the locale follows the rendered page ("en" posts are
 * dated in English, "pt-BR" posts keep the Portuguese format).
 */

const DATE_FORMATTERS = {
  "pt-BR": new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }),
  en: new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }),
} as const;

/** "DD de mês de AAAA" (pt-BR) / "Month D, YYYY" (en). */
export function formatPublishDate(
  date: Date,
  locale: "pt-BR" | "en" = "pt-BR",
): string {
  return DATE_FORMATTERS[locale].format(date);
}

/** `YYYY-MM-DD` for `<time datetime>` attributes. */
export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * AC-004.2/AC-004.3 — reading time: raw MDX body word count / 220, minimum 1.
 * Rendered by the card as `${n} min de leitura`.
 */
export function readingMinutes(body: string | undefined): number {
  const words = (body ?? "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}
