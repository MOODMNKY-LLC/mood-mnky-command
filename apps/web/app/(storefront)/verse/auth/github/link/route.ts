import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /verse/auth/github/link
 * Links GitHub identity to the current logged-in user (MNKY VERSE).
 * Redirects to Supabase OAuth; callback returns to Verse profile.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const origin = request.nextUrl.origin;
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent("Sign in first to link GitHub")}`
    );
  }

  const origin = request.nextUrl.origin;
  const callbackUrl = `${origin}/verse/auth/callback?next=/dojo/profile`;

  const { data, error } = await supabase.auth.linkIdentity({
    provider: "github",
    options: {
      redirectTo: callbackUrl,
    },
  });

  if (error) {
    return NextResponse.redirect(
      `${origin}/auth/error?error=${encodeURIComponent(error.message)}`
    );
  }

  if (!data?.url) {
    return NextResponse.redirect(
      `${origin}/auth/error?error=${encodeURIComponent("No OAuth URL returned")}`
    );
  }

  return NextResponse.redirect(data.url);
}
