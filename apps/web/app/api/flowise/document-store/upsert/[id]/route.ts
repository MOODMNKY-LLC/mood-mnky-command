/**
 * POST /api/flowise/document-store/upsert/[id]
 * Proxies to Flowise document store upsert (multipart/form-data). Uses current user's API key if set.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFlowiseBaseUrl, getFlowiseAuthHeaders } from "@/lib/flowise/client";
import { decryptFlowiseApiKey } from "@/lib/flowise/profile-api-key";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Store id required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("flowise_api_key_encrypted")
    .eq("id", user.id)
    .single();

  let userApiKey: string | null = null;
  if (profile?.flowise_api_key_encrypted) {
    try {
      userApiKey = decryptFlowiseApiKey(profile.flowise_api_key_encrypted);
    } catch {
      // use system key
    }
  }

  const baseUrl = getFlowiseBaseUrl().replace(/\/$/, "");
  const url = `${baseUrl}/api/v1/document-store/upsert/${id}`;
  const headers = getFlowiseAuthHeaders(userApiKey);
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...headers,
        // do not set Content-Type; fetch will set boundary for FormData
      },
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string })?.message ?? "Upsert failed" },
        { status: res.status },
      );
    }
    return NextResponse.json(data);
  }

  return NextResponse.json(
    { error: "Content-Type must be multipart/form-data with files" },
    { status: 400 },
  );
}
