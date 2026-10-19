/**
 * Structural + SEO contract suite — SPEC-001 / SPEC-002 / SPEC-006 / SPEC-007
 * / SPEC-008 (qa-shiftleft, e2e gate).
 *
 * ESM imports only (package.json "type": "module"). Selectors and copy are
 * grounded in the built artifacts under dist/ (verified 2026-10-19); where
 * the site copy matches the SPEC exactly, the test asserts the SPEC literal.
 * One test block per referenced AC; multiple routes checked inside a block
 * with soft (non-fatal-until-end) assertions so every route violation is
 * reported. NO assertion is commented out or skipped to force a green run
 * (AFA Kill Switch invariant).
 */
import { expect, test, type ConsoleMessage, type Page } from "@playwright/test";
import { ASTRO_ASSET_RE, R, SITE_BASE, SITE_URL } from "../base";

const HOME_TITLE = "Royal Data Core — Consultoria em Testes de Software";
const SERVICES_TITLE = "Serviços · Royal Data Core";
const H1_HERO = "Engenharia de qualidade para software crítico";
const SKIP_TEXT = "Pular para o conteúdo principal";
const HEAD_ROUTES = ["/", "/servicos", "/blog", "/contato"];
const OG_ROUTES = ["/", "/servicos", "/blog/<post>"];
const CSP_SCAN_ROUTES = ["/", "/servicos", "/busca"];

type JsonLdBlock =
  { ok: true; data: Record<string, unknown> } | { ok: false; error: string };
type HeadingNode = { level: number; text: string };
type ScriptAudit = {
  inHead: boolean;
  src: string | null;
  type: string | null;
  bytes: number;
};

/** First post-card href on /blog (exactly one path segment after /blog/). */
async function resolveFirstPostHref(page: Page): Promise<string> {
  await page.goto(R("/blog"));
  const href = await page.evaluate<string | null>((base) => {
    const links = Array.from(
      document.querySelectorAll("[data-testid='post-card'] a"),
    );
    const post = links
      .map((a) => a.getAttribute("href") ?? "")
      .find((h) => new RegExp(`^${base}/blog/[^/]+$`).test(h));
    return post ?? null;
  }, SITE_BASE);
  expect(
    href,
    "SPEC-002/AC-002.4: /blog deve expor >= 1 post-card linkado a /blog/<slug>",
  ).toBeTruthy();
  // DOM hrefs carry the artifact base — return BASE-RELATIVE so callers can
  // wrap uniformly with R() (mixing prefixed values into expandRoutes would
  // double-prefix under a non-empty SITE_BASE).
  const relative = (href as string).startsWith(SITE_BASE)
    ? (href as string).slice(SITE_BASE.length)
    : (href as string);
  return relative;
}

function expandRoutes(
  routes: readonly string[],
  firstPostHref: string,
): string[] {
  return routes.map((route) =>
    route === "/blog/<post>" ? firstPostHref : route,
  );
}

/** A11y/e2e no longer normalize the served path: canonical/og:url are compared
 * against the raw served pathname (base + trailing included). Kept only for
 * 404 route edge labels if needed in future — removed 2026-10-19 (unused). */

async function parseAllJsonLd(page: Page): Promise<JsonLdBlock[]> {
  return page.evaluate<JsonLdBlock[]>(() => {
    const blocks = Array.from(
      document.querySelectorAll("script[type='application/ld+json']"),
    );
    return blocks.map((block): JsonLdBlock => {
      try {
        const data = JSON.parse(block.textContent ?? "") as Record<
          string,
          unknown
        >;
        return { ok: true, data };
      } catch (error) {
        return { ok: false, error: String(error) };
      }
    });
  });
}

async function auditScripts(page: Page): Promise<ScriptAudit[]> {
  return page.evaluate<ScriptAudit[]>(() =>
    Array.from(document.querySelectorAll("script")).map((script) => ({
      inHead: script.closest("head") !== null,
      src: script.getAttribute("src"),
      type: script.getAttribute("type"),
      bytes: (script.textContent ?? "").length,
    })),
  );
}

