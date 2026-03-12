import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import {
  exchangeCodeForTokens,
  fetchFFLogsUser,
} from "@/lib/fflogs/client";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const COOKIE_NAME = "fflogs_oauth";

type CookiePayload = {
  state: string;
  codeVerifier: string;
  intent: "link" | "signin";
};

function parseCookie(cookieValue: string | undefined): CookiePayload | null {
  if (!cookieValue) return null;
  try {
    const decoded = Buffer.from(cookieValue, "base64url").toString("utf-8");
    const parsed = JSON.parse(decoded) as CookiePayload;
    if (parsed.state && parsed.codeVerifier && parsed.intent) return parsed;
  } catch {
    // ignore
  }
  return null;
}

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const callbackUrl = `${origin}/auth/fflogs/callback`;
  const errorRedirect = (msg: string) =>
    NextResponse.redirect(
      `${origin}/auth/signin?error=${encodeURIComponent(msg)}`,
    );
  const dashboardRedirect = NextResponse.redirect(`${origin}/dashboard`);

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const errorParam = request.nextUrl.searchParams.get("error");

  if (errorParam) {
    return errorRedirect(errorParam);
  }
  if (!code || !state) {
    return errorRedirect("Missing code or state from FFLogs");
  }

  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(COOKIE_NAME)?.value;
  const payload = parseCookie(cookieValue);
  if (!payload || payload.state !== state) {
    return errorRedirect("Invalid or expired state. Try again.");
  }

  const { codeVerifier, intent } = payload;

  // Clear the cookie
  const clearCookie = (res: NextResponse) => {
    res.cookies.set(COOKIE_NAME, "", {
      path: "/",
      maxAge: 0,
    });
    return res;
  };

  let tokens: Awaited<ReturnType<typeof exchangeCodeForTokens>>;
  try {
    tokens = await exchangeCodeForTokens(code, callbackUrl, codeVerifier);
  } catch (e) {
    return clearCookie(
      errorRedirect(e instanceof Error ? e.message : "Token exchange failed"),
    );
  }

  let fflogsUser: Awaited<ReturnType<typeof fetchFFLogsUser>>;
  try {
    fflogsUser = await fetchFFLogsUser(tokens.access_token);
  } catch (e) {
    return clearCookie(
      errorRedirect(e instanceof Error ? e.message : "Failed to fetch FFLogs user"),
    );
  }

  const fflogsUserId = String(fflogsUser.id);
  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : new Date(Date.now() + 3600 * 1000).toISOString();

  if (intent === "link") {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return clearCookie(
        NextResponse.redirect(
          `${origin}/auth/signin?error=${encodeURIComponent("Sign in first to link FFLogs")}`,
        ),
      );
    }
    const { error } = await supabase.from("user_fflogs_tokens").upsert(
      {
        profile_id: user.id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        expires_at: expiresAt,
        fflogs_user_id: fflogsUserId,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "profile_id",
      },
    );
    if (error) {
      return clearCookie(errorRedirect(error.message));
    }
    return clearCookie(
      NextResponse.redirect(
        `${origin}/dashboard?message=${encodeURIComponent("FFLogs account linked.")}`,
      ),
    );
  }

  // intent === "signin"
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("user_fflogs_tokens")
    .select("profile_id")
    .eq("fflogs_user_id", fflogsUserId)
    .maybeSingle();

  let profileId: string;
  if (existing?.profile_id) {
    profileId = existing.profile_id;
  } else {
    const syntheticEmail = `fflogs-${fflogsUserId}@hydaelyn.local`;
    const { data: newUser, error: createError } =
      await admin.auth.admin.createUser({
        email: syntheticEmail,
        password: crypto.randomUUID(),
        email_confirm: true,
      });
    if (createError || !newUser.user) {
      return clearCookie(
        errorRedirect(
          createError?.message ?? "Failed to create account. Try signing in with email first.",
        ),
      );
    }
    profileId = newUser.user.id;
    await admin.from("user_fflogs_tokens").insert({
      profile_id: profileId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      expires_at: expiresAt,
      fflogs_user_id: fflogsUserId,
    });
  }

  const { data: userById } = await admin.auth.admin.getUserById(profileId);
  const email =
    userById?.user?.email ?? `fflogs-${fflogsUserId}@hydaelyn.local`;

  const { data: linkData, error: linkError } =
    await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo: `${origin}/dashboard` },
    });

  const redirectUrl = (linkData?.properties as { action_link?: string } | undefined)
    ?.action_link;

  if (linkError || !redirectUrl) {
    return clearCookie(
      errorRedirect(
        linkError?.message ?? "Could not sign you in. Try again.",
      ),
    );
  }

  return clearCookie(NextResponse.redirect(redirectUrl));
}
