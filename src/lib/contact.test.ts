/**
 * src/lib/contact.test.ts — ADR-003 D1/D3/D4 + SPEC-005 contact contracts.
 *
 * Default-environment suite imports statically (env vars absent → the honest
 * D-03 pending placeholders). The env-present path re-imports via
 * vi.resetModules + vi.stubEnv because constants are captured at module scope.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildMailtoHref,
  buildMailtoHrefEncoded,
  buildPhoneDisplay,
  buildTelHref,
  buildWhatsAppHref,
  CONTACT_EMAIL,
  CONTACT_EMAIL_DISPLAY,
  CONTACT_PHONE,
  CONTACT_PHONE_DISPLAY,
  CONTACT_PLACEHOLDER_EMAIL,
  CONTACT_PLACEHOLDER_PHONE,
  CONTACT_SOCIALS,
  CONTACT_SUBJECTS,
  CONTACT_SUBJECTS_EN,
  contactFallbackHref,
  defaultMailtoBody,
  encodeHtmlEntities,
  HAS_CONTACT_EMAIL,
  HAS_CONTACT_PHONE,
} from "./contact";

describe("D-03 pending state — never invents data (CONSTITUTION §C9)", () => {
  it("resolves to null + placeholder display without env", () => {
    expect(CONTACT_EMAIL).toBeNull();
    expect(CONTACT_PHONE).toBeNull();
    expect(CONTACT_EMAIL_DISPLAY).toBe("[[EMAIL]]");
    expect(CONTACT_PHONE_DISPLAY).toBe("[[PHONE]]");
    expect(CONTACT_PLACEHOLDER_EMAIL).toBe("[[EMAIL]]");
    expect(CONTACT_PLACEHOLDER_PHONE).toBe("[[PHONE]]");
    expect(HAS_CONTACT_EMAIL).toBe(false);
    expect(HAS_CONTACT_PHONE).toBe(false);
  });
});

describe("buildTelHref (RFC 3966)", () => {
  it("strips every non-digit but keeps the leading plus", () => {
    expect(buildTelHref("55 (11) 99999-9999")).toBe("tel:+5511999999999");
  });
});

describe("buildWhatsAppHref (ADR-003 D1)", () => {
  it("digits-only deep link with an encoded pre-filled text", () => {
    expect(buildWhatsAppHref("55 11 99999-9999", "Olá & bem-vindo")).toBe(
      "https://wa.me/5511999999999?text=Ol%C3%A1%20%26%20bem-vindo",
    );
  });
});

describe("buildMailtoHref (RFC 6068)", () => {
  it("encodes the subject via URLSearchParams", () => {
    expect(buildMailtoHref("contato@example.com", "Assunto com espaço")).toBe(
      "mailto:contato@example.com?subject=Assunto+com+espa%C3%A7o",
    );
  });

  it("appends body only when provided", () => {
    const withBody = buildMailtoHref("a@b.com", "S", "Corpo");
    expect(withBody).toContain("body=Corpo");
    expect(withBody.indexOf("subject=")).toBeLessThan(
      withBody.indexOf("body="),
    );
  });

  it("keeps the bracket-prefixed constant byte-locked (ADR-003 D4 rev. 2026-10-21)", () => {
    expect(
      buildMailtoHref("a@b.com", "[CONTATO GERAL] - Royal Data Core"),
    ).toBe("mailto:a@b.com?subject=%5BCONTATO+GERAL%5D+-+Royal+Data+Core");
  });
});

describe("defaultMailtoBody (SPEC-005 AC-005.2)", () => {
  it("carries razão social and the origin URL", () => {
    const body = defaultMailtoBody("https://royaldatacore.github.io");
    expect(body).toContain("Royal Data Core LTDA");
    expect(body).toContain("https://royaldatacore.github.io");
  });
});

describe("encodeHtmlEntities (ADR-003 D3)", () => {
  it("returns empty string untouched", () => {
    expect(encodeHtmlEntities("")).toBe("");
  });

  it("encodes ASCII decimal entities", () => {
    expect(encodeHtmlEntities("a@b")).toBe("&#97;&#64;&#98;");
  });

  it("encodes supplementary-plane code points as full entities", () => {
    expect(encodeHtmlEntities("😀")).toBe("&#128512;");
  });
});

describe("buildMailtoHrefEncoded — harvesting obfuscation", () => {
  const email = "contato@royaldatacore.com.br";
  const encoded = buildMailtoHrefEncoded(email, "Assunto & tópico");

  it("keeps the plain href parseable", () => {
    expect(encoded.href).toBe(
      `mailto:${email}?subject=Assunto+%26+t%C3%B3pico`,
    );
    expect(encoded.href).toMatch(/[\w.+-]+@[\w-]+\./);
  });

  it("percent-encodes ONLY the @ in the href — harvest-proof AND click-functional", () => {
    expect(encoded.hrefEncoded.startsWith("mailto:contato%40")).toBe(true);
    expect(encoded.hrefEncoded).toContain("royaldatacore.com.br?");
    expect(encoded.hrefEncoded).not.toMatch(/[\w.+-]+@[\w-]+\./);
    expect(encoded.textEncoded).toBe(encodeHtmlEntities(email));
    expect(encoded.addressDecoded).toBe(email);
  });

  it("spans the full encoded domain through the TLD dot", () => {
    expect(encoded.textEncoded).toBe(
      `&#99;&#111;&#110;&#116;&#97;&#116;&#111;&#64;&#114;&#111;&#121;&#97;&#108;&#100;&#97;&#116;&#97;&#99;&#111;&#114;&#101;&#46;&#99;&#111;&#109;&#46;&#98;&#114;`,
    );
  });
});

describe("CONTACT_SUBJECTS (ADR-003 D4 qualifier table)", () => {
  it("keeps the bracket-prefixed B2B constant", () => {
    expect(CONTACT_SUBJECTS.servicesB2B).toBe(
      "[CONSULTORIA QA B2B] - Royal Data Core",
    );
  });

  it("builds post and broken-link diagnostics subjects", () => {
    expect(CONTACT_SUBJECTS.post("flaky-tests-root-cause")).toBe(
      "Sobre o artigo: flaky-tests-root-cause",
    );
    expect(CONTACT_SUBJECTS.brokenLink("/blog/")).toBe(
      "Link quebrado — /blog/",
    );
  });

  it("keeps the verbatim constants", () => {
    expect(CONTACT_SUBJECTS.hero).toBe("[CONTATO VIA SITE] - Royal Data Core");
    expect(CONTACT_SUBJECTS.servicesClt).toBe(
      "[OPORTUNIDADE CLT QA] - Royal Data Core",
    );
    expect(CONTACT_SUBJECTS.general).toBe("[CONTATO GERAL] - Royal Data Core");
  });
});

describe("contactFallbackHref (SPEC-001 AC-001.8)", () => {
  it("routes pending-contact CTAs to /contato", () => {
    expect(contactFallbackHref()).toBe("/contato");
  });
});

describe("env-present path — real values flow through honestly", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("uses the real email when PUBLIC_CONTACT_EMAIL is set", async () => {
    vi.resetModules();
    vi.stubEnv("PUBLIC_CONTACT_EMAIL", "contato@royaldatacore.com.br");
    const mod = await import("./contact");
    expect(mod.CONTACT_EMAIL).toBe("contato@royaldatacore.com.br");
    expect(mod.HAS_CONTACT_EMAIL).toBe(true);
    expect(mod.CONTACT_EMAIL_DISPLAY).toBe("contato@royaldatacore.com.br");
  });

  it("formats the verified BR mobile shape for display (D-03)", async () => {
    vi.resetModules();
    vi.stubEnv("PUBLIC_CONTACT_PHONE", "5516997148778");
    const mod = await import("./contact");
    expect(mod.CONTACT_PHONE).toBe("5516997148778");
    expect(mod.HAS_CONTACT_PHONE).toBe(true);
    expect(mod.CONTACT_PHONE_DISPLAY).toBe("+55 (16) 99714-8778");
  });

  it("exposes the verified social channels (D-04)", () => {
    expect(CONTACT_SOCIALS.instagram).toBe(
      "https://www.instagram.com/royaldatacore",
    );
    expect(CONTACT_SOCIALS.linkedin).toBe(
      "https://www.linkedin.com/in/leonardo-setti",
    );
    expect(CONTACT_SOCIALS.github).toBe("https://github.com/royaldatacore");
  });

  it("trims and still rejects blank env strings as pending", async () => {
    vi.resetModules();
    vi.stubEnv("PUBLIC_CONTACT_PHONE", "   ");
    const mod = await import("./contact");
    expect(mod.CONTACT_PHONE).toBeNull();
    expect(mod.CONTACT_PHONE_DISPLAY).toBe(CONTACT_PLACEHOLDER_PHONE);
  });
});

describe("buildPhoneDisplay (D-03 display formatting)", () => {
  it("formats the verified 12-digit BR mobile", () => {
    expect(buildPhoneDisplay("5516997148778")).toBe("+55 (16) 99714-8778");
  });

  it("strips user-provided separators before formatting", () => {
    expect(buildPhoneDisplay("+55 16 99714-8778")).toBe("+55 (16) 99714-8778");
  });

  it("returns unknown shapes raw — never invents a grouping", () => {
    expect(buildPhoneDisplay("551199999999")).toBe("551199999999");
    expect(buildPhoneDisplay("")).toBe("");
  });
});

describe("SPEC-012/AC-012.6 — subjects de contato EN", () => {
  it("a tabela EN não oferece modelos de emprego brasileiros", () => {
    expect(CONTACT_SUBJECTS_EN.general).toContain("General enquiry");
    expect(CONTACT_SUBJECTS_EN.servicesB2B("Quality diagnosis")).toContain(
      "QA consulting enquiry — Quality diagnosis",
    );
    const serialized = JSON.stringify(CONTACT_SUBJECTS_EN);
    expect(serialized).not.toContain("CLT");
    expect(serialized).not.toContain("aloca");
  });
});
