import type { APIRoute } from 'astro';
import { recordPostMetric, type MetricAction } from '../../../../lib/post-metrics';
import { getPost } from '../../../../lib/posts';

const VISITOR_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

export const POST: APIRoute = async ({ params, request }) => {
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) {
    return json({ error: '허용되지 않은 요청입니다.' }, 403);
  }

  const slug = params.slug;
  if (!slug) return json({ error: '글을 찾을 수 없습니다.' }, 404);

  let body: { action?: unknown; visitorId?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: '올바른 JSON 요청이 필요합니다.' }, 400);
  }

  const action = body.action;
  const visitorId = body.visitorId;
  if (
    (action !== 'view' && action !== 'like') ||
    typeof visitorId !== 'string' ||
    !VISITOR_ID_PATTERN.test(visitorId)
  ) {
    return json({ error: '요청 값이 올바르지 않습니다.' }, 400);
  }

  try {
    const post = await getPost(slug);
    if (!post) return json({ error: '글을 찾을 수 없습니다.' }, 404);

    const metrics = await recordPostMetric(slug, action as MetricAction, visitorId);
    return json(metrics);
  } catch (error) {
    console.error('Could not update post metrics.', error);
    return json({ error: '글 지표를 불러오지 못했습니다.' }, 503);
  }
};
