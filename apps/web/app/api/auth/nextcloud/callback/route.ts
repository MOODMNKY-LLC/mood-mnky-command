import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/auth/nextcloud/callback
 * Nextcloud OAuth2 redirect target. Register this URL in Nextcloud Admin → Security → OAuth2
 * as the "Redirection URL" for the MNKY Command app (e.g. https://mnky-command.moodmnky.com/api/auth/nextcloud/callback).
 *
 * For client_credentials-only use (server-side status), Nextcloud still requires a redirect URI at registration;
 * this route makes the URI valid. Redirects the user to the MNKY CLOUD service page.
 *
 * Future: If "Connect Nextcloud" (authorization code flow) is implemented, exchange the code for tokens
 * here and store them linked to the Supabase user (e.g. profiles or linked_accounts).
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl
  const _code = url.searchParams.get("code")
  const _state = url.searchParams.get("state")

  const forwardedHost = request.headers.get("x-forwarded-host")
  const isLocalEnv = process.env.NODE_ENV === "development"
  const origin = request.nextUrl.origin
  const redirectBase =
    isLocalEnv || !forwardedHost ? origin : `https://${forwardedHost}`

  const targetPath = "/main/services/mnky-cloud"
  return NextResponse.redirect(`${redirectBase}${targetPath}`)
}
