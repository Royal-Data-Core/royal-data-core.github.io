/**
 * SPEC-001 AC-001.5 / AC-001.6 — typed schema.org JSON-LD builders.
 *
 * Entity data is VERIFIED data; nothing unverifiable is
 * emitted (AC-001.5 hard rule + CONSTITUTION §C9):
 * - `numberOfEmployees`, `aggregateRating`, `review`, `award`, `alumniOf` — forbidden;
 * - `sameAs` — live since D-03/D-04 (2026-10-20): Instagram brand + LinkedIn
 *   founder profile + the already-public GitHub profile (verified URLs only);
 * - `telephone`/`email` — live since D-03 (2026-10-20): emitted ONLY when the
 *   verified values are present at build time (same honest branching as the UI);
 * - `serviceArea` GeoCircle — omitted until D-02 verifies Matão coordinates.
 *   Omission is safer than emitting data the source itself flags as "verificar".
 *
 * `address.streetAddress` deliberately absent — full circle: public site does not
 * publish a private address (COPY-BRIEF §12 note).
 */

import { withBase } from "./withBase";
import {
  CONTACT_EMAIL,
  CONTACT_PHONE,
  CONTACT_SOCIALS,
  buildPhoneDisplay,
} from "./contact";
import { type Locale } from "./i18n";

/** Verified legal identity (SDD-CONTEXT §1 — factual source of truth). */
export const ORGANIZATION = {
  legalName: "ROYAL DATA CORE LTDA",
  name: "Royal Data Core",
  taxID: "69527139000194",
  foundingDate: "2026-10-06",
  addressLocality: "Matão",
  addressRegion: "SP",
  addressCountry: "BR",
  description:
    "Consultoria especializada em testes de software: estratégia de QA, automação de testes e pipelines de qualidade.",
  knowsAbout: [
    "Software Testing",
    "Test Automation",
    "Quality Assurance",
    "Playwright",
    "CI/CD",
    "Test Strategy",
    "Shift-Left Testing",
    "Core Web Vitals",
  ],
} as const;

/**
 * SPEC-012 AC-012.3 — locale-specific organization description. The legal
 * identity (name/legalName/taxID) stays single-sourced; only the prose is
 * translated.
 */
export const ORGANIZATION_DESCRIPTION = {
  en: "Software testing consultancy: QA strategy, test automation and quality pipelines, delivered remotely from Brazil.",
} as const;

type JsonLdValue =
  string | number | boolean | null | JsonLdNode | Array<JsonLdValue>;

export interface JsonLdNode {
  readonly [key: string]: JsonLdValue;
}

export const SPEC_JSONLD_ERROR =
  "SPEC-001: JSON-LD inválido — serialização produziu 'undefined'";

/**
 * AC-001.N4 — `JSON.stringify` silently drops `undefined` object values and
 * silently maps `undefined` array items to `null`, so both are detected here,
 * before serialization. Any structural violation fails the build (exit != 0).
 */
export function assertNoUndefined(value: JsonLdValue): void {
  walk(value, "$");
  function walk(node: unknown, path: string): void {
    if (node === undefined) {
      throw new Error(`${SPEC_JSONLD_ERROR} (path: ${path})`);
    }
    if (Array.isArray(node)) {
      node.forEach((item, index) => walk(item, `${path}[${index}]`));
      return;
    }
    if (node !== null && typeof node === "object") {
      for (const key of Object.keys(node)) {
        walk((node as Record<string, unknown>)[key], `${path}.${key}`);
      }
    }
  }
}

/**
 * Serializes JSON-LD for `<script type="application/ld+json">`.
 * AC-001.N4: any `undefined`/trailing-comma output → throw, never emit.
 */
export function serializeJsonLd(value: JsonLdValue): string {
  assertNoUndefined(value);
  const serialized = JSON.stringify(value, null, 2);
  if (typeof serialized !== "string") {
    throw new Error(SPEC_JSONLD_ERROR);
  }
  if (/,\s*[}\]]/.test(serialized)) {
    // Trailing comma would make the JSON-LD block unparseable by scrapers/consumers.
    throw new Error(`${SPEC_JSONLD_ERROR} (trailing comma antes de } ou ])`);
  }
  try {
    JSON.parse(serialized);
  } catch (cause) {
    throw Object.assign(
      new Error(`${SPEC_JSONLD_ERROR} (${(cause as Error).message})`),
      { cause },
    );
  }
  return serialized;
}

