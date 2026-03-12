import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { parseSteamId64FromClaimedId, fetchSteamProfile } from "@/lib/steam"
import { cookies } from "next/headers"
// eslint-disable-next-line @typescript-eslint/no-require-imports
const openid = require("openid")

const STEAM_STATE_COOKIE = "steam_link_state"
const DEFAULT_RETURN_PATH = "/main/services/mnky-games"

/**
 * GET /api/auth/steam/callback
 * Steam OpenID 2.0 callback. Verifies assertion, stores steamid64 and profile cache, redirects to mnky-games.
 */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin
  const returnPath = request.nextUrl.searchParams.get("next") ?? DEFAULT_RETURN_PATH
  const targetUrl = `${origin}${returnPath.startsWith("/") ? returnPath : `/${returnPath}`}`

  const stateFromQuery = request.nextUrl.searchParams.get("state")
  const cookieStore = await cookies()
  const stateFromCookie = cookieStore.get(STEAM_STATE_COOKIE)?.value

  function clearStateCookie(res: NextResponse) {
    res.cookies.set(STEAM_STATE_COOKIE, "", { path: "/", maxAge: 0 })
    return res
  }

  if (!stateFromQuery || !stateFromCookie || stateFromQuery !== stateFromCookie) {
    return clearStateCookie(NextResponse.redirect(
      `${targetUrl}?steam=error&message=${encodeURIComponent("Invalid or expired state")}`
    ))
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return clearStateCookie(NextResponse.redirect(
      `${targetUrl}?steam=error&message=${encodeURIComponent("Sign in to link Steam")}`
    ))
  }

  const callbackBase = process.env.STEAM_RETURN_URL?.replace(/\/$/, "") ?? `${origin}/api/auth/steam/callback`
  const returnUrl = callbackBase.includes("?")
    ? `${callbackBase}&state=${encodeURIComponent(stateFromQuery)}`
    : `${callbackBase}?state=${encodeURIComponent(stateFromQuery)}`
  const realm = process.env.STEAM_REALM
    ? (process.env.STEAM_REALM.endsWith("/") ? process.env.STEAM_REALM : `${process.env.STEAM_REALM}/`)
    : `${origin}/`
  const relyingParty = new openid.RelyingParty(returnUrl, realm, false, false, [])

  const assertionUrl = request.url
  const verifyResult = await new Promise<{ error: Error | null; result: { authenticated?: boolean; claimedIdentifier?: string } | null }>((resolve) => {
    relyingParty.verifyAssertion(assertionUrl, (err: Error | null, result: { authenticated?: boolean; claimedIdentifier?: string } | null) => {
      resolve({ error: err, result: result ?? null })
    })
  })

  if (verifyResult.error || !verifyResult.result?.authenticated) {
    return clearStateCookie(NextResponse.redirect(
      `${targetUrl}?steam=error&message=${encodeURIComponent(verifyResult.error?.message ?? "Steam verification failed")}`
    ))
  }

  const claimedId = verifyResult.result.claimedIdentifier ?? null
  const steamid64 = parseSteamId64FromClaimedId(claimedId)
  if (!steamid64) {
    return clearStateCookie(NextResponse.redirect(
      `${targetUrl}?steam=error&message=${encodeURIComponent("Invalid Steam response")}`
    ))
  }

  const profileCache = await fetchSteamProfile(steamid64)

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      steamid64,
      steam_linked_at: new Date().toISOString(),
      steam_profile_cache: profileCache ?? undefined,
    })
    .eq("id", user.id)

  if (updateError) {
    return clearStateCookie(NextResponse.redirect(
      `${targetUrl}?steam=error&message=${encodeURIComponent("Could not save Steam link")}`
    ))
  }

  return clearStateCookie(NextResponse.redirect(`${targetUrl}?steam=linked`))
}
