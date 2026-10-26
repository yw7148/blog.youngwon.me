import { defineLiveCollection } from 'astro:content';
import { z } from 'astro/zod';
import { githubPostsLoader } from './lib/github-posts-loader';
import { resolveShareImageUrl } from './lib/seo';

const posts = defineLiveCollection({
  loader: githubPostsLoader(),
  schema: z.object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    series: z.string().optional(),
    canonicalUrl: z.url({ protocol: /^https?$/ }).optional(),
    ogImage: z.string().trim().refine(
      (value) => resolveShareImageUrl(value) !== undefined,
      'ogImage must be an HTTP(S) URL or a root-relative raster image path.',
    ).optional(),
    ogImageAlt: z.string().trim().min(1).optional(),
    body: z.string(),
    headings: z.array(
      z.object({
        depth: z.number().int().min(1).max(6),
        slug: z.string(),
        text: z.string(),
      }),
    ),
  }).refine(
    (post) => !post.updatedAt || post.updatedAt >= post.publishedAt,
    { path: ['updatedAt'], message: 'updatedAt must not be earlier than publishedAt.' },
  ),
});

export const collections = { posts };
