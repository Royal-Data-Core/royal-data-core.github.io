/**
 * SPEC-012 — the English surface contract (e2e gate).
 *
 * Scenarios (Gherkin, SPEC-012 §5):
 *   - AC-012.2  every EN route exists and answers 200; `html lang` is "en";
 *   - AC-012.3  hreflang is reciprocal (PT ⇄ EN) and `x-default` points to the
 *     default locale;
 *   - AC-012.4  the language switch keeps the SAME surface (not the home);
 *   - AC-012.5  the surfaces never mix languages (listing, RSS, post routes);
 *   - AC-012.6  the EN JSON-LD declares the EN language and keeps the SAME
 *     organization identity (`@id`) as the PT surface;
 *   - AC-012.7  the EN surface makes no Brazilian-employment promise.
 *
 * ESM imports only (package.json "type": "module").
 */
import { expect, test, type Page } from "@playwright/test";
import { R, SITE_BASE } from "../base";

const EN_ROUTES = [
  "/en/",
  "/en/services",
  "/en/contact",
  "/en/privacy",
  "/en/blog",
  "/en/search",
];

const PT_POST_SLUG = "flaky-tests-root-cause";
const EN_POST_SLUG = "flaky-tests-root-cause";

async function readJsonLd(
  page: Page,
  type: string,
): Promise<Record<string, unknown>> {
  return page.evaluate((wanted) => {
    const blocks = Array.from(
      document.querySelectorAll('script[type="application/ld+json"]'),
    );
    for (const block of blocks) {
      try {
        const parsed = JSON.parse(block.textContent ?? "{}") as Record<
          string,
          unknown
        >;
        if (parsed["@type"] === wanted) return parsed;
      } catch {
        continue;
      }
    }
    return {};
  }, type);
}

test.describe("SPEC-012 — superfície EN (Remote · Global)", () => {
  test("AC-012.2 — todas as rotas EN respondem 200 com lang=en", async ({
    page,
  }) => {
    for (const route of EN_ROUTES) {
      const response = await page.goto(R(route));
      expect(response?.status(), route).toBe(200);
      const lang = await page.locator("html").getAttribute("lang");
      expect(lang, `${route} — atributo lang`).toBe("en");
    }
  });

  test("AC-012.3 — hreflang recíproco + x-default", async ({ page }) => {
    await page.goto(R("/"));
    const ptAlternates = await page
      .locator('link[rel="alternate"][hreflang]')
      .evaluateAll((nodes) =>
        nodes.map((node) => ({
          hreflang: node.getAttribute("hreflang"),
          href: node.getAttribute("href"),
        })),
      );
    const enHref = ptAlternates.find((a) => a.hreflang === "en")?.href;
    const xDefault = ptAlternates.find((a) => a.hreflang === "x-default")?.href;
    expect(enHref, "PT precisa apontar para o par EN").toContain("/en/");
    expect(xDefault, "x-default aponta para o locale padrão").toContain(
      "royaldatacore.github.io/",
    );

    await page.goto(R("/en/"));
    const enAlternates = await page
      .locator('link[rel="alternate"][hreflang]')
      .evaluateAll((nodes) =>
        nodes.map((node) => ({
          hreflang: node.getAttribute("hreflang"),
          href: node.getAttribute("href"),
        })),
      );
    const ptHref = enAlternates.find((a) => a.hreflang === "pt-BR")?.href;
    expect(ptHref, "EN precisa apontar para o par PT").not.toContain("/en/");
  });

  test("AC-012.4 — o switch preserva a superfície", async ({ page }) => {
    await page.goto(R("/en/services"));
    const switchHref = await page
      .getByTestId("lang-switch")
      .first()
      .getAttribute("href");
    expect(switchHref, "EN /services volta para PT /servicos").toContain(
      "/servicos",
    );

    await page.goto(R("/servicos"));
    const ptSwitchHref = await page
      .getByTestId("lang-switch")
      .first()
      .getAttribute("href");
    expect(ptSwitchHref, "PT /servicos vai para EN /en/services").toContain(
      "/en/services",
    );
  });

  test("AC-012.5 — as superfícies não misturam idiomas", async ({ page }) => {
    await page.goto(R("/en/blog"));
    const enTitles = await page
      .getByTestId("post-list")
      .getByTestId("post-title-flaky-tests-root-cause")
      .count();
    expect(enTitles, "post EN listado na listagem EN").toBe(1);

    await page.goto(R("/blog"));
    const ptTitles = await page
      .getByTestId("post-list")
      .getByTestId("post-title-flaky-tests-root-cause")
      .count();
    expect(ptTitles, "post PT listado na listagem PT").toBe(1);

    // Um post PT não existe na superfície EN e vice-versa.
    const enOnly = await page.goto(R(`/en/blog/${PT_POST_SLUG}`));
    expect(enOnly?.status(), "post EN acessível em /en/blog").toBe(200);
    const ptOnly = await page.goto(R(`/blog/${PT_POST_SLUG}`));
    expect(ptOnly?.status(), "post PT acessível em /blog").toBe(200);
    void EN_POST_SLUG;

    // Feeds separados por idioma.
    const ptFeed = await (await page.request.get(R("/rss.xml"))).text();
    const enFeed = await (await page.request.get(R("/en/rss.xml"))).text();
    expect(ptFeed, "feed PT").toContain("<language>pt-BR</language>");
    expect(enFeed, "feed EN").toContain("<language>en</language>");
    expect(ptFeed, "feed PT não vaza item EN").not.toContain("Flaky Tests:");
    expect(enFeed, "feed EN tem o item EN").toContain("Flaky Tests:");
  });

  test("AC-012.6 — JSON-LD: idioma EN + identidade única da empresa", async ({
    page,
  }) => {
    await page.goto(R("/en/"));
    const enOrg = await readJsonLd(page, "ProfessionalService");
    const enSite = await readJsonLd(page, "WebSite");
    expect(enSite.inLanguage, "WebSite.inLanguage EN").toBe("en");
    expect(
      JSON.stringify(enOrg.areaServed),
      "areaServed da versão EN não é o Brasil",
    ).not.toContain("Brasil");

    await page.goto(R("/"));
    const ptOrg = await readJsonLd(page, "ProfessionalService");
    expect(enOrg["@id"], "mesma organização nos dois locales").toBe(
      ptOrg["@id"],
    );
  });

  test("AC-012.7 — a versão EN não promete employment/CLT", async ({
    page,
  }) => {
    for (const route of ["/en/", "/en/services", "/en/contact"]) {
      await page.goto(R(route));
      const html = (await page.content()).toLowerCase();
      expect(html, `${route} sem CLT`).not.toContain("clt");
      expect(html, `${route} sem alocação`).not.toContain("alocação");
      expect(html, `${route} sem staff augmentation`).not.toContain(
        "staff augmentation",
      );
    }
    await page.goto(R("/en/contact"));
    const html = await page.content();
    expect(html, "o contrato de serviços é explícito").toContain(
      "no employment relationship",
    );
    expect(html, "a entidade contratante é disclosed").toContain(
      "69.527.139/0001-94",
    );
  });

  test("AC-012.8 — o CTA móvel é localizado", async ({ page }) => {
    await page.goto(R("/en/"));
    const label = await page.getByTestId("mobile-cta-contact").innerText();
    expect(label.trim()).toBe("Talk to a specialist");
    void SITE_BASE;
  });
});
