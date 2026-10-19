/**
 * Deterministic PT-BR date formatting (BLUEPRINT `src/lib/date.ts`).
 *
 * All dates come from frontmatter as UTC midnight (`YYYY-MM-DD`), so formatting
 * is pinned to `timeZone: 'UTC'` to avoid host-TZ drift during CI builds.
 */

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** "DD de mês de AAAA" — e.g. "13 de outubro de 2026" (SPEC-002 AC-002.4). */
export function formatPublishDate(date: Date): string {
  return DATE_FORMATTER.format(date);
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