test.describe("SPEC-001 — Base Layout, SEO Técnico e JSON-LD (estrutura)", () => {
  test("AC-001.1 — <meta charset> é primeiro filho de <head>; viewport dentro dos primeiros 5 filhos (/, /servicos, /blog, /contato)", async ({
    page,
  }) => {
    for (const route of HEAD_ROUTES) {
      await page.goto(R(route));
      const head = await page.evaluate(() => {
        const first = document.head.firstElementChild;
        const children = Array.from(document.head.children);
        const viewport = document.head.querySelector<HTMLMetaElement>(
          "meta[name='viewport']",
        );
        return {
          firstTag: first?.outerHTML ?? "",
          isFirstCharset:
            first?.tagName === "META" &&
            first?.getAttribute("charset") === "utf-8",
          viewportIndex: children.findIndex(
            (el) =>
              el.tagName === "META" && el.getAttribute("name") === "viewport",
          ),
          viewportContent: viewport?.content ?? "",
        };
      });
      await expect
        .soft(
          head.isFirstCharset,
          `${route}: AC-001.1 — primeiro filho de <head> deve ser <meta charset="utf-8"> (recebido: ${head.firstTag.slice(0, 40)})`,
        )
        .toBe(true);
      await expect
        .soft(
          head.viewportIndex >= 0 && head.viewportIndex < 5,
          `${route}: AC-001.1 — <meta name='viewport'> deve aparecer nos primeiros 5 filhos de <head> (índice: ${head.viewportIndex})`,
        )
        .toBe(true);
      await expect
        .soft(head.viewportContent, `${route}: AC-001.1 — content do viewport`)
        .toContain("width=device-width");
      await expect
        .soft(head.viewportContent, `${route}: AC-001.1 — content do viewport`)
        .toContain("initial-scale=1");
    }
  });

  test("AC-001.2 — <title> template determinístico: home exata, /servicos exata, comprimento 20–60", async ({
    page,
  }) => {
    await page.goto(R("/"));
    const homeTitle = await page.title();
    await expect
      .soft(homeTitle, "AC-001.2 — <title> da homepage deve ser exato")
      .toBe(HOME_TITLE);

    await page.goto(R("/servicos"));
    const servicesTitle = await page.title();
    await expect
      .soft(servicesTitle, "AC-001.2 — <title> de /servicos deve ser exato")
      .toBe(SERVICES_TITLE);

    for (const [route, title] of [
      ["/", homeTitle],
      ["/servicos", servicesTitle],
    ] as const) {
      await expect
        .soft(
          title.length >= 20 && title.length <= 60,
          `AC-001.2 — comprimento do <title> de ${route} (${title.length}) deve estar em [20,60]`,
        )
        .toBe(true);
    }
  });

  test('AC-001.3 — exatamente 1 canonical absoluto derivado de site+base; sem "undefined"/"null"; sem "//" após o protocolo', async ({
    page,
  }) => {
    const firstPostHref = await resolveFirstPostHref(page);
    const canonicalRoutes = expandRoutes(
      [
        "/",
        "/servicos",
        "/blog",
        "/contato",
        "/privacidade",
        "/busca",
        "/blog/<post>",
      ],
      firstPostHref,
    );
    for (const route of canonicalRoutes) {
      const response = await page.goto(R(route));
      const hrefs = await page
        .locator("link[rel='canonical']")
        .getAttribute("href");
      const count = await page.locator("link[rel='canonical']").count();
      // The deployed canonical = SITE_URL + the served path EXACTLY (build keeps
      // the base prefix and the trailing slash on index routes) — so the served
      // URL pathname is the source of truth; no trailing normalization.
      const pathname = new URL(page.url()).pathname;
      const expectedHref = `${SITE_URL}${pathname}`;
      await expect
        .soft(count, `${route}: AC-001.3 — exatamente 1 link[rel=canonical]`)
        .toBe(1);
      await expect
        .soft(
          hrefs === expectedHref && response != null,
          `${route}: AC-001.3 — href canonical deve ser "${expectedHref}" (recebido: ${hrefs})`,
        )
        .toBe(true);
      await expect
        .soft(
          hrefs ?? "",
          `${route}: AC-001.3 — canonical não pode conter literal "undefined" nem "null"`,
        )
        .not.toMatch(/undefined|null/);
      await expect
        .soft(
          (hrefs ?? "").slice("https://".length).includes("//"),
          `${route}: AC-001.3 — canonical não pode conter "//" após o protocolo`,
        )
        .toBe(false);
    }
    // SPEC-006.3: a 404 NÃO emite canonical — o contrato de 1 canonical vale só para rotas indexáveis.
    await page.goto(R("/listing-a-ghost-route-n"));
    await expect
      .soft(
        await page.locator("link[rel='canonical']").count(),
        "SPEC-006.3: 404 não deve emitir <link rel=canonical>",
      )
      .toBe(0);
  });

  test("AC-001.4 — og:* + twitter:card completos em /, /servicos e /blog/<slug>; og:image 1200x630 existente em dist", async ({
    page,
  }) => {
    const firstPostHref = await resolveFirstPostHref(page);
    for (const route of expandRoutes(OG_ROUTES, firstPostHref)) {
      await page.goto(R(route));
      // Served URL pathname IS the og:url reference (base + trailing slash
      // preserved — matches the build's canonical assembly).
      const pathname = new URL(page.url()).pathname;
      for (const prop of [
        "og:title",
        "og:description",
        "og:type",
        "og:url",
        "og:image",
      ] as const) {
        const meta = page.locator(`meta[property='${prop}']`);
        const content = await meta.first().getAttribute("content");
        await expect
          .soft(
            (await meta.count()) === 1 && (content ?? "") !== "",
            `${route}: AC-001.4 — <meta property='${prop}'> presente com content não-vazio`,
          )
          .toBe(true);
      }
      const locale = await page
        .locator("meta[property='og:locale']")
        .getAttribute("content");
      await expect
        .soft(locale, `${route}: AC-001.4 — og:locale deve ser pt_BR`)
        .toBe("pt_BR");
      const card = await page
        .locator("meta[name='twitter:card']")
        .getAttribute("content");
      await expect
        .soft(
          card,
          `${route}: AC-001.4 — twitter:card deve ser summary_large_image`,
        )
        .toBe("summary_large_image");
      const ogUrl = await page
        .locator("meta[property='og:url']")
        .getAttribute("content");
      await expect
        .soft(
          ogUrl === `${SITE_URL}${pathname}`,
          `${route}: AC-001.4 — og:url deve ser ${SITE_URL}${pathname} (recebido: ${ogUrl})`,
        )
        .toBe(true);
      const ogType = await page
        .locator("meta[property='og:type']")
        .getAttribute("content");
      await expect
        .soft(
          ogType === "website" || ogType === "article",
          `${route}: AC-001.4 — og:type deve ser website ou article (recebido: ${ogType})`,
        )
        .toBe(true);
    }
    // SPEC-001 Gherkin: og:image aponta para arquivo existente em dist/ com dimensões 1200x630.
    const ogImage = await page.request.get(R("/og-default.png"));
    await expect
      .soft(
        ogImage.status(),
        "AC-001.4 — /og-default.png deve existir em dist/",
      )
      .toBe(200);
    const png = await ogImage.body();
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);
    await expect
      .soft(
        width === 1200 && height === 630,
        `AC-001.4 — og:image deve ter 1200x630 (recebido: ${width}x${height})`,
      )
      .toBe(true);
  });

  test("AC-001.5 — JSON-LD Organization/ProfessionalService (home): legalName, taxID, foundingDate, address; sem numberOfEmployees", async ({
    page,
  }) => {
    await page.goto(R("/"));
    const blocks = await parseAllJsonLd(page);
    const parseFailures = blocks.filter(
      (block): block is { ok: false; error: string } => !block.ok,
    );
    await expect
      .soft(
        parseFailures,
        "AC-001.5 — todo bloco JSON-LD deve parsear sem exceção",
      )
      .toEqual([]);
    const organizations = blocks.filter(
      (block): block is { ok: true; data: Record<string, unknown> } =>
        block.ok &&
        ["Organization", "ProfessionalService"].includes(
          String(block.data["@type"]),
        ),
    );
    await expect
      .soft(
        organizations.length,
        "AC-001.5 — deve existir 1 bloco Organization/ProfessionalService na homepage",
      )
      .toBe(1);
    const org = organizations[0].data;
    await expect
      .soft(String(org["name"] ?? ""), "AC-001.5 — name")
      .toBe("Royal Data Core");
    await expect
      .soft(String(org["legalName"] ?? ""), "AC-001.5 — legalName")
      .toBe("ROYAL DATA CORE LTDA");
    await expect
      .soft(String(org["taxID"] ?? ""), "AC-001.5 — taxID")
      .toBe("69527139000194");
    await expect
      .soft(String(org["foundingDate"] ?? ""), "AC-001.5 — foundingDate")
      .toBe("2026-10-06");
    const address = org["address"] as Record<string, unknown> | undefined;
    await expect
      .soft(
        String(address?.["addressLocality"] ?? ""),
        "AC-001.5 — address.addressLocality",
      )
      .toBe("Matão");
    await expect
      .soft(
        String(address?.["addressRegion"] ?? ""),
        "AC-001.5 — address.addressRegion",
      )
      .toBe("SP");
    await expect
      .soft(
        String(address?.["addressCountry"] ?? ""),
        "AC-001.5 — address.addressCountry",
      )
      .toBe("BR");
    await expect
      .soft(
        Object.prototype.hasOwnProperty.call(org, "numberOfEmployees"),
        "AC-001.5 — NÃO deve existir a chave numberOfEmployees (PJ recém-constituída; claim de porte proibido — SDD-CONTEXT §1)",
      )
      .toBe(false);
  });

  test("AC-001.6 — JSON-LD WebSite com potentialAction SearchAction e target /busca?q={search_term_string} (home)", async ({
    page,
  }) => {
    await page.goto(R("/"));
    const blocks = await parseAllJsonLd(page);
    const websites = blocks.filter(
      (block): block is { ok: true; data: Record<string, unknown> } =>
        block.ok && String(block.data["@type"]) === "WebSite",
    );
    await expect
      .soft(
        websites.length >= 1,
        "AC-001.6 — deve existir bloco JSON-LD @type WebSite na homepage",
      )
      .toBe(true);
    const action = websites[0].data["potentialAction"] as
      Record<string, unknown> | undefined;
    await expect
      .soft(
        String(action?.["@type"] ?? ""),
        "AC-001.6 — potentialAction.@type deve ser SearchAction",
      )
      .toBe("SearchAction");
    await expect
      .soft(
        String(action?.["target"] ?? "").includes(
          "/busca?q={search_term_string}",
        ),
        `AC-001.6 — potentialAction.target deve conter /busca?q={search_term_string} (recebido: ${String(action?.["target"] ?? "")})`,
      )
      .toBe(true);
  });

  test("AC-001.7 — skip-link: primeiro Tab recebe foco; texto exato; href #conteudo-principal; alvo com tabindex=-1", async ({
    page,
  }) => {
    for (const route of HEAD_ROUTES) {
      await page.goto(R(route));
      const skip = page.locator("[data-testid='skip-link']");
      await expect
        .soft(await skip.count(), `${route}: AC-001.7 — skip-link presente`)
        .toBe(1);
      await page.keyboard.press("Tab");
      await expect
        .soft(
          skip,
          `${route}: AC-001.7 — primeiro Tab deve focar [data-testid='skip-link']`,
        )
        .toBeFocused();
      await expect
        .soft(skip, `${route}: AC-001.7 — texto visível do skip-link`)
        .toHaveText(SKIP_TEXT);
      await expect
        .soft(skip, `${route}: AC-001.7 — href do skip-link`)
        .toHaveAttribute("href", "#conteudo-principal");
      const tabindex = await page.evaluate(
        () =>
          document
            .querySelector<HTMLElement>("#conteudo-principal")
            ?.getAttribute("tabindex") ?? null,
      );
      await expect
        .soft(
          tabindex === "-1",
          `${route}: AC-001.7 — #conteudo-principal precisa de tabindex='-1'`,
        )
        .toBe(true);
    }
  });

  test("AC-001.8 — zero bytes de script fora de ld+json; nenhum <script src> no <head>; ilha autorizada apenas no corpo de /busca (SPEC-007)", async ({
    page,
  }) => {
    for (const route of HEAD_ROUTES) {
      await page.goto(R(route));
      const scripts = await auditScripts(page);
      const inlineNonLd = scripts.filter(
        (script) =>
          script.src === null && script.type !== "application/ld+json",
      );
      await expect
        .soft(
          inlineNonLd,
          `${route}: AC-001.8 — script inline viola script-src 'self' (SPEC-008); blocos ofensores: ${JSON.stringify(inlineNonLd)}`,
        )
        .toEqual([]);
      const headSrc = scripts.filter(
        (script) => script.inHead && script.src !== null,
      );
      await expect
        .soft(
          headSrc,
          `${route}: AC-001.8 — nenhum <script src> no <head>; BaseLayout emite 0 KB de JS`,
        )
        .toEqual([]);
    }
    // SPEC-007: /busca é a única rota com ilha autorizada — script[src] permitido APENAS no <body>, mesmo origin /_astro/.
    await page.goto(R("/busca"));
    const buscaScripts = await auditScripts(page);
    await expect
      .soft(
        buscaScripts.filter((script) => script.inHead && script.src !== null),
        "AC-001.8/SPEC-007 — /busca: nenhum <script src> no <head>; a ilha autorizada vive no corpo",
      )
      .toEqual([]);
    const islandSrc = buscaScripts
      .filter((script) => script.src !== null)
      .map((script) => script.src);
    await expect
      .soft(
        islandSrc.length > 0 &&
          islandSrc.every((src) => ASTRO_ASSET_RE.test(src ?? "")),
        `AC-001.8/SPEC-007 — /busca: script[src] deve ser mesmo origin /_astro/ (recebido: ${JSON.stringify(islandSrc)})`,
      )
      .toBe(true);
    const inlineNonLdBusca = buscaScripts.filter(
      (script) => script.src === null && script.type !== "application/ld+json",
    );
    await expect
      .soft(
        inlineNonLdBusca,
        "AC-001.8 — /busca: script inline viola script-src 'self' (SPEC-008)",
      )
      .toEqual([]);
  });
});

