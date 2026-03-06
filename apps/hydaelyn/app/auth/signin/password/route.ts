import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = formData.get("email") as string | null;
  const password = formData.get("password") as string | null;
  const redirectTo = (formData.get("redirect") as string | null) || "/dashboard";

  if (!email || !password) {
    return NextResponse.redirect(
      new URL("/auth/signin?error=missing_email_or_password", request.url),
      302,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/auth/signin?error=${encodeURIComponent(error.message)}`,
        request.url,
      ),
      302,
    );
  }

  const url = new URL(redirectTo, request.url);
  return NextResponse.redirect(url.toString(), 302);
}
