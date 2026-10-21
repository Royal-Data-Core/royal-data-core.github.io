/**
 * SPEC-012 AC-012.4 — locale topology contract (route map, counterparts).
 *
 * Scenarios (Gherkin, SPEC-012 §5):
 *   - AC-012.4.1  every route key has exactly one PT and one EN path;
 *   - AC-012.4.2  the locale of a path is derived from the path alone;
 *   - AC-012.4.3  the counterpart of a page is the same surface in the other
 *     locale (never a redirect to the home);
 *   - AC-012.4.4  both locales expose the same UI chrome keys.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_LOCALE,
  LOCALES,
  ROUTES,
  UI_STRINGS,
  counterpartPath,
  isLocale,
  postSlug,
  localeOfPath,
  routeKeyOfPath,
  routePath,
  type RouteKey,
} from "./i18n";

const ROUTE_KEYS = Object.keys(ROUTES) as RouteKey[];

describe("SPEC-012/AC-012.4 — topologia de locales", () => {
  it("AC-012.4.1 — cada rota tem exatamente um caminho PT e um EN", () => {
    expect(ROUTE_KEYS.length).toBeGreaterThanOrEqual(7);
    for (const key of ROUTE_KEYS) {
      const pt = ROUTES[key]["pt-BR"];
      const en = ROUTES[key].en;
      expect(pt.startsWith("/")).toBe(true);
      expect(en.startsWith("/")).toBe(true);
      expect(en.startsWith("/en")).toBe(true);
      expect(pt).not.toBe(en);
    }
  });

  it("AC-012.4.2 — o locale é derivado do caminho", () => {
    expect(localeOfPath("/")).toBe("pt-BR");
    expect(localeOfPath("/servicos")).toBe("pt-BR");
    expect(localeOfPath("/en")).toBe("en");
    expect(localeOfPath("/en/services")).toBe("en");
    expect(localeOfPath("/enterprise")).toBe("pt-BR");
    expect(isLocale("en")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(DEFAULT_LOCALE).toBe("pt-BR");
    expect(LOCALES).toEqual(["pt-BR", "en"]);
  });

  it("AC-012.4.3 — o contraparte mantém a superfície (não cai no home)", () => {
    expect(counterpartPath("/servicos", "en")).toBe("/en/services");
    expect(counterpartPath("/en/services", "pt-BR")).toBe("/servicos");
    expect(counterpartPath("/privacidade", "en")).toBe("/en/privacy");
    expect(counterpartPath("/en/contact", "pt-BR")).toBe("/contato");
    expect(counterpartPath("/blog/flaky-tests-root-cause", "en")).toBe(
      "/en/blog/flaky-tests-root-cause",
    );
    expect(counterpartPath("/en/blog/contract-testing-pyramid", "pt-BR")).toBe(
      "/blog/contract-testing-pyramid",
    );
    // Unknown path → the target locale home (never a broken link).
    expect(counterpartPath("/rota-inexistente", "en")).toBe("/en/");
  });

  it("routeKeyOfPath reconhece as duas grafias", () => {
    expect(routeKeyOfPath("/servicos")).toBe("services");
    expect(routeKeyOfPath("/en/services")).toBe("services");
    expect(routeKeyOfPath("/blog/algum-post")).toBeNull();
  });

  it("AC-012.4.4 — os dois locales expõem o mesmo conjunto de UI", () => {
    const ptKeys = Object.keys(UI_STRINGS["pt-BR"].nav).sort();
    const enKeys = Object.keys(UI_STRINGS.en.nav).sort();
    expect(enKeys).toEqual(ptKeys);
    expect(Object.keys(UI_STRINGS.en.footer).sort()).toEqual(
      Object.keys(UI_STRINGS["pt-BR"].footer).sort(),
    );
    expect(routePath("home", "en")).toBe("/en/");
  });
});

describe("SPEC-012 — base montado (ADR-008 D7)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("stripBase remove o prefixo de base e preserva o locale", async () => {
    vi.stubEnv("BASE_URL", "/site-io/");
    vi.resetModules();
    const mod = await import("./i18n");
    expect(mod.stripBase("/site-io/en/services")).toBe("/en/services");
    expect(mod.localeOfPath("/site-io/en/services")).toBe("en");
    expect(mod.localeOfPath("/site-io/servicos")).toBe("pt-BR");
    expect(mod.counterpartPath("/site-io/servicos", "en")).toBe("/en/services");
  });

  it("postSlug preserva o id PT e remove o prefixo en/ no EN", () => {
    expect(postSlug("flaky-tests-root-cause", "pt-BR")).toBe(
      "flaky-tests-root-cause",
    );
    expect(postSlug("en/flaky-tests-root-cause", "en")).toBe(
      "flaky-tests-root-cause",
    );
  });
});
