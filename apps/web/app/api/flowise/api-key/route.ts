/**
 * POST /api/flowise/api-key
 * Body: { apiKey: string }
 * Saves encrypted Flowise API key to current user's profile. Higher-tier (user/moderator/admin) only.
 * Key is never returned in response.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptFlowiseApiKey } from "@/lib/flowise/profile-api-key";

const ALLOWED_ROLES = ["admin", "moderator", "user"];

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
    return NextResponse.json(
      { error: "Flowise API key is only available for approved accounts." },
      { status: 403 },
    );
  }

  let body: { apiKey?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
  if (!rawKey) {
    return NextResponse.json(
      { error: "apiKey is required" },
      { status: 400 },
    );
  }

  let encrypted: string;
  try {
    encrypted = encryptFlowiseApiKey(rawKey);
  } catch (e) {
    return NextResponse.json(
      { error: "Encryption not configured. Set FLOWISE_KEY_ENCRYPTION_SECRET." },
      { status: 503 },
    );
  }

  const { error } = await admin
    .from("profiles")
    .update({
      flowise_api_key_encrypted: encrypted,
      flowise_api_key_verified_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
