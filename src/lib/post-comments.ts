import { getRedis } from './redis.ts';

export const COMMENT_PAGE_SIZE = 20;
export const COMMENT_RATE_LIMIT_SECONDS = 60;

export interface PostComment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export type CommentInputResult =
  | { ok: true; author: string; content: string }
  | { ok: false; error: string };

const COMMENT_WRITE_SCRIPT = `
local rate_key = KEYS[1]
local comment_key = KEYS[2]
local index_key = KEYS[3]
local rate_seconds = tonumber(ARGV[1])
local comment_id = ARGV[2]
local created_at = tonumber(ARGV[3])
local comment_json = ARGV[4]

if not redis.call('SET', rate_key, '1', 'NX', 'EX', rate_seconds) then
  return 0
end

redis.call('SET', comment_key, comment_json)
redis.call('ZADD', index_key, created_at, comment_id)
return 1
`;

function characterCount(value: string) {
  return Array.from(value).length;
}

export function validateCommentInput(author: unknown, content: unknown): CommentInputResult {
  if (typeof author !== 'string' || typeof content !== 'string') {
    return { ok: false, error: '작성자 이름과 댓글 내용을 입력해 주세요.' };
  }

  const normalizedAuthor = author.trim();
  const normalizedContent = content.trim();
  const authorLength = characterCount(normalizedAuthor);
  const contentLength = characterCount(normalizedContent);

  if (authorLength < 1 || authorLength > 20) {
    return { ok: false, error: '작성자 이름은 1자 이상 20자 이하로 입력해 주세요.' };
  }

  if (contentLength < 1 || contentLength > 1_000) {
    return { ok: false, error: '댓글 내용은 1자 이상 1,000자 이하로 입력해 주세요.' };
  }

  return { ok: true, author: normalizedAuthor, content: normalizedContent };
}

export function parseCommentOffset(value: string | null) {
  if (value === null) return 0;
  if (!/^\d+$/.test(value)) return undefined;

  const offset = Number(value);
  return Number.isSafeInteger(offset) && offset <= 1_000_000 ? offset : undefined;
}

export function getCommentClientIdentifier(headers: Headers) {
  const forwarded =
    headers.get('x-vercel-forwarded-for') ??
    headers.get('x-forwarded-for') ??
    headers.get('x-real-ip') ??
    'unknown';

  return forwarded.split(',')[0]?.trim() || 'unknown';
}

export async function hashCommentClientIdentifier(identifier: string, secret: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(identifier));

  return [...new Uint8Array(digest)]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
}

export function getCommentRedisKeys(slug: string, commentId?: string, clientHash?: string) {
  return {
    index: `blog:post:${slug}:comments`,
    comment: commentId ? `blog:comment:${commentId}` : undefined,
    rateLimit: clientHash ? `blog:comment-rate:${clientHash}` : undefined,
  };
}

export async function listPostComments(slug: string, offset: number) {
  const redis = getRedis();
  const { index } = getCommentRedisKeys(slug);
  const ids = await redis.zrange<string[]>(index, offset, offset + COMMENT_PAGE_SIZE, {
    rev: true,
  });
  const pageIds = ids.slice(0, COMMENT_PAGE_SIZE);
  const comments =
    pageIds.length === 0
      ? []
      : await redis.mget<Array<PostComment | null>>(
          ...pageIds.map((id) => getCommentRedisKeys(slug, id).comment as string),
        );

  return {
    comments: comments.filter((comment): comment is PostComment => comment !== null),
    nextOffset: offset + pageIds.length,
    hasMore: ids.length > COMMENT_PAGE_SIZE,
  };
}

export async function createPostComment(
  slug: string,
  author: string,
  content: string,
  clientHash: string,
  now = new Date(),
) {
  const id = crypto.randomUUID();
  const comment: PostComment = {
    id,
    author,
    content,
    createdAt: now.toISOString(),
  };
  const keys = getCommentRedisKeys(slug, id, clientHash);
  const accepted = await getRedis().eval<string[], number>(
    COMMENT_WRITE_SCRIPT,
    [keys.rateLimit as string, keys.comment as string, keys.index],
    [
      String(COMMENT_RATE_LIMIT_SECONDS),
      id,
      String(now.valueOf()),
      JSON.stringify(comment),
    ],
  );

  return { accepted: accepted === 1, comment };
}
