import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = formData.get("email") as string | null;
  const redirectTo = formData.get("redirect") as string | null;

  if (!email) {
    return NextResponse.redirect(
      new URL("/auth/signin?error=missing_email", request.url),
      302,
    );
  }

  const origin = new URL(request.url).origin;
  const callbackUrl = `${origin}/auth/callback?next=${encodeURIComponent(redirectTo || "/dashboard")}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: callbackUrl,
    },
  });

  if (error) {
    return NextResponse.redirect(
      new URL(`/auth/signin?error=${encodeURIComponent(error.message)}`, request.url),
      302,
    );
  }

  return NextResponse.redirect(
    new URL(
      "/auth/signin?message=Check your email for the magic link",
      request.url,
    ),
    302,
  );
}
