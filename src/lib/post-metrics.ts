import { Redis } from '@upstash/redis';

export type MetricAction = 'view' | 'like';

export interface PostMetrics {
  views: number;
  likes: number;
  accepted: boolean;
  likedToday: boolean;
}

const KOREA_OFFSET_MS = 9 * 60 * 60 * 1000;
const METRICS_SCRIPT = `
local metrics_key = KEYS[1]
local action_key = KEYS[2]
local like_key = KEYS[3]
local action = ARGV[1]
local expires_at = tonumber(ARGV[2])
local accepted = 0

if redis.call('SET', action_key, '1', 'NX', 'EXAT', expires_at) then
  accepted = 1
  redis.call('HINCRBY', metrics_key, action == 'view' and 'views' or 'likes', 1)
end

local views = tonumber(redis.call('HGET', metrics_key, 'views') or '0')
local likes = tonumber(redis.call('HGET', metrics_key, 'likes') or '0')
local liked_today = redis.call('EXISTS', like_key)

return { accepted, views, likes, liked_today }
`;

let redis: Redis | undefined;

function getRedis() {
  if (!redis) {
    const url = import.meta.env.UPSTASH_REDIS_REST_URL;
    const token = import.meta.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) throw new Error('Upstash Redis environment variables are not configured.');
    redis = new Redis({ url, token });
  }
  return redis;
}

export function getKoreanDayWindow(now = new Date()) {
  const koreanTime = new Date(now.getTime() + KOREA_OFFSET_MS);
  const year = koreanTime.getUTCFullYear();
  const month = koreanTime.getUTCMonth();
  const day = koreanTime.getUTCDate();

  return {
    day: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    expiresAt: Math.floor((Date.UTC(year, month, day + 1) - KOREA_OFFSET_MS) / 1000),
  };
}

export async function recordPostMetric(
  slug: string,
  action: MetricAction,
  visitorId: string,
  now = new Date(),
): Promise<PostMetrics> {
  const { day, expiresAt } = getKoreanDayWindow(now);
  const visitorDigest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(visitorId));
  const visitorHash = [...new Uint8Array(visitorDigest)]
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('');
  const metricsKey = `blog:post:${slug}:metrics`;
  const viewKey = `blog:post:${slug}:view:${day}:${visitorHash}`;
  const likeKey = `blog:post:${slug}:like:${day}:${visitorHash}`;
  const actionKey = action === 'view' ? viewKey : likeKey;
  const result = await getRedis().eval<string[], [number, number, number, number]>(
    METRICS_SCRIPT,
    [metricsKey, actionKey, likeKey],
    [action, String(expiresAt)],
  );

  return {
    accepted: result[0] === 1,
    views: result[1],
    likes: result[2],
    likedToday: result[3] === 1,
  };
}
