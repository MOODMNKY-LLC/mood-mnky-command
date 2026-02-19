import { updateSession } from "@/lib/supabase/middleware"
import { type NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Exclude static assets and PWA; exclude OAuth routes so session middleware doesn't interfere (guild-mnky pattern).
    // OAuth init: /auth/github, /verse/auth/discord set PKCE cookie and redirect.
    // OAuth callback: /auth/callback, /verse/auth/callback run exchangeCodeForSession and set session cookies.
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.webmanifest|auth/callback|verse/auth/callback|auth/github|verse/auth/discord|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
