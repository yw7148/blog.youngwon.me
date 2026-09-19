import type { APIRoute } from 'astro';
import {
  COMMENT_RATE_LIMIT_SECONDS,
  createPostComment,
  getCommentClientIdentifier,
  hashCommentClientIdentifier,
  listPostComments,
  parseCommentOffset,
  validateCommentInput,
} from '../../../../lib/post-comments';
import { getPost } from '../../../../lib/posts';

const MAX_REQUEST_BYTES = 8_192;

function json(body: unknown, status = 200, extraHeaders?: HeadersInit) {
  const headers = new Headers(extraHeaders);
  headers.set('Cache-Control', 'no-store');
  headers.set('Content-Type', 'application/json; charset=utf-8');

  return new Response(JSON.stringify(body), { status, headers });
}

async function existingPost(slug: string | undefined) {
  return slug ? await getPost(slug) : undefined;
}

export const GET: APIRoute = async ({ params, request }) => {
  const slug = params.slug;
  const offset = parseCommentOffset(new URL(request.url).searchParams.get('offset'));
  if (offset === undefined) return json({ error: '댓글 조회 위치가 올바르지 않습니다.' }, 400);

  try {
    if (!(await existingPost(slug))) return json({ error: '글을 찾을 수 없습니다.' }, 404);
    return json(await listPostComments(slug as string, offset));
  } catch (error) {
    console.error('Could not load post comments.', error);
    return json({ error: '댓글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.' }, 503);
  }
};

export const POST: APIRoute = async ({ params, request }) => {
  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) {
    return json({ error: '허용되지 않은 요청입니다.' }, 403);
  }

  const contentLength = Number(request.headers.get('Content-Length') ?? 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return json({ error: '요청 내용이 너무 큽니다.' }, 413);
  }

  let body: { author?: unknown; content?: unknown };
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
      return json({ error: '요청 내용이 너무 큽니다.' }, 413);
    }
    const parsed = JSON.parse(rawBody) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return json({ error: '요청 값이 올바르지 않습니다.' }, 400);
    }
    body = parsed as { author?: unknown; content?: unknown };
  } catch {
    return json({ error: '올바른 JSON 요청이 필요합니다.' }, 400);
  }

  const input = validateCommentInput(body.author, body.content);
  if (!input.ok) return json({ error: input.error }, 400);

  const slug = params.slug;
  try {
    if (!(await existingPost(slug))) return json({ error: '글을 찾을 수 없습니다.' }, 404);

    const secret = import.meta.env.COMMENT_HMAC_SECRET;
    if (!secret) throw new Error('COMMENT_HMAC_SECRET is not configured.');
    const clientHash = await hashCommentClientIdentifier(
      getCommentClientIdentifier(request.headers),
      secret,
    );
    const result = await createPostComment(
      slug as string,
      input.author,
      input.content,
      clientHash,
    );

    if (!result.accepted) {
      return json(
        { error: '댓글은 1분에 한 번만 작성할 수 있습니다.' },
        429,
        { 'Retry-After': String(COMMENT_RATE_LIMIT_SECONDS) },
      );
    }

    return json({ comment: result.comment }, 201);
  } catch (error) {
    console.error('Could not create post comment.', error);
    return json({ error: '댓글을 등록하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, 503);
  }
};
