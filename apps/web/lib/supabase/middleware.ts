import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export type UpdateSessionOptions = {
  /** When set, path-based checks use this instead of request.nextUrl.pathname (for host-based rewrite). */
  effectivePathname?: string
}

export async function updateSession(
  request: NextRequest,
  options?: UpdateSessionOptions
) {
  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      "[Supabase] Missing env vars. Add .env.local at the monorepo root with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. pnpm dev loads it via dotenv-cli. See .env.example."
    )
    throw new Error(
      "Supabase URL and Key required. Put .env.local at the monorepo root with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. See https://supabase.com/dashboard/project/_/settings/api"
    )
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If accessing dashboard routes without auth, redirect to login
  // Allow /auth, /api, /verse/auth (Discord OAuth), public Verse store-embed routes, and all /main (public marketing site)
  const pathname =
    (options?.effectivePathname as string | undefined) ??
    request.nextUrl.pathname
  const isAuthRoute = pathname.startsWith("/auth")
  const isApiRoute = pathname.startsWith("/api")
  const isVerseAuthRoute = pathname.startsWith("/verse/auth")
  const isMainRoute = pathname.startsWith("/main")
  const publicVersePaths = [
    "/verse/fragrance-wheel",
    "/verse/blending-guide",
    "/verse/glossary",
    "/verse/formulas",
    "/verse/fragrance-oils",
  ]
  const isPublicVerseRoute = publicVersePaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  )
  if (
    !user &&
    !isAuthRoute &&
    !isApiRoute &&
    !isVerseAuthRoute &&
    !isPublicVerseRoute &&
    !isMainRoute
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // If authenticated, check role and redirect pending users; non-admins to /verse
  if (user) {
    const isVerseRoute = pathname.startsWith("/verse")
    const isDojoRoute = pathname.startsWith("/dojo")
    const isMemberRoute = isVerseRoute || isDojoRoute

    if (!isAuthRoute && !isApiRoute) {
      // Use admin client for reliable profile lookup (bypasses RLS/Edge quirks).
      // Fall back to session client if service role isn't configured.
      let profile: { role?: string; is_admin?: boolean } | null = null
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const admin = createAdminClient()
          const { data } = await admin
            .from("profiles")
            .select("role, is_admin")
            .eq("id", user.id)
            .single()
          profile = data
        } catch {
          // Fall through to session-based fetch
        }
      }
      if (profile == null) {
        const { data } = await supabase
          .from("profiles")
          .select("role, is_admin")
          .eq("id", user.id)
          .single()
        profile = data
      }

      if (profile?.role === "pending") {
        const url = request.nextUrl.clone()
        url.pathname = "/auth/pending-approval"
        return NextResponse.redirect(url)
      }

      // Non-admin users: redirect dashboard paths to /verse (allow /dojo as member route)
      const isAdmin = profile?.role === "admin" || profile?.is_admin === true
      if (!isAdmin && !isMemberRoute) {
        const url = request.nextUrl.clone()
        url.pathname = "/verse"
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}
