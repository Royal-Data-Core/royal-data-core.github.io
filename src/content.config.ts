/**
 * SPEC-004 — Blog Content Collection (Astro Content Layer, glob loader + MDX).
 * Schema is the BINDING spec snippet; `strict` prevents silent frontmatter typos.
 * AC-004.N2: publishDate in the future fails the build with the spec-exact message.
 *
 * NOTE (topology): a `services` collection (SPEC-003 §Collection) is NOT created
 * here — §C3/`guard-adr` requires a new ADR for every new Content Collection,
 * and this subagent may not write `.ai/adr/**`. Until ratified, /servicos renders
 * COPY-BRIEF data verbatim.
 */
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blogSchema = z
  .object({
    title: z.string().min(15).max(90),
    description: z.string().min(80).max(200),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z
      .array(z.string().regex(/^[a-z0-9-]+$/))
      .min(1)
      .max(6),
    coverAlt: z.string().min(10).max(200),
    coverSrc: z.string().optional(),
    lang: z.enum(["pt-BR", "en"]).default("pt-BR"),
    draft: z.boolean().default(false),
    canonicalUrl: z.string().url().optional(),
    references: z
      .array(z.object({ label: z.string(), url: z.string().url() }))
      .default([]),
  })
  .strict() // mission directive: strict schema
  .refine((post) => post.publishDate.getTime() <= Date.now(), {
    message: "SPEC-004: publishDate não pode estar no futuro",
  });

const blog = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/blog" }),
  schema: blogSchema,
});

export const collections = { blog };