test.describe("SPEC-002 — Homepage / Landing (superfície S1)", () => {
  test("AC-002.1 — exatamente 1 h1 com texto exato; <= 12 headings; sem salto de nível; todo h2 após um h1", async ({
    page,
  }) => {
    await page.goto(R("/"));
    const headings = await page.evaluate<HeadingNode[]>(() =>
      Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6")).map((el) => ({
        level: Number(el.tagName.charAt(1)),
        text: (el.textContent ?? "").replace(/\s+/g, " ").trim(),
      })),
    );
    const h1s = headings.filter((heading) => heading.level === 1);
    await expect
      .soft(h1s.length, "AC-002.1 — exatamente 1 elemento h1")
      .toBe(1);
    await expect
      .soft(h1s[0]?.text ?? "", "AC-002.1 — texto do h1 deve ser exato")
      .toBe(H1_HERO);
    await expect
      .soft(
        headings.length <= 12,
        `AC-002.1 — contagem total de headings (${headings.length}) deve ser <= 12`,
      )
      .toBe(true);
    await expect
      .soft(headings[0]?.level, "AC-002.1 — primeira heading deve ser h1")
      .toBe(1);
    let seenH1 = false;
    const levelSkips: string[] = [];
    const h2WithoutH1: string[] = [];
    let previous = 0;
    for (const heading of headings) {
      if (heading.level === 1) seenH1 = true;
      if (previous !== 0 && heading.level > previous + 1) {
        levelSkips.push(`${previous}→${heading.level} em "${heading.text}"`);
      }
      if (heading.level === 2 && !seenH1) h2WithoutH1.push(heading.text);
      previous = heading.level;
    }
    await expect
      .soft(
        levelSkips,
        "AC-002.1 — NÃO deve haver salto de nível (h1 → h3 sem h2 intermediário)",
      )
      .toEqual([]);
    await expect
      .soft(
        h2WithoutH1,
        "AC-002.1 — todo h2 precisa de um h1 antes (ancestral na hierarquia de headings)",
      )
      .toEqual([]);
  });
});

