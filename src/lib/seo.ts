import type { Post } from './posts';
import { SITE } from './site.ts';

export function getPostUrl(id: string) {
  return new URL(`/posts/${id}/`, SITE.url).toString();
}

export function getPostCanonical(post: Pick<Post, 'id' | 'data'>) {
  return post.data.canonicalUrl ?? getPostUrl(post.id);
}

export function resolveShareImageUrl(value: string) {
  if (!/^https?:\/\//i.test(value) && !/^\/(?!\/)/.test(value)) return undefined;

  try {
    const url = new URL(value, SITE.url);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return undefined;
    if (/\.svg$/i.test(url.pathname)) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

export function getPostImage(data: Pick<Post['data'], 'title' | 'body' | 'ogImage' | 'ogImageAlt'>) {
  const explicitImage = data.ogImage && resolveShareImageUrl(data.ogImage);
  if (explicitImage) {
    return { url: explicitImage, alt: data.ogImageAlt ?? data.title, isDefault: false };
  }

  // Code samples aren't representative images. Only use directly linked raster images.
  const body = data.body.replace(/(^|\n)(`{3,}|~{3,})[^\n]*\n[\s\S]*?\n\2[^\n]*(?=\n|$)/g, '$1')
    .replace(/`+[^`\n]*`+/g, '');
  const images = body.matchAll(/!\[([^\]\n]*)\]\(\s*(?:<([^>\n]+)>|([^\s)]+))(?:\s+["'][^\n]*?["'])?\s*\)/g);
  for (const match of images) {
    const url = resolveShareImageUrl(match[2] ?? match[3]);
    if (url) return { url, alt: match[1] || data.title, isDefault: false };
  }

  return { url: new URL('/og-default.png', SITE.url).toString(), alt: SITE.title, isDefault: true };
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
