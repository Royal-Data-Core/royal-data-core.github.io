# SPEC-004 — Blog Técnico (MDX Content Layer + RSS + Tags)

**ID:** SPEC-004 · **Versão:** 1.0.0 · **Status:** APPROVED-PENDING-AUDIT
**Agente executor:** `frontend-astro` + `content-strategist` · **Auditor:** `spec-auditor`
**Dependências:** SPEC-001 · **Bloqueia:** SPEC-007 (índice de busca)

## Impacto em CWV
| Rota | LCP | CLS | INP | JS |
|---|---|---|---|---|
| `/blog` (listagem) | ≤ 2200 ms | 0.00 | 0 ms | **0 KB** |
| `/blog/[slug]` (artigo) | ≤ 2500 ms | 0.00 | 0 ms | **0 KB** (sem highlight client-side) |
| `/blog/tag/[tag]` | ≤ 2200 ms | 0.00 | 0 ms | **0 KB** |

**Decisão vinculante:** syntax highlighting é feito **em build time** por Shiki (nativo do Astro), gerando HTML+CSS estático. Proibido Prism.js/highlight.js no cliente.

## Impacto em Bundle
CSS incremental por artigo ≤ 6 KB gzip (tema Shiki com subset de tokens). Imagens por artigo ≤ 200 KB (AVIF, `loading="lazy"` abaixo da dobra, `width`/`height` explícitos sempre).

## Content Collection `blog` (Astro 5 Content Layer — correção F-07)
```ts
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/blog' }),
  schema: z.object({
    title: z.string().min(15).max(90),
    description: z.string().min(80).max(200),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string().regex(/^[a-z0-9-]+$/)).min(1).max(6),
    coverAlt: z.string().min(10).max(200),
    coverSrc: z.string().optional(),
    lang: z.enum(['pt-BR', 'en']).default('pt-BR'),
    draft: z.boolean().default(false),
    canonicalUrl: z.string().url().optional(),
    references: z.array(z.object({ label: z.string(), url: z.string().url() })).default([]),
  }),
});
```

## Critérios de Aceite

