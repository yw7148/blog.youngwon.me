import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { getReadingTime, sortPosts } from '../lib/posts';
import { SITE } from '../lib/site';

export async function GET(context: { site?: URL }) {
  const posts = sortPosts(await getCollection('posts'));

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site?.toString() ?? SITE.url,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.publishedAt,
      link: `/posts/${post.id}/`,
      categories: post.data.tags,
      customData: `<readingTime>${getReadingTime(post.body)}분</readingTime>`,
    })),
    customData: '<language>ko-KR</language>',
  });
}
