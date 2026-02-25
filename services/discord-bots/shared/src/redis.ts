/**
 * Redis client for rate limiting and optional conversation session cache.
 * Uses ioredis when REDIS_URL is set; otherwise no-op (no rate limit).
 */

import Redis from "ioredis"

export interface RedisClient {
  get(key: string): Promise<string | null>
  set(key: string, value: string, px?: number): Promise<unknown>
  incr(key: string): Promise<number>
  expire(key: string, seconds: number): Promise<number>
  quit(): Promise<void>
}

export async function createRedisClient(redisUrl: string | undefined): Promise<RedisClient | null> {
  if (!redisUrl?.startsWith("redis://")) return null
  try {
    // ioredis CJS/ESM types can make default import non-constructable in strict mode
    const RedisCtor = Redis as unknown as new (url: string) => RedisClient
    return new RedisCtor(redisUrl)
  } catch {
    return null
  }
}

/** Rate limit key: per user per guild, e.g. discord:ratelimit:{guildId}:{userId} */
export function rateLimitKey(guildId: string, userId: string, windowSeconds = 60): string {
  return `discord:ratelimit:${guildId}:${userId}:${windowSeconds}`
}

/** Check and increment rate limit. Returns true if under limit, false if over. */
export async function checkRateLimit(
  redis: RedisClient | null,
  key: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  if (!redis) return true
  const count = await redis.incr(key)
  if (count === 1) await redis.expire(key, windowSeconds)
  return count <= limit
}
