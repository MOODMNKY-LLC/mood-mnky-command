import { Ratelimit } from "@upstash/ratelimit"
import { getRedis } from "@/lib/redis"

/**
 * Rate limiter for public-facing mag/ugc endpoints.
 * Sliding window: 10 requests per 60 seconds per identifier.
 * When Upstash is not configured, limits are not enforced (graceful degradation).
 * Uses shared Redis client from @/lib/redis.
 */
let ratelimit: Ratelimit | null = null
const redis = getRedis()
if (redis) {
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
