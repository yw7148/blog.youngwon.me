import { Redis } from '@upstash/redis';

let redis: Redis | undefined;

export function getRedis() {
  if (!redis) {
    const url = import.meta.env.UPSTASH_REDIS_REST_URL;
    const token = import.meta.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) throw new Error('Upstash Redis environment variables are not configured.');
    redis = new Redis({ url, token });
  }

  return redis;
}
