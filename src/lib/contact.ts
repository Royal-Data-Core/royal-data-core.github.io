/**
 * SPEC-005 / ADR-003 — contact channel resolution.
 *
 * D-03 (SDD-CONTEXT §9) is PENDING: `PUBLIC_CONTACT_EMAIL` / `PUBLIC_CONTACT_PHONE`
 * may be absent at build time. When absent, the SSOT prescribes the literal
 * placeholders `[[EMAIL]]` / `[[PHONE]]` (COPY-BRIEF / SDD-CONTEXT D-03 default).
 * Inventing a real address or number would violate CONSTITUTION §C9 and
 * SDD-CONTEXT §1's binding directive — so we never do.
 *
 * RRR-07 / ADR-003 D3: when a real email exists it is entity-encoded at BUILD
 * time (both `href` and visible text) so naive harvesting regexes over raw HTML
 * fail. This is obfuscation, not cryptography — no claim of "full protection"
 * is ever made to the user.
 */

import { withBase } from "./withBase";

const RAW_EMAIL = (import.meta.env.PUBLIC_CONTACT_EMAIL ?? "").trim();
const RAW_PHONE = (import.meta.env.PUBLIC_CONTACT_PHONE ?? "").trim();

/** D-03 pending-decision placeholders (exact SSOT strings). */
export const CONTACT_PLACEHOLDER_EMAIL = "[[EMAIL]]";
export const CONTACT_PLACEHOLDER_PHONE = "[[PHONE]]";

/** Real value or null. Never an invented value. */
export const CONTACT_EMAIL: string | null =
  RAW_EMAIL.length > 0 ? RAW_EMAIL : null;
export const CONTACT_PHONE: string | null =
  RAW_PHONE.length > 0 ? RAW_PHONE : null;

/** Display string: real value or the D-03 placeholder. */
export const CONTACT_EMAIL_DISPLAY = CONTACT_EMAIL ?? CONTACT_PLACEHOLDER_EMAIL;
export const CONTACT_PHONE_DISPLAY = CONTACT_PHONE ?? CONTACT_PLACEHOLDER_PHONE;

/** Build-time flag so templates can branch honestly instead of emitting broken hrefs. */
export const HAS_CONTACT_EMAIL = CONTACT_EMAIL !== null;
export const HAS_CONTACT_PHONE = CONTACT_PHONE !== null;

/** RFC 3966 `tel:` URI from a digits-only phone with country code, e.g. "5511999999999". */
export function buildTelHref(phone: string): string {
  return `tel:+${phone.replace(/[^0-9]/g, "")}`;
}

/** RFC 6068 `mailto:` URI with a pre-filled subject (ADR-003 D4 origin qualifier). */
export function buildMailtoHref(
  email: string,
  subject: string,
  body?: string,
): string {
  const params = new URLSearchParams({ subject });
  if (body) {
    params.set("body", body);
  }
  return `mailto:${email}?${params.toString()}`;
}

/**
 * Default pre-filled body: razão social + origin URL.
 * SPEC-005 AC-005.2 requires the body to contain razão social and the origin URL.
 */
export function defaultMailtoBody(originUrl: string): string {
  return `Enviado a partir do site oficial da Royal Data Core LTDA (${originUrl}).`;
}

/**
 * ADR-003 D1/D3 — official WhatsApp deep-link with pre-filled text.
 * `text` is mandatory and non-empty (SPEC-005 AC-005.4).
 */
export function buildWhatsAppHref(phone: string, text: string): string {
  return `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(text)}`;
}

/** Encodes every character (including supplementary planes) as decimal entities. */
export function encodeHtmlEntities(value: string): string {
  if (value.length === 0) {
    return value;
  }
  const segments: string[] = [];
  for (const char of value) {
    segments.push(`&#${char.codePointAt(0)};`);
  }
  return segments.join("");
}

/**
 * Entity-encoded `mailto:` href (ADR-003 D3): encode ONLY the address; keep
 * `mailto:`/`?`/`%XX` visible so the URI stays parseable for humans and the
 * browser. Regex `/[\w.+-]+@[\w-]+\./` then finds no match in raw HTML.
 */
export function buildMailtoHrefEncoded(
  email: string,
  subject: string,
  body?: string,
): {
  href: string;
  hrefEncoded: string;
  textEncoded: string;
  addressDecoded: string;
} {
  const href = buildMailtoHref(email, subject, body);
  const sendLength = "mailto:".length;
  return {
    href,
    hrefEncoded: `mailto:${encodeHtmlEntities(email)}${href.slice(sendLength + email.length)}`,
    textEncoded: encodeHtmlEntities(email),
    addressDecoded: email,
  };
}

/**
 * ADR-003 D4 — qualified subject table (verbatim from the SSOT).
 */
export const CONTACT_SUBJECTS = {
  hero: "Contato via site — Hero",
  servicesB2B: (service: string) => `Consultoria QA B2B — ${service}`,
  servicesClt: "Oportunidade CLT QA — via site",
  general: "Contato geral — Royal Data Core",
  post: (slug: string) => `Sobre o artigo: ${slug}`,
  brokenLink: (path: string) => `Link quebrado — ${path}`,
} as const;

/**
 * SPEC-001/AC-001.8 guard for the pending-contact hint anchor: when contact data
 * is pending we route the CTA to `/contato` where the pending state is shown,
 * instead of emitting a dead `href`.
 */
export function contactFallbackHref(): string {
  return withBase("/contato");
}
