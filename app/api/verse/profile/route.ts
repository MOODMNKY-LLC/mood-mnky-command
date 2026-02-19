import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET: Returns the current user's profile (preferences, display_name, etc.).
 * Requires authentication.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profileSelect =
    "display_name, full_name, username, handle, website, avatar_url, bio, email, last_sign_in_at, created_at, preferences, shopify_customer_id";
  const { data: profile, error } = await supabase
    .from("profiles")
    .select(profileSelect)
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Verse profile GET error:", error);
    return NextResponse.json(
      { error: "Failed to load profile", preferences: {} },
      { status: 200 }
    );
  }

  return NextResponse.json({
    display_name: profile?.display_name ?? null,
    full_name: profile?.full_name ?? null,
    username: profile?.username ?? null,
    handle: profile?.handle ?? null,
    website: profile?.website ?? null,
    avatar_url: profile?.avatar_url ?? null,
    bio: profile?.bio ?? null,
    email: profile?.email ?? null,
    last_sign_in_at: profile?.last_sign_in_at ?? null,
    created_at: profile?.created_at ?? null,
    preferences: profile?.preferences ?? {},
    shopify_customer_id: profile?.shopify_customer_id ?? null,
  });
}
