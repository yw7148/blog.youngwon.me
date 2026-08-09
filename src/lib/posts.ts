import { getLiveCollection, getLiveEntry } from 'astro:content';
import type { LiveDataEntry } from 'astro';

export interface PostData {
  title: string;
  description: string;
  publishedAt: Date;
  updatedAt?: Date;
  draft: boolean;
  tags: string[];
  series?: string;
  canonicalUrl?: string;
  body: string;
  headings: Array<{ depth: number; slug: string; text: string }>;
}

export type Post = LiveDataEntry<PostData>;

export function sortPosts(posts: Post[]) {
  return [...posts].sort((a, b) => {
    return b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf();
  });
}

export async function getAllPosts() {
  const { entries, error } = await getLiveCollection('posts');
  if (error) throw error;
  return sortPosts((entries ?? []).filter(({ data }) => !data.draft));
}

export async function getPost(id: string) {
  const { entry, error } = await getLiveEntry('posts', { id });
  if (error) throw error;
  return entry?.data.draft ? undefined : entry;
}

export function getReadingTime(body = '') {
  const withoutCode = body.replace(/```[\s\S]*?```/g, '');
  const normalized = withoutCode.replace(/\s+/g, ' ').trim();
  const koreanChars = normalized.match(/[\u3131-\uD79D]/g)?.length ?? 0;
  const latinWords = normalized.match(/[A-Za-z0-9_]+/g)?.length ?? 0;
  const estimatedUnits = koreanChars / 2.5 + latinWords;

  return Math.max(1, Math.ceil(estimatedUnits / 220));
}

export function collectTags(posts: Post[]) {
  return Array.from(new Set(posts.flatMap((post) => post.data.tags))).sort((a, b) =>
    a.localeCompare(b, 'ko-KR'),
  );
}

export function getAdjacentPosts(posts: Post[], currentId: string) {
  const index = posts.findIndex((post) => post.id === currentId);

  return {
    newer: index > 0 ? posts[index - 1] : undefined,
    older: index >= 0 && index < posts.length - 1 ? posts[index + 1] : undefined,
  };
}

export function setContentCacheHeaders(headers: Headers) {
  headers.set('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
}
