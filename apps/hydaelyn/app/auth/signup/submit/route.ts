import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = formData.get("email") as string | null;
  const password = formData.get("password") as string | null;
  const redirectTo = (formData.get("redirect") as string | null) || "/dashboard";

  if (!email || !password) {
    return NextResponse.redirect(
      new URL("/auth/signup?error=missing_email_or_password", request.url),
      302,
    );
  }

  if (password.length < 6) {
    return NextResponse.redirect(
      new URL(
        "/auth/signup?error=Password must be at least 6 characters",
        request.url,
      ),
      302,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: new URL("/auth/callback?next=" + encodeURIComponent(redirectTo), request.url).toString(),
    },
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes("already registered") ||
      msg.includes("already exists") ||
      error.message === "A user with this email address has already been registered"
    ) {
      return NextResponse.redirect(
        new URL(
          `/auth/signin?message=${encodeURIComponent("This email is already registered. Sign in below or use Forgot password to reset.")}`,
          request.url,
        ),
        302,
      );
    }
    return NextResponse.redirect(
      new URL(
        `/auth/signup?error=${encodeURIComponent(error.message)}`,
        request.url,
      ),
      302,
    );
  }

  return NextResponse.redirect(
    new URL(
      "/auth/signin?message=Check your email to confirm your account, then sign in.",
      request.url,
    ),
    302,
  );
}
