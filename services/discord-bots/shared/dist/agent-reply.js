/**
 * Get agent reply from the web app (single source of truth for prompts and tools).
 * POST /api/discord/agent-reply with { agentSlug, message, discordUserId, channelId? }
 */
import { createLogger, maskBaseUrl, truncate } from "./logger.js";
const log = createLogger("agent-reply");
export async function getAgentReply(baseUrl, apiKey, payload) {
    const url = `${baseUrl.replace(/\/$/, "")}/api/discord/agent-reply`;
    log.info("request", {
        method: "POST",
        url_host: maskBaseUrl(baseUrl),
        path: "/api/discord/agent-reply",
        agentSlug: payload.agentSlug,
    });
    let res;
    try {
        res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(payload),
        });
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : "Network error";
        const code = err && typeof err === "object" && "code" in err ? String(err.code) : undefined;
        log.error("request_failed", {
            url_host: maskBaseUrl(baseUrl),
            path: "/api/discord/agent-reply",
            error: msg,
            error_code: code,
        });
        return { error: `Could not reach the app: ${msg}. Check VERSE_APP_URL.` };
    }
    const contentType = res.headers.get("content-type") ?? "";
    const raw = await res.text();
    if (!contentType.includes("application/json")) {
        log.warn("response_not_json", {
            url_host: maskBaseUrl(baseUrl),
            path: "/api/discord/agent-reply",
            status: res.status,
            content_type: contentType.slice(0, 50),
            body_preview: truncate(raw, 300),
        });
        return {
            error: `App returned ${res.status} (expected JSON). Is VERSE_APP_URL correct and the app running?`,
        };
    }
    let data;
    try {
        data = JSON.parse(raw);
    }
    catch {
        log.warn("response_invalid_json", {
            url_host: maskBaseUrl(baseUrl),
            path: "/api/discord/agent-reply",
            status: res.status,
            body_preview: truncate(raw, 300),
        });
        return {
            error: "App response was not valid JSON. Check VERSE_APP_URL and that /api/discord/agent-reply exists.",
        };
    }
    if (!res.ok) {
        log.warn("response_error", {
            url_host: maskBaseUrl(baseUrl),
            path: "/api/discord/agent-reply",
            status: res.status,
            app_error: data.error ?? null,
            body_preview: truncate(raw, 300),
        });
        return { error: data.error ?? res.statusText };
    }
    if (data.error)
        return { error: data.error };
    log.info("response_ok", { url_host: maskBaseUrl(baseUrl), path: "/api/discord/agent-reply", status: res.status });
    return { text: data.text ?? "" };
}
