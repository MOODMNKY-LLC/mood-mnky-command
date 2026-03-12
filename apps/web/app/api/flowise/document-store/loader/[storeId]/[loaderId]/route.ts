/**
 * DELETE /api/flowise/document-store/loader/[storeId]/[loaderId]
 * Proxies to Flowise delete document loader and associated chunks.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { flowiseFetch } from "@/lib/flowise/client";
import { decryptFlowiseApiKey } from "@/lib/flowise/profile-api-key";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ storeId: string; loaderId: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { storeId, loaderId } = await params;
  if (!storeId || !loaderId) {
    return NextResponse.json(
      { error: "storeId and loaderId required" },
      { status: 400 },
    );
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

  const res = await flowiseFetch(
    `document-store/loader/${storeId}/${loaderId}`,
    { method: "DELETE" },
    userApiKey,
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: (data as { message?: string })?.message ?? "Delete failed" },
      { status: res.status },
    );
  }
  return new NextResponse(null, { status: 204 });
}