```gherkin
Feature: SPEC-004 — Blog

  Scenario: AC-004.1 — Slugs derivam do nome de arquivo, sem data no path
    Given que existe "src/content/blog/flaky-tests-root-cause.mdx" com "draft: false"
    When o build é executado
    Then "dist/blog/flaky-tests-root-cause/index.html" existe
    And "dist/blog/2026/…" NÃO existe
    And o "<link rel=canonical>" é a URL absoluta correspondente

  Scenario: AC-004.2 — Rascunhos são excluídos do artefato
    Given que "src/content/blog/wip-draft.mdx" declara "draft: true"
    When o build é executado
    Then "dist/blog/wip-draft/index.html" NÃO existe
    And o post NÃO aparece em "/blog"
    And o post NÃO aparece em "dist/rss.xml"
    And o post NÃO aparece no índice do Pagefind

  Scenario: AC-004.3 — Listagem ordenada, paginada e com tempo de leitura
    Given que existem 14 posts publicados
    When "/blog" é renderizada
    Then "[data-testid='post-list']" contém 10 elementos "[data-testid='post-card']" na página 1
    And a ordenação é por "publishDate" decrescente
    And existe "[data-testid='pagination-next']" apontando para "/blog/2"
    And cada card exibe "[data-testid='post-reading-time']" com texto casando "/^\d+ min de leitura$/"
    E cada card exibe data em formato longo pt-BR

  Scenario: AC-004.4 — Página de artigo com metadata completo
    Given a rota "/blog/flaky-tests-root-cause"
    When o documento é renderizado
    Then "<h1>" é o valor de "title" do frontmatter
    And existe "<time datetime='YYYY-MM-DD'>" com texto pt-BR legível
    And existe elemento "[data-testid='post-tags']" com >= 1 e <= 6 links para "/blog/tag/<tag>"
    And existe "[data-testid='post-toc']" com âncoras válidas para todo "h2" do corpo
    And o bloco JSON-LD tem "@type": "BlogPosting" com "headline", "datePublished", "dateModified", "author.@type": "Person", "publisher.@type": "Organization", "mainEntityOfPage"

  Scenario: AC-004.5 — Syntax highlighting 100% server-side
    Given um artigo com bloco de código TypeScript
    When o HTML gerado é inspecionado
    Then os tokens são "<span>" com classes "astro-code" e cor inline ou via CSS estático
    And NÃO existe "<script src='…prism…'>" nem "…highlight.js…"
    And NÃO existe elemento "<script>" no corpo do artigo

  Scenario: AC-004.6 — RSS válido e absoluto
    Given que o build foi executado
    When "dist/rss.xml" é parseado
    Then o documento é XML bem-formado
    And "<rss version='2.0'>" está presente
    And todo "<link>" e todo "<guid>" é URL absoluta iniciando em "https://"
    And a quantidade de "<item>" é >= 1 e <= 20
    And "dist/" contém "<link rel='alternate' type='application/rss+xml'>" referenciando "/rss.xml"

  Scenario: AC-004.7 — Imagens otimizadas com dimensão explícita
    Given um artigo com imagem de capa
    When o HTML é inspecionado
    Then o "<img>" tem atributos "width" e "height" numéricos > 0
    And o "src" aponta para arquivo ".avif" ou ".webp"
    And o "alt" é não-vazio e tem >= 10 caracteres
    And imagens abaixo da dobra têm "loading='lazy'" e "decoding='async'"
    And a imagem LCP tem "fetchpriority='high'" e NÃO tem "loading='lazy'"

  Scenario: AC-004.8 — References obrigatórias para claims técnicos
    Given um artigo cuja seção "## Benchmarks" ou "## Resultados" existe
    When o MDX é validado
    Then o frontmatter "references" tem >= 1 entrada
    And cada "references[].url" responde com status HTTP 2xx ou 3xx no gate "link-check"

  # ── CENÁRIOS NEGATIVOS ────────────────────────────────────────────
  Scenario: AC-004.N1 — Frontmatter incompleto falha o build
    Given que um post omite "description"
    When "npm run build" é executado
    Then exit code != 0
    And "stderr" contém "blog/<id>" e "description" e "Required"
    And "dist/" permanece vazio

  Scenario: AC-004.N2 — Data futura é rejeitada
    Given que um post declara "publishDate" posterior à data de execução do CI
    When "npm run build" é executado
    Then exit code != 0
    And "stderr" contém "SPEC-004: publishDate não pode estar no futuro"

  Scenario: AC-004.N3 — Título longo demais quebra o gate
    Given que "title" tem 120 caracteres
    When "npm run build" é executado
    Then o schema Zod falha com "Too big: expected string to have maximum length 90"
    And exit code != 0

  Scenario: AC-004.N4 — Tag com caractere inválido é rejeitada
    Given que "tags" inclui "Testes Automatizados" (com espaço e maiúscula)
    When "npm run build" é executado
    Then o schema Zod falha no regex "/^[a-z0-9-]+$/"
    And a mensagem sugere a forma normalizada "testes-automatizados"

  Scenario: AC-004.N5 — Link quebrado em referência bloqueia deploy
    Given que "references" inclui "https://example.invalid/paper"
    When o job "verify" roda "linkinator"
    Then o link é reportado com status != 2xx
    And o job termina com exit code != 0
    And o relatório lista arquivo e linha de origem

  Scenario: AC-004.N6 — CLS por imagem sem dimensão
    Given que uma imagem de artigo perde os atributos "width"/"height"
    When o LHCI audita "/blog/<slug>"
    Then a assertion "cumulative-layout-shift" falha (> 0.1)
    And exit code != 0
```

## Hints de `data-testid`
`post-list` · `post-card` · `post-title-<slug>` · `post-date-<slug>` · `post-reading-time` · `post-tags` · `post-toc` · `post-body` · `pagination-prev` · `pagination-next` · `article-headline` · `article-cover` · `tag-list` · `rss-link`

## Rastreabilidade
`ADR-001 D1` · `ADR-000` · `CONSTITUTION §C10 §C12` · `SDD-CONTEXT §4` · `SPEC-001` · alimenta `SPEC-007`

## Fontes
Astro 5 Docs — Content Layer API, `glob()` loader, `render()` · Astro Docs — `@astrojs/rss` · Astro Docs — Shiki syntax highlighting · RFC 4287 / RSS 2.0 spec · schema.org/BlogPosting · WCAG 2.1 SC 1.1.1, 1.4.3 · Google Search Central — Images SEO.
