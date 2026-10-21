/**
 * Accessibility contract suite — axe-core over the full route matrix
 * (qa-shiftleft, a11y gate).
 *
 * ESM imports only (package.json "type": "module"). WCAG 2.1 AA is asserted
 * with the axe rules tagged wcag2a/wcag2aa/wcag21a/wcag21aa — zero critical
 * violations. Non-WCAG-tagged findings (best-practice, cat.* only) are
 * recorded as ADVISORY counters via console.info — they never gate, never
 * bend the contract. Viewport matrix comes from playwright.config.ts:
 * projects "chromium" (1280x800) and "mobile" (375x667) — SDD-CONTEXT §4.
 * Contrast uses the axe `color-contrast` rule; hierarchy uses axe
 * `heading-order`; nothing hand-rolled. NO assertion is disabled to force
 * green (AFA Kill Switch invariant).
 */
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { R, SITE_BASE } from "../base";

const CRITICAL_WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
// SPEC-012 — the skip link is localized with the page (same contract: it is
// the first focusable element and carries a meaningful label in the page's
// own language — WCAG 3.1.2).
const SKIP_TEXT: Record<string, string> = {
  "pt-BR": "Pular para o conteúdo principal",
  en: "Skip to the main content",
};
const skipTextFor = (route: string): string =>
  route.startsWith("/en") ? SKIP_TEXT.en : SKIP_TEXT["pt-BR"];
// Rotas de superfície (SDD-CONTEXT §2: S1/S2 + legais + laboratório de busca).
const STATIC_ROUTES = [
  "/",
  "/servicos",
  "/contato",
  "/blog",
  "/privacidade",
  "/busca",
  // SPEC-012 — the English surface is audited with the same contract.
  "/en/",
  "/en/services",
  "/en/contact",
  "/en/privacy",
  "/en/blog",
  "/en/search",
];

type Violation = Awaited<
  ReturnType<AxeBuilder["analyze"]>
>["violations"][number];

/** Primeiro link de post da listagem /blog — derivado do DOM, não hard-coded. */
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
    "A11Y: /blog deve expor >= 1 post-card linkado a /blog/<slug>",
  ).toBeTruthy();
  // DOM hrefs carry the artifact base — return BASE-RELATIVE so callers wrap
  // uniformly with R() (avoids double prefix in mixed route arrays).
  const relative = (href as string).startsWith(SITE_BASE)
    ? (href as string).slice(SITE_BASE.length)
    : (href as string);
  return relative;
}

/**
 * Full axe scan; partitions violations into WCAG-gating (critical tags)
 * and advisory (everything else). Only WCAG violations gate the suite.
 */
async function scanAndAssert(page: Page, route: string): Promise<void> {
  const results = await new AxeBuilder({ page }).analyze();
  const critical = results.violations.filter((violation) =>
    (violation.tags ?? []).some((tag) => CRITICAL_WCAG_TAGS.includes(tag)),
  );
  const advisory: Violation[] = results.violations.filter(
    (violation) =>
      !(violation.tags ?? []).some((tag) => CRITICAL_WCAG_TAGS.includes(tag)),
  );
  const advisorySummary =
    advisory
      .map(
        (violation) =>
          `${violation.id}(${violation.impact ?? "unset"}, ${violation.nodes.length} nodes)`,
      )
      .join(", ") || "none";
  console.info(
    `A11Y-ADVISORY [project=${test.info().project.name}] ${route} : non-WCAG findings = ${advisory.length} [${advisorySummary}]`,
  );
  await expect
    .soft(
      critical,
      `WCAG 2.1/2.1.1-2.1.2 AA (axe ${CRITICAL_WCAG_TAGS.join("/")}) — ${route} sob project=${test.info().project.name}: violações críticas: ${JSON.stringify(
        critical.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          tags: violation.tags,
          nodes: violation.nodes.map((node) => node.failureSummary),
        })),
      )}`,
    )
    .toEqual([]);
}

test.describe("A11y — WCAG 2.1 AA zero violações críticas por rota (axe-core)", () => {
  for (const route of STATIC_ROUTES) {
    test(`axe scan — ${route}`, async ({ page }) => {
      await page.goto(R(route));
      await scanAndAssert(page, route);
    });
  }

  test("axe scan — /blog/<slug> (primeiro post derivado da listagem /blog)", async ({
    page,
  }) => {
    const postHref = await resolveFirstPostHref(page);
    await page.goto(R(postHref));
    await scanAndAssert(page, postHref);
  });
});

test.describe("A11y — SPEC-001/AC-001.7 skip-link é o primeiro elemento focável (contrato a11y)", () => {
  test("keyboard: primeiro Tab foca [data-testid=skip-link] em toda rota mapeada", async ({
    page,
  }) => {
    const postHref = await resolveFirstPostHref(page);
    const routes = [...STATIC_ROUTES, postHref];
    for (const route of routes) {
      await page.goto(R(route));
      if (route === "/busca" || route === "/en/search") {
        // SPEC-007/AC-007.5 sobrepõe a premissa de foco inicial nesta rota: o
        // input ganha foco automaticamente (autofocus nativo verificado em
        // runtime). Assertiva mantida: foco inicial na busca + skip-link
        // continua sendo o primeiro elemento focável em DOM/tab-order.
        await expect(
          page.locator("#search-input"),
          "SPEC-007.5 — foco inicial em [data-testid=search-input]",
        ).toBeFocused();
        const firstTabbable = await page.evaluate(() => {
          const tabbables = Array.from(
            document.querySelectorAll(
              'a[href],button,input,textarea,select,[tabindex]:not([tabindex="-1"])',
            ),
          ).filter((el) => el.getAttribute("tabindex") !== "-1");
          const first = tabbables[0];
          return {
            tag: first?.tagName ?? "",
            testid: first?.getAttribute("data-testid") ?? "",
            total: tabbables.length,
          };
        });
        expect
          .soft(
            firstTabbable.testid,
            `/busca: skip-link deve continuar primeiro elemento focável (ordem: ${JSON.stringify(firstTabbable)})`,
          )
          .toBe("skip-link");
        continue;
      }
      const skip = page.locator("[data-testid='skip-link']");
      await expect
        .soft(await skip.count(), `${route}: skip-link presente`)
        .toBe(1);
      await page.keyboard.press("Tab");
      await expect
        .soft(skip, `${route}: AC-001.7 — primeiro Tab deve focar o skip-link`)
        .toBeFocused();
      await expect
        .soft(skip, `${route}: AC-001.7 — texto visível do skip-link`)
        .toHaveText(skipTextFor(route));
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
          `${route}: AC-001.7 — #conteudo-principal com tabindex='-1'`,
        )
        .toBe(true);
    }
  });
});
