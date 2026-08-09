import rss from '@astrojs/rss';
import { getAllPosts, getReadingTime } from '../lib/posts';
import { SITE } from '../lib/site';

export async function GET(context: { site?: URL }) {
  const posts = await getAllPosts();

  const response = await rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site?.toString() ?? SITE.url,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishedAt,
      link: `/posts/${post.id}/`,
      categories: post.data.tags,
      customData: `<readingTime>${getReadingTime(post.data.body)}분</readingTime>`,
    })),
    customData: '<language>ko-KR</language>',
  });

  response.headers.set('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  return response;
}
