/**
 * SPEC-004 AC-004.6 — /rss.xml (RFC 4287/RSS 2.0 via @astrojs/rss).
 * Titles/description/content: PT-BR. @astrojs/rss resolves `site` + `base`
 * (context.site includes the base per Astro) — all links become absolute https.
 * Drafts never appear (AC-004.2).
 */
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { formatPublishDate } from '../lib/date';

export async function GET(context: { site: URL | undefined }): Promise<Response> {
  const postEntries = await getCollection('blog');
  const published = postEntries
    .filter((post) => !post.data.draft)
    .sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf());

  if (!context.site) {
    throw new Error("SPEC-001: 'site' é obrigatório e deve ser URL absoluta https://");
  }

  return rss({
    title: 'Royal Data Core — artigos de engenharia de testes',
    description:
      'Conteúdo técnico sobre estratégia de testes, automação e pipelines de QA. Sem rodeio.',
    site: context.site,
    items: published.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      link: `blog/${post.id}/`,
      pubDate: post.data.publishDate,
      content: `${post.data.description} — publicado em ${formatPublishDate(post.data.publishDate)}.`,
    })),
    customData: '<language>pt-BR</language>',
    trailingSlash: false as const,
    stylesheet: false as const,
  });
}