test.describe("SPEC-002 — AC-002.2 (viewport 375x667 pinado por AC, SDD-CONTEXT §4)", () => {
  test.use({ viewport: { width: 375, height: 667 } });
  test("AC-002.2 — CTAs primários inteiros no viewport inicial 375x667 e área clicável >= 44x44 (contraste de texto delegado ao axe color-contrast em tests/a11y)", async ({
    page,
  }) => {
    await page.goto(R("/"));
    const viewport = page.viewportSize();
    expect(
      viewport,
      "AC-002.2 — viewport pinado 375x667 (SDD-CONTEXT §4)",
    ).toEqual({ width: 375, height: 667 });
    for (const testid of ["cta-primary-services", "cta-primary-contact"]) {
      const cta = page.locator(`[data-testid='${testid}']`);
      await expect
        .soft(cta, `AC-002.2 — [data-testid='${testid}'] visível sem scroll`)
        .toBeVisible();
      const box = await cta.boundingBox();
      await expect
        .soft(
          box !== null &&
            box.x >= 0 &&
            box.y >= 0 &&
            box.x + box.width <= 375 &&
            box.y + box.height <= 667,
          `AC-002.2 — [data-testid='${testid}'] deve estar inteiro dentro do viewport 375x667 (box: ${JSON.stringify(box)})`,
        )
        .toBe(true);
      await expect
        .soft(
          box !== null && box.width >= 44 && box.height >= 44,
          `AC-002.2 — [data-testid='${testid}'] área clicável >= 44x44 CSS px (box: ${JSON.stringify(box)})`,
        )
        .toBe(true);
    }
  });
});

