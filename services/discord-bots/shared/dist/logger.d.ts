/**
 * Simple structured logger for Discord bots. All output goes to stdout/stderr
 * so it appears in terminal and container logs (e.g. docker logs).
 * Use one-line, JSON-friendly fields for easy grepping and log aggregation.
 */
export type LoggerTag = "api" | "agent-reply" | "profile" | "events" | "bot" | "redis";
/**
 * Create a logger with a fixed tag (e.g. "api", "agent-reply").
 * Use for shared HTTP client and bot entry points.
 */
export declare function createLogger(tag: LoggerTag): {
    info(msg: string, fields?: Record<string, unknown>): void;
    warn(msg: string, fields?: Record<string, unknown>): void;
    error(msg: string, fields?: Record<string, unknown>): void;
};
/** Safe to log: base URL host only (no path, no API key). */
export declare function maskBaseUrl(url: string): string;
/** Truncate body for logs (e.g. first 200 chars). */
export declare function truncate(s: string, max?: number): string;
//# sourceMappingURL=logger.d.ts.map