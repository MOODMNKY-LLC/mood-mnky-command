import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { buildSteamOpenIdUrl } from "@/lib/steam"
import { cookies } from "next/headers"
import crypto from "crypto"

const STEAM_STATE_COOKIE = "steam_link_state"
const STEAM_STATE_MAX_AGE = 600 // 10 minutes

/**
 * GET /api/auth/steam/link
 * Starts Steam OpenID 2.0 link flow. Requires authenticated user.
 * When STEAM_RETURN_URL and STEAM_REALM are set, use them (e.g. pin to mnky-verse); otherwise use request origin.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const origin = request.nextUrl.origin
  const returnPath = "/main/services/mnky-games"

  if (!user) {
    return NextResponse.redirect(
      `${origin}/auth/login?redirectTo=${encodeURIComponent(origin + returnPath)}&error=${encodeURIComponent("Sign in first to link Steam")}`
    )
  }

  const state = crypto.randomBytes(24).toString("hex")
  const callbackBase = process.env.STEAM_RETURN_URL?.replace(/\/$/, "") ?? `${origin}/api/auth/steam/callback`
  const realm = process.env.STEAM_REALM
    ? (process.env.STEAM_REALM.endsWith("/") ? process.env.STEAM_REALM : `${process.env.STEAM_REALM}/`)
    : `${origin}/`

  const cookieStore = await cookies()
  cookieStore.set(STEAM_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: STEAM_STATE_MAX_AGE,
    path: "/",
  })

  const returnTo = callbackBase.includes("?")
    ? `${callbackBase}&state=${encodeURIComponent(state)}`
    : `${callbackBase}?state=${encodeURIComponent(state)}`
  const steamAuthUrl = buildSteamOpenIdUrl(returnTo, realm)

  return NextResponse.redirect(steamAuthUrl)
}
