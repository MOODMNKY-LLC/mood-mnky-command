/**
 * Redis client for rate limiting and optional conversation session cache.
 * Uses ioredis when REDIS_URL is set; otherwise no-op (no rate limit).
 */
import Redis from "ioredis";
export async function createRedisClient(redisUrl) {
    if (!redisUrl?.startsWith("redis://"))
        return null;
    try {
        // ioredis CJS/ESM types can make default import non-constructable in strict mode
        const RedisCtor = Redis;
        return new RedisCtor(redisUrl);
    }
    catch {
        return null;
    }
}
/** Rate limit key: per user per guild, e.g. discord:ratelimit:{guildId}:{userId} */
export function rateLimitKey(guildId, userId, windowSeconds = 60) {
    return `discord:ratelimit:${guildId}:${userId}:${windowSeconds}`;
}
/** Check and increment rate limit. Returns true if under limit, false if over. */
export async function checkRateLimit(redis, key, limit, windowSeconds) {
    if (!redis)
        return true;
    const count = await redis.incr(key);
    if (count === 1)
        await redis.expire(key, windowSeconds);
    return count <= limit;
}
