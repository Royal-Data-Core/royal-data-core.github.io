/**
 * SPEC-004 AC-004.6 / SPEC-012 — /en/rss.xml (RFC 4287/RSS 2.0 via @astrojs/rss).
 * English feed: only posts with `lang: "en"`. The PT-BR feed lives at /rss.xml
 * and filters its own locale — the two feeds never mix languages.
 */
import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { formatPublishDate } from "../../lib/date";
import { postSlug } from "../../lib/i18n";

export async function GET(context: {
  site: URL | undefined;
}): Promise<Response> {
  const postEntries = await getCollection("blog");
  const published = postEntries
    .filter((post) => !post.data.draft && post.data.lang === "en")
    .sort(
      (a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf(),
    );

  if (!context.site) {
    throw new Error(
      "SPEC-001: 'site' é obrigatório e deve ser URL absoluta https://",
    );
  }

  return rss({
    title: "Royal Data Core — software testing articles",
    description:
      "Technical articles on test strategy, automation and QA pipelines. No small talk.",
    site: context.site,
    items: published.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      link: `en/blog/${postSlug(post.id, "en")}/`,
      pubDate: post.data.publishDate,
      content: `${post.data.description} — published on ${formatPublishDate(post.data.publishDate, "en")}.`,
    })),
    customData: "<language>en</language>",
    trailingSlash: false as const,
  });
}
