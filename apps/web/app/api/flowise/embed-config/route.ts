import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, getSupabaseConfigMissing } from "@/lib/supabase/admin";

const DEFAULT_SCOPE = "dojo";

/**
 * GET /api/flowise/embed-config?scope=dojo
 * Returns embed config for the given scope. Public (no auth).
 * Falls back to env (NEXT_PUBLIC_FLOWISE_CHATFLOW_ID, NEXT_PUBLIC_FLOWISE_HOST) when no row.
 */
export async function GET(request: NextRequest) {
  const scope =
    request.nextUrl.searchParams.get("scope")?.trim() || DEFAULT_SCOPE;

  if (getSupabaseConfigMissing()) {
    return NextResponse.json({
      chatflowId: process.env.NEXT_PUBLIC_FLOWISE_CHATFLOW_ID ?? "",
      apiHost: process.env.NEXT_PUBLIC_FLOWISE_HOST ?? "",
      theme: {},
      chatflowConfig: {},
    });
  }

  const admin = createAdminClient();
  const { data: row, error } = await admin
    .from("flowise_embed_config")
    .select("chatflow_id, api_host, theme, chatflow_config")
    .eq("scope", scope)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  const chatflowId =
    row?.chatflow_id ??
    process.env.NEXT_PUBLIC_FLOWISE_CHATFLOW_ID ??
    "";
  const apiHost =
    row?.api_host ?? process.env.NEXT_PUBLIC_FLOWISE_HOST ?? "";

  const theme = (row?.theme as Record<string, unknown>) ?? {};
  const chatflowConfig = (row?.chatflow_config as Record<string, unknown>) ?? {};

  return NextResponse.json({
    chatflowId,
    apiHost,
    theme,
    chatflowConfig,
  });
}

/**
 * PUT /api/flowise/embed-config
 * Body: { scope?, chatflowId, apiHost, theme?, chatflowConfig? }
 * Requires authenticated admin.
 */
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (getSupabaseConfigMissing()) {
    return NextResponse.json(
      { error: "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 }
    );
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    scope?: string;
    chatflowId?: string;
    apiHost?: string;
    theme?: Record<string, unknown>;
    chatflowConfig?: Record<string, unknown>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const scope = body.scope?.trim() || DEFAULT_SCOPE;
  const chatflowId = body.chatflowId?.trim();
  const apiHost = body.apiHost?.trim();

  if (!chatflowId || !apiHost) {
    return NextResponse.json(
      { error: "chatflowId and apiHost are required" },
      { status: 400 }
    );
  }

  const { error: upsertError } = await admin
    .from("flowise_embed_config")
    .upsert(
      {
        scope,
        chatflow_id: chatflowId,
        api_host: apiHost,
        theme: body.theme ?? {},
        chatflow_config: body.chatflowConfig ?? {},
        updated_at: new Date().toISOString(),
      },
      { onConflict: "scope" }
    );

  if (upsertError) {
    return NextResponse.json(
      { error: upsertError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
