/**
 * Send Discord events to the web app for gamification (ledger + quest evaluate).
 * Requires MOODMNKY_API_KEY and VERSE_APP_URL.
 */
import { createLogger, maskBaseUrl, truncate } from "./logger.js";
const log = createLogger("events");
export async function sendDiscordEvent(baseUrl, apiKey, payload) {
    const path = "/api/discord/events";
    const url = `${baseUrl.replace(/\/$/, "")}${path}`;
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                ...payload,
                value: payload.value ?? 1,
            }),
        });
        const text = await res.text();
        if (!res.ok) {
            log.warn("events_post_failed", {
                url_host: maskBaseUrl(baseUrl),
                path,
                status: res.status,
                eventType: payload.eventType,
                eventRef: payload.eventRef ?? null,
                body_preview: truncate(text, 200),
            });
            return { ok: false, error: `${res.status}: ${text}` };
        }
        return { ok: true };
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log.warn("events_post_error", {
            url_host: maskBaseUrl(baseUrl),
            path,
            eventType: payload.eventType,
            error: msg,
        });
        return { ok: false, error: msg };
    }
}
