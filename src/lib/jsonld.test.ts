/**
 * src/lib/jsonld.test.ts — SPEC-001 AC-001.5/AC-001.6/AC-001.N4 contracts.
 */

import { describe, expect, it } from "vitest";
import {
  assertNoUndefined,
  buildOrganizationJsonLd,
  buildWebSiteJsonLd,
  ORGANIZATION,
  serializeJsonLd,
  SPEC_JSONLD_ERROR,
  type JsonLdNode,
} from "./jsonld";

const SITE = new URL("https://royaldatacore.github.io");
const ORIGIN = SITE.origin;

describe("verified identity constants (SDD-CONTEXT §1)", () => {
  it("carries the CNPJ, founding date and locality verbatim", () => {
    expect(ORGANIZATION.legalName).toBe("ROYAL DATA CORE LTDA");
    expect(ORGANIZATION.taxID).toBe("69527139000194");
    expect(ORGANIZATION.foundingDate).toBe("2026-10-06");
    expect(ORGANIZATION.addressLocality).toBe("Matão");
    expect(ORGANIZATION.addressRegion).toBe("SP");
    expect(ORGANIZATION.addressCountry).toBe("BR");
  });
});

describe("buildOrganizationJsonLd (AC-001.5)", () => {
  const node = buildOrganizationJsonLd(SITE);

  it("is a ProfessionalService anchored at the site origin", () => {
    expect(node["@type"]).toBe("ProfessionalService");
    expect(node["@id"]).toBe(`${ORIGIN}/#organization`);
    expect(node.url).toBe(`${ORIGIN}/`);
    expect(node.image).toBe(`${ORIGIN}/og-default.png`);
  });

  it("emits zero unverifiable claims (CONSTITUTION §C9)", () => {
    for (const forbidden of [
      "numberOfEmployees",
      "aggregateRating",
      "review",
      "reviews",
      "award",
      "alumniOf",
      "serviceArea",
    ] as const) {
      expect(node).not.toHaveProperty(forbidden);
    }
  });

  it("sameAs carries exactly the verified social channels (D-04)", () => {
    expect(node.sameAs).toEqual([
      "https://github.com/royaldatacore",
      "https://www.instagram.com/royaldatacore",
      "https://www.linkedin.com/in/leonardo-setti",
    ]);
  });

  it("omits telephone/email in pending mode — no invented contact data", () => {
    expect(node.telephone).toBeUndefined();
    expect(node.email).toBeUndefined();
  });

  it("publishes only the verified address triad (no streetAddress)", () => {
    const address = node.address as JsonLdNode;
    const keys = Object.keys(address).filter((k) => k !== "@type");
    expect(keys.sort()).toEqual([
      "addressCountry",
      "addressLocality",
      "addressRegion",
    ]);
  });

  it("knowsAbout is a defensive copy, not the frozen array", () => {
    expect(Array.isArray(node.knowsAbout)).toBe(true);
    expect(node.knowsAbout).toContain("Playwright");
    expect(JSON.parse(JSON.stringify(node.knowsAbout))).toEqual(
      ORGANIZATION.knowsAbout,
    );
  });
});

describe("buildWebSiteJsonLd (AC-001.6)", () => {
  const node = buildWebSiteJsonLd(SITE);
  const action = node.potentialAction as JsonLdNode;
  const target = String(action.target);

  it("synthesizes the /busca SearchAction with a literal query token", () => {
    expect(action["@type"]).toBe("SearchAction");
    expect(target).toBe(`${ORIGIN}/busca?q={search_term_string}`);
    expect(action["query-input"]).toBe("required name=search_term_string");
  });

  it("does not URL-encode the query placeholder", () => {
    expect(target).toContain("{search_term_string}");
    expect(target).not.toContain("%7B");
    expect(target).not.toContain("%7D");
  });

  it("declares the site language and name", () => {
    expect(node.inLanguage).toBe("pt-BR");
    expect(node.name).toBe(ORGANIZATION.name);
    expect(node.url).toBe(`${ORIGIN}/`);
  });
});

describe("assertNoUndefined (AC-001.N4)", () => {
  it("throws with the exact property path", () => {
    const value = { a: 1, b: { c: undefined, d: 2 } } as unknown as JsonLdNode;
    expect(() => assertNoUndefined(value)).toThrow(
      new RegExp(`${SPEC_JSONLD_ERROR} \\(path: \\\$\\.b\\.c\\)`),
    );
  });

  it("reports array indices in the path", () => {
    const value = [1, undefined] as unknown as JsonLdNode;
    expect(() => assertNoUndefined(value)).toThrow(
      new RegExp("\\(path: \\\$\\[1\\]\\)"),
    );
  });

  it("walks deep nested arrays without false positives", () => {
    const value = { tags: [[1, 2], "x"] } as unknown as JsonLdNode;
    expect(() => assertNoUndefined(value)).not.toThrow();
  });
});

describe("serializeJsonLd (AC-001.N4)", () => {
  it("round-trips valid nodes losslessly", () => {
    const node = { "@type": "WebSite", n: 1, ok: true, nil: null };
    expect(JSON.parse(serializeJsonLd(node))).toEqual(node);
  });

  it("rejects undefined input before serialization can rewrite it as null", () => {
    const value = { dropped: undefined } as unknown as JsonLdNode;
    expect(() => serializeJsonLd(value)).toThrow(/dropped/);
  });

  it("emits pretty-printed output (2-space indentation)", () => {
    expect(serializeJsonLd({ a: 1 })).toBe('{\n  "a": 1\n}');
  });
});

describe("site URL guard", () => {
  it("rejects non-https origins (SPEC-001 hard rule)", () => {
    expect(() =>
      buildOrganizationJsonLd(new URL("http://insecure.test")),
    ).toThrow(/obrigatório/);
  });
});
