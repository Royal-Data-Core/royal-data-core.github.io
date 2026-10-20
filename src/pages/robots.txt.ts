/**
 * ADR-008 D7 — /robots.txt derivado de site/base (injetados shell-side).
 * Zero domínio hardcoded: previne regressão de canonical (D-01) — o
 * estático anterior publicava `Sitemap:` num subdomínio inexistente
 * (`royaldatacore`, sem hífens) e sem o prefixo `/site-io/` (bug descoberto
 * no smoke pós-deploy de 2026-10-20). `/_pagefind/` segue fora de indexação;
 * `/404/` é filtrado no próprio sitemap (SPEC-009).
 */
export const GET = (context: { site: URL | undefined }): Response => {
  if (!context.site) {
    throw new Error(
      "SPEC-001: 'site' é obrigatório e deve ser URL absoluta https://",
    );
  }
  const base = import.meta.env.BASE_URL.replace(/\/+$/, "");
  const sitemapIndex = new URL(`${base}/sitemap-index.xml`, context.site).href;
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /_pagefind/",
    "",
    `Sitemap: ${sitemapIndex}`,
    "",
  ].join("\n");
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
