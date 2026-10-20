/**
 * SPEC-005 — D-03/D-04 resolved (2026-10-20): the official channels are REAL.
 *
 * This suite runs against the BUILT artifact (preview serves dist/) — the
 * artifact is built with PUBLIC_CONTACT_* set in the CI build env, so these
 * tests prove the production contract: no placeholders on the live site, the
 * exact verified values flowing to hrefs/JSON-LD, and the vCard artifact
 * serving the official data.
 */
import { expect, test } from "@playwright/test";
import { R } from "../base";

test.describe("D-03 resolved — official contact channels render", () => {
  test("AC-005 — /contato channels carry the verified data (email/WhatsApp/tel)", async ({
    page,
  }) => {
    await page.goto(R("/contato/"));

    const email = page.getByTestId("contact-email-link");
    await expect(email).toHaveAttribute("href", /^mailto:/);
    // Entity-encoded at build time (ADR-003 D3): the raw HTML hides the
    // address from naive harvest regexes, while the href decodes to the
    // official value that humans read and click.
    const href = (await email.getAttribute("href")) ?? "";
    expect(decodeURIComponent(href)).toContain("royaldatacore@gmail.com");

    await expect(page.getByTestId("contact-whatsapp-link")).toHaveAttribute(
      "href",
      /^https:\/\/wa\.me\/5516997148778\?text=/,
    );

    const tel = page.getByTestId("contact-phone-link");
    await expect(tel).toHaveAttribute("href", "tel:+5516997148778");
    await expect(tel).toContainText("+55 (16)");
  });

  test("AC-005 — /contato social cards carry the verified URLs (D-04)", async ({
    page,
  }) => {
    await page.goto(R("/contato/"));
    await expect(page.getByTestId("contact-github-link")).toHaveAttribute(
      "href",
      "https://github.com/royaldatacore",
    );
    await expect(page.getByTestId("contact-linkedin-link")).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/leonardo-setti",
    );
    await expect(page.getByTestId("contact-instagram-link")).toHaveAttribute(
      "href",
      "https://www.instagram.com/royaldatacore",
    );
    await expect(page.getByTestId("contact-vcard-link")).toHaveAttribute(
      "href",
      "/contato.vcf",
    );
  });

  test("footer carries the verified socials on a landing route", async ({
    page,
  }) => {
    await page.goto(R("/"));
    await expect(page.getByTestId("footer-social-github")).toHaveAttribute(
      "href",
      "https://github.com/royaldatacore",
    );
    await expect(page.getByTestId("footer-social-instagram")).toHaveAttribute(
      "href",
      "https://www.instagram.com/royaldatacore",
    );
    await expect(page.getByTestId("footer-social-linkedin")).toHaveAttribute(
      "href",
      "https://www.linkedin.com/in/leonardo-setti",
    );
  });

  test("AC-001.5 — ProfessionalService JSON-LD carries real contact + sameAs", async ({
    page,
  }) => {
    await page.goto(R("/"));
    const json = JSON.parse(
      (await page
        .locator("script[data-testid='jsonld-organization']")
        .textContent()) ?? "{}",
    ) as Record<string, unknown>;
    expect(json.telephone).toBe("+55 (16) 99714-8778");
    expect(json.email).toBe("royaldatacore@gmail.com");
    const sameAs = json.sameAs as string[];
    expect(sameAs).toContain("https://github.com/royaldatacore");
    expect(sameAs).toContain("https://www.instagram.com/royaldatacore");
    expect(sameAs).toContain("https://www.linkedin.com/in/leonardo-setti");
  });

  test("contato.vcf serves the official card (D-03 artifact)", async ({
    request,
  }) => {
    const response = await request.get(R("/contato.vcf"));
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("BEGIN:VCARD");
    expect(body).toContain("FN:Leonardo Setti");
    expect(body).toContain("ORG:Royal Data Core LTDA");
    expect(body).toContain("TEL;TYPE=CELL:+5516997148778");
    expect(body).toContain("EMAIL;TYPE=INTERNET:royaldatacore@gmail.com");
  });
});