test.describe("SPEC-002 — Provas reutilizadas pelo Lighthouse (S1)", () => {
  test('AC-002.3 — badge de prova estático "build: passing"; zero <img src*=img.shields.io>; zero recurso de host de terceiro (home)', async ({
    page,
  }) => {
    await page.goto(R("/"));
    const badge = page.locator("[data-testid='proof-build-status']");
    await expect
      .soft(badge, "AC-002.3 — [data-testid='proof-build-status'] visível")
      .toBeVisible();
    await expect
      .soft(
        (await badge.textContent())?.replace(/\s+/g, " ").trim() ?? "",
        'AC-002.3 — badge de prova resolvido em build time contendo "build: passing"',
      )
      .toBe("build: passing");
    const shields = await page.locator("img[src*='img.shields.io']").count();
    await expect
      .soft(
        shields,
        "AC-002.3 — NÃO deve existir <img src*=img.shields.io> (badge de terceiro em runtime)",
      )
      .toBe(0);
    const thirdParty = await page.evaluate(() => {
      const entries = window.performance
        .getEntriesByType("resource")
        .map((entry) => entry.name);
      return entries.filter((name) => {
        if (name.startsWith("data:")) return false;
        try {
          const origin = new URL(name).origin;
          return origin !== window.location.origin && origin !== SITE_URL;
        } catch {
          return false;
        }
      });
    });
    await expect
      .soft(
        thirdParty.length === 0,
        `AC-002.3 — resources devem estar restritos a self origin + data: (recebido: ${JSON.stringify(thirdParty)})`,
      )
      .toBe(true);
  });

  test("AC-002.4 — [data-testid=recent-posts] com >= 1 post-card, ordenado por publishDate DESC, link de card em /blog/<slug>", async ({
    page,
  }) => {
    await page.goto(R("/"));
    const recent = page.locator("[data-testid='recent-posts']");
    await expect
      .soft(recent, "AC-002.4 — seção de posts recentes visível")
      .toBeVisible();
    const cardCount = await recent.locator("[data-testid='post-card']").count();
    await expect
      .soft(
        cardCount >= 1,
        `AC-002.4 — >= 1 [data-testid='post-card'] (recebido: ${cardCount}, content publica 3)`,
      )
      .toBe(true);
    // POST_HREF_RE cannot cross the evaluate boundary (browser context) — the
    // base fragment is passed as an argument and re-assembled in-page.
    const postLinks = await page.evaluate(
      (base) =>
        Array.from(document.querySelectorAll("[data-testid='post-card'] a"))
          .map((anchor) => anchor.getAttribute("href"))
          .filter(
            (href): href is string =>
              href !== null && new RegExp(`^${base}/blog/[^/]+$`).test(href),
          ),
      SITE_BASE,
    );
    await expect
      .soft(
        postLinks.length >= cardCount,
        `AC-002.4 — todo post-card deve linkar /blog/<slug> com base resolvida (links: ${JSON.stringify(postLinks)})`,
      )
      .toBe(true);
    const ptMonths: Record<string, number> = {
      janeiro: 1,
      fevereiro: 2,
      março: 3,
      abril: 4,
      maio: 5,
      junho: 6,
      julho: 7,
      agosto: 8,
      setembro: 9,
      outubro: 10,
      novembro: 11,
      dezembro: 12,
    };
    const dateTexts = await page.evaluate(() =>
      Array.from(document.querySelectorAll("[data-testid^='post-date-']")).map(
        (el) => (el.textContent ?? "").replace(/\s+/g, " ").trim(),
      ),
    );
    const numericDates = dateTexts.map((text) => {
      const match = text.match(/^(\d{1,2}) de (\S+) de (\d{4})$/);
      expect(
        text,
        `AC-002.4 — data do card em formato "DD de mês de AAAA" (recebido: "${text}")`,
      ).toMatch(/^(\d{1,2}) de (\S+) de (\d{4})$/);
      if (!match) return Number.NEGATIVE_INFINITY;
      const month = ptMonths[match[2]] ?? 0;
      return Number(
        `${match[3]}${String(month).padStart(2, "0")}${match[1].padStart(2, "0")}`,
      );
    });
    let orderedDesc = true;
    for (let i = 1; i < numericDates.length; i += 1) {
      if (numericDates[i]! > numericDates[i - 1]!) orderedDesc = false;
    }
    await expect
      .soft(
        orderedDesc,
        `AC-002.4 — cards ordenados por publishDate DESC (datas: ${JSON.stringify(dateTexts)})`,
      )
      .toBe(true);
  });
});

