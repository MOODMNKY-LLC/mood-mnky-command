/**
 * Jellyfin theme publish: HMAC-signed upload gate.
 * CI (e.g. GitHub Actions) calls this with version, css_base64, sha256; function
 * validates signature, uploads to infra-artifacts, updates jellyfin_theme_builds/latest.
 * Set THEME_BUCKET=infra-artifacts and THEME_PUBLISH_SECRET in Supabase secrets.
 */

import { createClient } from "npm:@supabase/supabase-js@2.45.4"

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let out = 0
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return out === 0
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 })
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const PUBLISH_SECRET = Deno.env.get("THEME_PUBLISH_SECRET")
    const BUCKET = Deno.env.get("THEME_BUCKET") ?? "infra-artifacts"

    if (!PUBLISH_SECRET) {
      return new Response("THEME_PUBLISH_SECRET not set", { status: 500 })
    }

    const signature = req.headers.get("x-mnky-signature") ?? ""
    const timestamp = req.headers.get("x-mnky-timestamp") ?? ""

    const now = Date.now()
    const ts = Number(timestamp)
    if (!Number.isFinite(ts) || Math.abs(now - ts) > 5 * 60 * 1000) {
      return new Response("Invalid timestamp", { status: 401 })
    }

    const body = await req.json()
    const version: string = body.version
    const cssBase64: string = body.css_base64
    const sha256: string = body.sha256
    const setLatest: boolean = body.set_latest ?? true
    const notes: string | null = body.notes ?? null

    if (!/^\d+\.\d+\.\d+$/.test(version)) {
      return new Response("Invalid version format (expect e.g. 10.11.6)", { status: 400 })
    }

    const objectPath = `themes/jellyfin-web-${version}/mnky-media/mnky.css`
    const latestPath = `themes/latest/mnky-media/mnky.css`

    const canonical = `${timestamp}.${version}.${sha256}.${objectPath}`
    const expected = await hmacSha256Hex(PUBLISH_SECRET, canonical)
    if (!timingSafeEqual(expected, signature)) {
      return new Response("Invalid signature", { status: 401 })
    }

    const cssBytes = Uint8Array.from(atob(cssBase64), (c) => c.charCodeAt(0))
    const digest = await crypto.subtle.digest("SHA-256", cssBytes)
    const digestHex = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
    if (digestHex.toLowerCase() !== sha256.toLowerCase()) {
      return new Response("SHA256 mismatch", { status: 400 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { error: upErr } = await supabase.storage.from(BUCKET).upload(objectPath, cssBytes, {
      contentType: "text/css; charset=utf-8",
      upsert: true,
      cacheControl: "3600",
    })
    if (upErr) {
      return new Response(`Upload failed: ${upErr.message}`, { status: 500 })
    }

    if (setLatest) {
      const { error: latestErr } = await supabase.storage.from(BUCKET).upload(latestPath, cssBytes, {
        contentType: "text/css; charset=utf-8",
        upsert: true,
        cacheControl: "60",
      })
      if (latestErr) {
        return new Response(`Latest upload failed: ${latestErr.message}`, { status: 500 })
      }
    }

    const { error: dbErr } = await supabase.from("jellyfin_theme_builds").upsert({
      version,
      css_object_path: objectPath,
      sha256,
      notes,
    })
    if (dbErr) {
      return new Response(`DB upsert failed: ${dbErr.message}`, { status: 500 })
    }

    if (setLatest) {
      const { error: latErr } = await supabase
        .from("jellyfin_theme_latest")
        .upsert({ id: 1, version, updated_at: new Date().toISOString() })
      if (latErr) {
        return new Response(`Latest DB update failed: ${latErr.message}`, { status: 500 })
      }
    }

    return new Response(
      JSON.stringify({ ok: true, version, objectPath, latestPath: setLatest ? latestPath : null }),
      { status: 200, headers: { "content-type": "application/json" } },
    )
  } catch (e) {
    return new Response(`Error: ${(e as Error).message}`, { status: 500 })
  }
})