function siteOrigin(siteUrl?: URL): string {
  const raw =
    siteUrl ??
    (import.meta.env.SITE ? new URL(import.meta.env.SITE) : undefined);
  if (!raw) {
    throw new Error(
      "SPEC-001: 'site' é obrigatório e deve ser URL absoluta https://",
    );
  }
  if (raw.protocol !== "https:") {
    throw new Error(
      "SPEC-001: 'site' é obrigatório e deve ser URL absoluta https://",
    );
  }
  return raw.origin;
}

/**
 * AC-001.5 — Organization/ProfessionalService block. Typed per COPY-BRIEF §12.
 * Inner fields reference the SAME verified identity as the footer (SPEC-009).
 *
 * SPEC-012 AC-012.3 — locale-aware, entity-stable: the `@id` is IDENTICAL in
 * every locale (one organization, one entity for search engines); only the
 * locale-dependent fields change (`areaServed`, `priceRange`, `paymentAccepted`,
 * `image`, `description`). `currenciesAccepted` stays "BRL" in every locale —
 * it is a fact about the contracting entity, not a promise about the quote.
 */
export function buildOrganizationJsonLd(
  siteUrl?: URL,
  locale: Locale = "pt-BR",
): JsonLdNode {
  const origin = siteOrigin(siteUrl);
  const home = `${origin}${withBase("/")}`;
  const isEn = locale === "en";
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${origin}${withBase("/")}#organization`,
    name: ORGANIZATION.name,
    legalName: ORGANIZATION.legalName,
    taxID: ORGANIZATION.taxID,
    foundingDate: ORGANIZATION.foundingDate,
    description: isEn ? ORGANIZATION_DESCRIPTION.en : ORGANIZATION.description,
    url: home,
    image: `${origin}${withBase(isEn ? "/og-en.png" : "/og-default.png")}`,
    priceRange: isEn ? "on request" : "sob consulta",
    currenciesAccepted: "BRL",
    // COPY-BRIEF §12 canonical values; declared business channels, no numeric price claim.
    paymentAccepted: isEn ? "Bank transfer, PIX" : "Transferência, Boleto, PIX",
    address: {
      "@type": "PostalAddress",
      addressLocality: ORGANIZATION.addressLocality,
      addressRegion: ORGANIZATION.addressRegion,
      addressCountry: ORGANIZATION.addressCountry,
    },
    // PT: the Brazilian market. EN: remote delivery from Brazil (SPEC-011 §3).
    areaServed: isEn
      ? { "@type": "Place", name: "Worldwide" }
      : { "@type": "Country", name: "Brasil" },
    availableLanguage: ["pt-BR", "en"],
    knowsAbout: [...ORGANIZATION.knowsAbout],
    // SameAs is NOT an unverifiable vanity claim anymore: every URL below is
    // verified and already published on the official /contato page.
    sameAs: [...Object.values(CONTACT_SOCIALS)],
    // D-03 (2026-10-20) — honest branching: fields appear only with verified
    // values at build time (Google LocalBusiness style: `email` plain, E.164
    // display via buildPhoneDisplay).
    ...(CONTACT_EMAIL ? { email: CONTACT_EMAIL } : {}),
    ...(CONTACT_PHONE ? { telephone: buildPhoneDisplay(CONTACT_PHONE) } : {}),
  };
}

/**
 * AC-001.6 — WebSite block; SearchAction target must synthesize with SPEC-007
 * `/busca?q={search_term_string}`. `{search_term_string}` MUST NOT be URL-encoded.
 *
 * SPEC-012 AC-012.3 — locale-aware: `inLanguage` follows the rendered locale
 * and the SearchAction points at THAT locale's search route.
 */
export function buildWebSiteJsonLd(
  siteUrl: URL,
  locale: Locale = "pt-BR",
): JsonLdNode {
  const origin = siteOrigin(siteUrl);
  const isEn = locale === "en";
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: ORGANIZATION.name,
    url: `${origin}${withBase("/")}`,
    inLanguage: locale,
    availableLanguage: ["pt-BR", "en"],
    potentialAction: {
      "@type": "SearchAction",
      target: `${origin}${withBase(isEn ? "/en/search" : "/busca")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}
