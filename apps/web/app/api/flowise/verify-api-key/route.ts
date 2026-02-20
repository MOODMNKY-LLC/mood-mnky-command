/**
 * POST /api/flowise/verify-api-key
 * Verifies the current user's stored Flowise API key against Flowise (e.g. GET chatflows).
 * On success, updates flowise_api_key_verified_at. Key is never returned.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptFlowiseApiKey } from "@/lib/flowise/profile-api-key";
import { getFlowiseBaseUrl } from "@/lib/flowise/client";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: profile, error: fetchError } = await admin
    .from("profiles")
    .select("flowise_api_key_encrypted")
    .eq("id", user.id)
    .single();

  if (fetchError || !profile?.flowise_api_key_encrypted) {
    return NextResponse.json(
      { error: "No Flowise API key stored. Save a key first." },
      { status: 400 },
    );
  }

  let apiKey: string;
  try {
    apiKey = decryptFlowiseApiKey(profile.flowise_api_key_encrypted);
  } catch {
    return NextResponse.json(
      { error: "Failed to decrypt stored key. Re-save your key." },
      { status: 500 },
    );
  }

  const baseUrl = getFlowiseBaseUrl().replace(/\/$/, "");
  const url = `${baseUrl}/api/v1/chatflows`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Verification failed. Check your API key and Flowise access." },
      { status: 400 },
    );
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({
      flowise_api_key_verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
