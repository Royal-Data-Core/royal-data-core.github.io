// ADR-001 · ADR-004 · CONSTITUTION §C1 §C2
// `site` e `base` sao injetados pelo CI via actions/configure-pages (ADR-004).
// Localmente, use .env (ver .env.example).
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';   // ADR-001 D2 — Tailwind v4 (NAO @astrojs/tailwind)
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

const SITE = process.env.SITE ?? 'https://royaldatacore.github.io';
const SITE_BASE = process.env.SITE_BASE ?? '/';

// SPEC-001 AC-001.N1 — falha rapida se site for invalido
if (!/^https:\/\/[^\s/$.?#].[^\s]*$/i.test(SITE)) {
  console.error(
    "[SPEC-001] 'site' é obrigatório e deve ser URL absoluta https:// — recebido: " + JSON.stringify(SITE)
  );
  process.exit(1);
}

export default defineConfig({
  // CONSTITUTION §C1 — gate `guard` faz grep nesta linha. NAO alterar sem ADR.
  output: 'static',

  site: SITE,
  base: SITE_BASE,

  // URLs limpas: /blog/foo/ em vez de /blog/foo.html
  trailingSlash: 'ignore',

  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },

  markdown: {
    // SPEC-004 AC-004.5 — highlight server-side (Shiki). Proibido Prism/hljs no cliente.
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
  },

  image: {
    // ADR-001 D4 — sharp distribui binario via optionalDependencies, sem postinstall
    service: { entrypoint: 'astro/assets/services/sharp' },
  },

  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/404'),
      serialize(item) {
        // SPEC-009 AC-009.6 — /privacidade deve permanecer indexavel
        if (item.url.endsWith('/privacidade/')) item.priority = 0.3;
        return item;
      },
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
    build: {
      // SPEC-008 AC-008.5 — nenhum chunk inline; tudo em arquivo externo sob 'self'
      assetsInlineLimit: 2048,
      cssMinify: 'lightningcss',
      rollupOptions: {
        output: {
          // Nomes com hash ⇒ cache imutavel ⇒ mitiga RRR-09 (banda)
          entryFileNames: '_astro/[name]-[hash].js',
          chunkFileNames: '_astro/[name]-[hash].js',
          assetFileNames: '_astro/[name]-[hash][extname]',
        },
      },
    },
  },

  devToolbar: { enabled: false },
});
