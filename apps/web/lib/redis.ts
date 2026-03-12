import { Redis } from "@upstash/redis"

const redisUrl =
  process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
const redisToken =
  process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN

/**
 * Shared Upstash Redis client for rate limiting, cache, idempotency, and session metadata.
 * Env: UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN, or KV_REST_API_URL + KV_REST_API_TOKEN.
 * When not configured, all helpers no-op (return null / allow / skip).
 */
let redis: Redis | null = null
if (redisUrl && redisToken) {
  redis = new Redis({ url: redisUrl, token: redisToken })
}

export function getRedis(): Redis | null {
  return redis
}

export function isRedisConfigured(): boolean {
  return redis !== null
}

const PREFIX_CACHE = "cache:"
const PREFIX_IDEM = "idem:"
const PREFIX_SESSION = "session:"
const DEFAULT_CACHE_TTL_SEC = 300
const DEFAULT_IDEM_TTL_SEC = 86400
const DEFAULT_SESSION_TTL_SEC = 3600

/** Server-side cache: get value by key. Returns null if missing or Redis not configured. */
export async function cacheGet<T = unknown>(key: string): Promise<T | null> {
  if (!redis) return null
  const fullKey = PREFIX_CACHE + key
  const raw = await redis.get(fullKey)
  if (raw == null) return null
  try {
    return (typeof raw === "string" ? JSON.parse(raw) : raw) as T
  } catch {
    return raw as T
  }
}

/** Server-side cache: set value with optional TTL (default 5 min). */
export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number = DEFAULT_CACHE_TTL_SEC,
): Promise<void> {
  if (!redis) return
  const fullKey = PREFIX_CACHE + key
  if (ttlSeconds > 0) {
    await redis.setex(fullKey, ttlSeconds, JSON.stringify(value))
  } else {
    await redis.set(fullKey, JSON.stringify(value))
  }
}

/**
 * Idempotency: returns true if this key was already seen (duplicate request).
 * Call setIdempotencyKey after successfully processing the request.
 */
export async function getIdempotencySeen(key: string): Promise<boolean> {
  if (!redis) return false
  const fullKey = PREFIX_IDEM + key
  const v = await redis.get(fullKey)
  return v !== null
}

/**
 * Idempotency: mark key as processed. TTL default 24h so duplicate requests within that window are rejected.
 */
export async function setIdempotencyKey(
  key: string,
  ttlSeconds: number = DEFAULT_IDEM_TTL_SEC,
): Promise<void> {
  if (!redis) return
  const fullKey = PREFIX_IDEM + key
  await redis.setex(fullKey, ttlSeconds, "1")
}

/**
 * Session metadata: get a value for a session + field.
 */
export async function sessionMetadataGet(
  sessionId: string,
  field: string,
): Promise<unknown | null> {
  if (!redis) return null
  const key = PREFIX_SESSION + sessionId + ":" + field
  const raw = await redis.get(key)
  if (raw == null) return null
  try {
    return typeof raw === "string" ? JSON.parse(raw) : raw
  } catch {
    return raw
  }
}

/**
 * Session metadata: set a value for a session + field with optional TTL (default 1h).
 */
export async function sessionMetadataSet(
  sessionId: string,
  field: string,
  value: unknown,
  ttlSeconds: number = DEFAULT_SESSION_TTL_SEC,
): Promise<void> {
  if (!redis) return
  const key = PREFIX_SESSION + sessionId + ":" + field
  const payload = JSON.stringify(value)
  if (ttlSeconds > 0) {
    await redis.setex(key, ttlSeconds, payload)
  } else {
    await redis.set(key, payload)
  }
}
