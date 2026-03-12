/**
 * GET /api/flowise/user-document-store?scope=dojo
 * Returns the current user's assigned Flowise document store for the given scope (from flowise_user_document_stores).
 *
 * POST /api/flowise/user-document-store
 * Admin only. Assign or create a document store for a user.
 * Body: { profile_id: string, scope?: string, display_name?: string, flowise_store_id?: string }
 * - If flowise_store_id: assign existing store to profile (upsert by profile_id + scope).
 * - If no flowise_store_id: create new store in Flowise (name/description from display_name), then insert row.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { flowiseFetch } from "@/lib/flowise/client";

const DEFAULT_SCOPE = "dojo";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scope = request.nextUrl.searchParams.get("scope")?.trim() || DEFAULT_SCOPE;
  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("flowise_user_document_stores")
    .select("flowise_store_id, display_name")
    .eq("profile_id", user.id)
    .eq("scope", scope)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!row) {
    return NextResponse.json({ storeId: null, displayName: null });
  }
  return NextResponse.json({
    storeId: row.flowise_store_id,
    displayName: row.display_name ?? undefined,
  });
}

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
    .select("role, is_admin")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin" || profile?.is_admin === true;
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    profile_id?: string;
    scope?: string;
    display_name?: string;
    flowise_store_id?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const profileId = body.profile_id?.trim();
  if (!profileId) {
    return NextResponse.json(
      { error: "profile_id is required" },
      { status: 400 },
    );
  }
  const scope = body.scope?.trim() || DEFAULT_SCOPE;
  const displayName = body.display_name?.trim() ?? undefined;
  const flowiseStoreId = body.flowise_store_id?.trim();

  let storeId = flowiseStoreId;

  if (!storeId) {
    const name = displayName || `Dojo store ${scope} ${profileId.slice(0, 8)}`;
    const createRes = await flowiseFetch("document-store/store", {
      method: "POST",
      body: { name, description: `User document store for ${scope}` },
    });
    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: (err as { message?: string })?.message ?? "Failed to create Flowise document store",
        },
        { status: createRes.status },
      );
    }
    const created = (await createRes.json()) as { id?: string };
    storeId = created.id;
    if (!storeId) {
      return NextResponse.json(
        { error: "Flowise did not return store id" },
        { status: 502 },
      );
    }
  }

  const { error: upsertError } = await admin
    .from("flowise_user_document_stores")
    .upsert(
    {
      profile_id: profileId,
      scope,
      flowise_store_id: storeId,
      display_name: displayName ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "profile_id,scope" },
  );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, storeId });
}