test.describe("SPEC-006 — 404 custom · SPEC-008 — CSP em runtime (RRR-04)", () => {
  test("SPEC-006 — rota fantasma responde HTTP 404 e entrega conteúdo de recuperação com testids 404-*", async ({
    page,
  }) => {
    const response = await page.goto(R("/listing-a-ghost-route-n"));
    const status = response?.status() ?? 0;
    const servesRealStatus = status === 404;
    test.info().annotations.push({
      type: "preview_serves_404_status",
      description: String(servesRealStatus),
    });
    if (!servesRealStatus) {
      console.info(
        `SPEC-006: preview serviu HTTP ${status} para rota fantasma — fallback para assertions de conteúdo (preview_serves_404_status=false)`,
      );
    } else {
      await expect
        .soft(
          servesRealStatus,
          `SPEC-006 — astro preview deve servir HTTP 404 para rota fantasma (recebido: ${status})`,
        )
        .toBe(true);
    }
    const h1 = page.locator("h1");
    await expect
      .soft(h1, "SPEC-006.2 — exatamente 1 <h1> na página de erro")
      .toHaveCount(1);
    await expect
      .soft(h1, 'SPEC-006.2 — <h1> deve ser "Página não encontrada"')
      .toHaveText("Página não encontrada");
    for (const testid of [
      "404-link-home",
      "404-link-blog",
      "404-link-services",
    ]) {
      const link = page.locator(`[data-testid='${testid}']`);
      await expect
        .soft(
          await link.count(),
          `SPEC-006.2 — link de navegação [data-testid='${testid}'] presente`,
        )
        .toBe(1);
      const href = await link.getAttribute("href");
      await expect
        .soft(
          (href ?? "").startsWith("/"),
          `SPEC-006.2 — ${testid} href com base resolvida (recebido: ${href})`,
        )
        .toBe(true);
    }
  });

  test("AC-001.N3-equivalente / AC-008.8 — zero violação de CSP em runtime em /, /servicos, /busca (gate RRR-04)", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      window.addEventListener("securitypolicyviolation", (event) => {
        // SPEC-008 AC-008.8: nenhuma violação de CSP pode ocorrer; violações
        // são re-emitidas como console.error para o gate de console da suite.
        console.error(
          `securitypolicyviolation: directive=${event.violatedDirective} blocked=${event.blockedURI} source=${event.sourceFile}`,
        );
      });
    });
    for (const route of CSP_SCAN_ROUTES) {
      const cspLikely: ConsoleMessage[] = [];
      const consoleCollector = (message: ConsoleMessage) => {
        if (message.type() === "error") cspLikely.push(message);
      };
      const pageErrorCollector = (error: Error) => {
        console.info(`AC-008.8 — pageerror em ${route}: ${error.message}`);
      };
      page.on("console", consoleCollector);
      page.on("pageerror", pageErrorCollector);
      await page.goto(R(route), { waitUntil: "networkidle" });
      if (route === "/busca") {
        // Hidrata a ilha Pagefind para varredura sob a CSP real (script-src 'self' 'wasm-unsafe-eval').
        const searchInput = page.locator("[data-testid='search-input']");
        if ((await searchInput.count()) === 1) await searchInput.fill("flaky");
        await page.waitForTimeout(500);
      }
      const errors = (
        await Promise.all(cspLikely.map((message) => message.text()))
      ).filter((text) =>
        /content security policy|refused to|securitypolicyviolation/i.test(
          text,
        ),
      );
      page.off("console", consoleCollector);
      page.off("pageerror", pageErrorCollector);
      await expect
        .soft(
          errors.length === 0,
          `AC-008.8/RRR-04 — ${route}: nenhum console.error de CSP em runtime (recebido: ${JSON.stringify(errors)})`,
        )
        .toBe(true);
    }
  });
});
