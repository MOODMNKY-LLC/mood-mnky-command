/**
 * Simple structured logger for Discord bots. All output goes to stdout/stderr
 * so it appears in terminal and container logs (e.g. docker logs).
 * Use one-line, JSON-friendly fields for easy grepping and log aggregation.
 */

const ts = () => new Date().toISOString()

function format(tag: string, level: string, msg: string, fields?: Record<string, unknown>) {
  const parts = [ts(), level, tag, msg]
  if (fields && Object.keys(fields).length > 0) {
    try {
      parts.push(JSON.stringify(fields))
    } catch {
      parts.push(String(fields))
    }
  }
  return parts.join(" ")
}

export type LoggerTag = "api" | "agent-reply" | "profile" | "events" | "bot" | "redis"

/**
 * Create a logger with a fixed tag (e.g. "api", "agent-reply").
 * Use for shared HTTP client and bot entry points.
 */
export function createLogger(tag: LoggerTag) {
  return {
    info(msg: string, fields?: Record<string, unknown>) {
      console.log(format(`[${tag}]`, "INFO", msg, fields))
    },
    warn(msg: string, fields?: Record<string, unknown>) {
      console.warn(format(`[${tag}]`, "WARN", msg, fields))
    },
    error(msg: string, fields?: Record<string, unknown>) {
      console.error(format(`[${tag}]`, "ERROR", msg, fields))
    },
  }
}

/** Safe to log: base URL host only (no path, no API key). */
export function maskBaseUrl(url: string): string {
  try {
    const u = new URL(url.replace(/\/$/, "") || "http://x")
    return `${u.protocol}//${u.host}`
  } catch {
    return "(invalid-url)"
  }
}

/** Truncate body for logs (e.g. first 200 chars). */
export function truncate(s: string, max = 200): string {
  if (s.length <= max) return s
  return s.slice(0, max) + "..."
}
