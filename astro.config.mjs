// ADR-001 · ADR-004 · CONSTITUTION §C1 §C2
// `site` e `base` sao injetados pelo CI shell-side (origin/base determinísticos — ADR-008 D7).
// Localmente, use .env (ver .env.example) ou exporte SITE/SITE_BASE.
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite"; // ADR-001 D2 — Tailwind v4 (NAO @astrojs/tailwind)
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import ROUTES from "./src/lib/routes.json" with { type: "json" }; // SPEC-012 — SSOT do mapa de rotas (mesmo arquivo de src/lib/i18n.ts)

const SITE = process.env.SITE ?? "https://royaldatacore.github.io";
const SITE_BASE = process.env.SITE_BASE || "/";

/**
 * SPEC-012 — helpers do sitemap i18n.
 * ROUTE_BY_PATH: caminho (sem base) -> par de paths PT/EN.
 * POST_PATH: slug de artigo (mesmo slug nos dois idiomas).
 */
const ROUTE_BY_PATH = new Map();
for (const paths of Object.values(ROUTES)) {
  for (const path of Object.values(paths)) {
    ROUTE_BY_PATH.set(path.replace(/\/+$/, "") || "/", paths);
  }
}
const POST_PATH = /^\/(?:en\/)?blog\/([^/]+)$/;

/** Absolutiza um path interno (sem base) usando a origem e a base do deploy. */
function absoluteUrl(path) {
  const base = SITE_BASE.endsWith("/") ? SITE_BASE : `${SITE_BASE}/`;
  return new URL(path.replace(/^\//, ""), new URL(base, SITE)).href;
}

// SPEC-001 AC-001.N1 — falha rapida se site for invalido
if (!/^https:\/\/[^\s/$.?#].[^\s]*$/i.test(SITE)) {
  console.error(
    "[SPEC-001] 'site' é obrigatório e deve ser URL absoluta https:// — recebido: " +
      JSON.stringify(SITE),
  );
  process.exit(1);
}

export default defineConfig({
  // CONSTITUTION §C1 — gate `guard` faz grep nesta linha. NAO alterar sem ADR.
  output: "static",

  site: SITE,
  base: SITE_BASE,

  // URLs limpas: /blog/foo/ em vez de /blog/foo.html
  trailingSlash: "ignore",

  build: {
    format: "directory",
    inlineStylesheets: "auto",
  },

  markdown: {
    // SPEC-004 AC-004.5 — highlight server-side (Shiki). Proibido Prism/hljs no cliente.
    // ADR-007 D7 — github-light-high-contrast: paleta AA-tuned (WCAG 1.4.3 >=4.5:1; github-light falha com #E36209 em 3.48:1)
    shikiConfig: {
      themes: { light: "github-light-high-contrast", dark: "github-dark" },
      wrap: true,
    },
  },

  integrations: [
    mdx(),
    sitemap({
      // SPEC-006 AC-006.3 — as páginas 404 (PT e EN) não entram no sitemap.
      filter: (page) => !page.includes("/404"),
      serialize(item) {
        if (item.url.endsWith("/privacidade/")) item.priority = 0.3;
        // SPEC-012 AC-012.9 — `links` (xhtml:link rel=alternate) no sitemap:
        // cada URL declara o par PT/EN da MESMA superfície. O par canônico
        // vive no <head> (SPEC-011 AC-012.2); o sitemap é o espelho para os
        // crawlers que só leem o sitemap. O i18n nativo do @astrojs/sitemap
        // NÃO serve aqui: ele exige slug idêntico entre locales e aqui os
        // slugs são traduzidos (/servicos ⇄ /en/services).
        const path = new URL(item.url).pathname;
        const normalized = path.replace(/\/+$/, "") || "/";
        const route = ROUTE_BY_PATH.get(normalized);
        const post = POST_PATH.exec(normalized);
        const links = [];
        if (route) {
          links.push({ url: absoluteUrl(route["pt-BR"]), lang: "pt-BR" });
          links.push({ url: absoluteUrl(route.en), lang: "en" });
        } else if (post?.[1]) {
          // Posts mantêm o mesmo slug nos dois idiomas (/blog/<slug> ⇄ /en/blog/<slug>).
          links.push({ url: absoluteUrl(`/blog/${post[1]}`), lang: "pt-BR" });
          links.push({ url: absoluteUrl(`/en/blog/${post[1]}`), lang: "en" });
        }
        if (links.length > 0) {
          item.links = links;
        }
        return item;
      },
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
    build: {
      // SPEC-008 AC-008.5 — nenhum chunk inline; tudo em arquivo externo sob 'self'
      assetsInlineLimit: 2048,
      cssMinify: "lightningcss",
      rollupOptions: {
        output: {
          // Nomes com hash ⇒ cache imutavel ⇒ mitiga RRR-09 (banda)
          entryFileNames: "_astro/[name]-[hash].js",
          chunkFileNames: "_astro/[name]-[hash].js",
          assetFileNames: "_astro/[name]-[hash][extname]",
        },
      },
    },
  },

  devToolbar: { enabled: false },
});
