import { Redis } from '@upstash/redis';

const url = process.env.KV_REST_API_URL;
const token = process.env.KV_REST_API_TOKEN;

/** Redis client; only valid when KV_REST_API_URL and KV_REST_API_TOKEN are set. */
export const redis = url && token
  ? new Redis({ url, token })
  : (null as unknown as Redis);

export function isRedisConfigured(): boolean {
  return Boolean(url && token);
}
