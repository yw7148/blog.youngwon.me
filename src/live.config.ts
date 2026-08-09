import { defineLiveCollection } from 'astro:content';
import { z } from 'astro/zod';
import { githubPostsLoader } from './lib/github-posts-loader';

const posts = defineLiveCollection({
  loader: githubPostsLoader(),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    series: z.string().optional(),
    canonicalUrl: z.url().optional(),
    body: z.string(),
    headings: z.array(
      z.object({
        depth: z.number().int().min(1).max(6),
        slug: z.string(),
        text: z.string(),
      }),
    ),
  }),
});

export const collections = { posts };
