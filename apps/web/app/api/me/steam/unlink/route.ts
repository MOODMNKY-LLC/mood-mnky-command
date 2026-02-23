import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const DEFAULT_REDIRECT = "/main/services/mnky-games"

/**
 * POST /api/me/steam/unlink
 * Removes the Steam link for the current user. Redirects to ?next= or referer or mnky-games.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL(DEFAULT_REDIRECT, request.url))
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      steamid64: null,
      steam_linked_at: null,
      steam_profile_cache: null,
    })
    .eq("id", user.id)

  const redirectTo =
    request.nextUrl.searchParams.get("next")?.startsWith("/") ? request.nextUrl.searchParams.get("next")! :
    request.headers.get("referer") ?? new URL(DEFAULT_REDIRECT, request.url).toString()
  const redirectUrl = redirectTo.startsWith("http") ? redirectTo : new URL(redirectTo, request.url).toString()

  if (error) {
    return NextResponse.redirect(`${redirectUrl}?steam=error&message=${encodeURIComponent("Failed to unlink")}`)
  }

  return NextResponse.redirect(`${redirectUrl}?steam=unlinked`)
}
