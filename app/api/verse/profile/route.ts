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

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("display_name, preferences")
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
    display_name: profile?.display_name,
    preferences: profile?.preferences ?? {},
  });
}
