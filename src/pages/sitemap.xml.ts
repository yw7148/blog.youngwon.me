import { getAllPosts } from '../lib/posts';
import { SITE } from '../lib/site';
import { tagHref } from '../lib/tags';

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const posts = await getAllPosts();
  const tags = Array.from(new Set(posts.flatMap((post) => post.data.tags)));
  const staticPaths = ['/', '/posts/', '/about/'];
  const paths: Array<{ path: string; lastModified?: Date }> = [
    ...staticPaths.map((path) => ({ path })),
    ...tags.map((tag) => ({ path: tagHref(tag) })),
    ...posts.map((post) => ({
      path: `/posts/${post.id}/`,
      lastModified: post.data.updatedAt ?? post.data.publishedAt,
    })),
  ];
  const urls = paths
    .map(({ path, lastModified }) => {
      const loc = escapeXml(new URL(path, SITE.url).toString());
      const modified = lastModified ? `<lastmod>${lastModified.toISOString()}</lastmod>` : '';
      return `<url><loc>${loc}</loc>${modified}</url>`;
    })
    .join('');

  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
