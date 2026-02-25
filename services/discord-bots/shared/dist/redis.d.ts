/**
 * Redis client for rate limiting and optional conversation session cache.
 * Uses ioredis when REDIS_URL is set; otherwise no-op (no rate limit).
 */
export interface RedisClient {
    get(key: string): Promise<string | null>;
    set(key: string, value: string, px?: number): Promise<unknown>;
    incr(key: string): Promise<number>;
    expire(key: string, seconds: number): Promise<number>;
    quit(): Promise<void>;
}
export declare function createRedisClient(redisUrl: string | undefined): Promise<RedisClient | null>;
/** Rate limit key: per user per guild, e.g. discord:ratelimit:{guildId}:{userId} */
export declare function rateLimitKey(guildId: string, userId: string, windowSeconds?: number): string;
/** Check and increment rate limit. Returns true if under limit, false if over. */
export declare function checkRateLimit(redis: RedisClient | null, key: string, limit: number, windowSeconds: number): Promise<boolean>;
//# sourceMappingURL=redis.d.ts.map