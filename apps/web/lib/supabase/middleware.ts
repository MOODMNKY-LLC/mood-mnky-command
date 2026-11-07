import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { hasSupabaseAnonConfig } from "@/lib/supabase/config"
import {
  resolveMissingConfigAccess,
  resolveSessionAccess,
  type SessionProfile,
} from "@/lib/auth/access-decision"

export type UpdateSessionOptions = {
  /** When set, path-based checks use this instead of request.nextUrl.pathname (for host-based rewrite). */
  effectivePathname?: string
}

export async function updateSession(
  request: NextRequest,
  options?: UpdateSessionOptions
) {
  let supabaseResponse = NextResponse.next({ request })

  const pathname =
    (options?.effectivePathname as string | undefined) ??
    request.nextUrl.pathname

  // Fail CLOSED for protected Dojo/LABZ/member/API when anon config is missing.
  // Public Main / auth UI / embeds / illustrative /review/* may still render.
  if (!hasSupabaseAnonConfig()) {
    console.error(
      "[Supabase] Missing env vars. Add .env.local at the monorepo root with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. pnpm dev loads it via dotenv-cli. See .env.example."
    )
    const decision = resolveMissingConfigAccess(pathname)
    if (decision.type === "unavailable") {
      return NextResponse.json(
        {
          error: "auth_backend_unavailable",
          message:
            "Supabase anon configuration is missing. Protected APIs are unavailable.",
        },
        { status: decision.status },
      )
    }
    if (decision.type === "redirect") {
      const url = request.nextUrl.clone()
      url.pathname = decision.pathname
      if (decision.pathname === "/auth/login" && pathname.startsWith("/")) {
        url.searchParams.set("next", pathname)
      }
      return NextResponse.redirect(url)
    }
    return NextResponse.next({ request })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
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

  let profile: SessionProfile | null = null
  if (user) {
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
        // Fall through
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
  }

  const decision = resolveSessionAccess({
    pathname,
    hasUser: Boolean(user),
    profile,
  })

  if (decision.type === "redirect") {
    const url = request.nextUrl.clone()
    url.pathname = decision.pathname
    if (decision.pathname === "/auth/login" && pathname.startsWith("/")) {
      url.searchParams.set("next", pathname)
    }
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
