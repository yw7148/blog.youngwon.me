import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

export function sortPosts(posts: Post[]) {
  return [...posts].sort((a, b) => {
    return b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf();
  });
}

export async function getAllPosts() {
  return sortPosts(await getCollection('posts'));
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
