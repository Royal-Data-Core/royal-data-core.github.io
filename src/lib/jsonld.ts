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
 */
export function buildOrganizationJsonLd(siteUrl?: URL): JsonLdNode {
  const origin = siteOrigin(siteUrl);
  const home = `${origin}${withBase("/")}`;
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${origin}${withBase("/")}#organization`,
    name: ORGANIZATION.name,
    legalName: ORGANIZATION.legalName,
    taxID: ORGANIZATION.taxID,
    foundingDate: ORGANIZATION.foundingDate,
    description: ORGANIZATION.description,
    url: home,
    image: `${origin}${withBase("/og-default.png")}`,
    priceRange: "sob consulta",
    currenciesAccepted: "BRL",
    // COPY-BRIEF §12 canonical values; declared business channels, no numeric price claim.
    paymentAccepted: "Transferência, Boleto, PIX",
    address: {
      "@type": "PostalAddress",
      addressLocality: ORGANIZATION.addressLocality,
      addressRegion: ORGANIZATION.addressRegion,
      addressCountry: ORGANIZATION.addressCountry,
    },
    areaServed: { "@type": "Country", name: "Brasil" },
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
 */
export function buildWebSiteJsonLd(siteUrl: URL): JsonLdNode {
  const origin = siteOrigin(siteUrl);
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: ORGANIZATION.name,
    url: `${origin}${withBase("/")}`,
    inLanguage: "pt-BR",
    potentialAction: {
      "@type": "SearchAction",
      target: `${origin}${withBase("/busca")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}
