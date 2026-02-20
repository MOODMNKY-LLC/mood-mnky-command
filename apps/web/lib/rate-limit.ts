import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

/**
 * Rate limiter for public-facing mag/ugc endpoints.
 * Sliding window: 10 requests per 60 seconds per identifier.
 * When Upstash is not configured, limits are not enforced (graceful degradation).
 */
let ratelimit: Ratelimit | null = null

if (redisUrl && redisToken) {
  const redis = new Redis({ url: redisUrl, token: redisToken })
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "60 s"),
    analytics: true,
  })
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; limit: number; remaining: number; reset: number }

/**
 * Check rate limit. Returns { ok: true } when allowed, or { ok: false, ... } when limited.
 * When Upstash is not configured, always returns { ok: true }.
 */
export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  if (!ratelimit) return { ok: true }

  const result = await ratelimit.limit(identifier)
  if (result.success) {
    return { ok: true }
  }
  return {
    ok: false,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  }
}
