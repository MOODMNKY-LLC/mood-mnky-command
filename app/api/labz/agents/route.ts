import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET: List all agent_profiles (admin sees all; anon gets active only via RLS on public read).
 * Admin uses service client for list; Verse uses public client with RLS.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();

  const { data: profile } = user
    ? await admin
        .from("profiles")
        .select("role, is_admin")
        .eq("id", user.id)
        .single()
    : { data: null };

  const isAdmin = profile?.role === "admin" || profile?.is_admin === true;

  const { data: rows, error } = await admin
    .from("agent_profiles")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Labz agents GET error:", error);
    return NextResponse.json({ error: "Failed to load agents" }, { status: 500 });
  }

  const agents = (rows ?? []).map((r) => ({
    id: r.id,
    slug: r.slug,
    display_name: r.display_name,
    blurb: r.blurb,
    image_path: r.image_path,
    openai_model: r.openai_model,
    openai_voice: r.openai_voice,
    system_instructions: r.system_instructions,
    tools: r.tools ?? [],
    eleven_labs_agent_id: r.eleven_labs_agent_id,
    sort_order: r.sort_order,
    is_active: r.is_active ?? true,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));

  return NextResponse.json({
    agents,
    isAdmin,
  });
}

/**
 * PATCH: Update agent profile (admin only).
 * Body: { slug, display_name?, blurb?, image_path?, openai_model?, openai_voice?, system_instructions?, tools?, eleven_labs_agent_id?, sort_order?, is_active? }
 */
export async function PATCH(request: NextRequest) {
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
    slug: string;
    display_name?: string;
    blurb?: string;
    image_path?: string;
    openai_model?: string;
    openai_voice?: string;
    system_instructions?: string;
    tools?: unknown[];
    eleven_labs_agent_id?: string | null;
    sort_order?: number;
    is_active?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { slug, ...updates } = body;
  if (!slug?.trim()) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  const dbUpdates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (updates.display_name !== undefined) dbUpdates.display_name = updates.display_name;
  if (updates.blurb !== undefined) dbUpdates.blurb = updates.blurb;
  if (updates.image_path !== undefined) dbUpdates.image_path = updates.image_path;
  if (updates.openai_model !== undefined) dbUpdates.openai_model = updates.openai_model;
  if (updates.openai_voice !== undefined) dbUpdates.openai_voice = updates.openai_voice;
  if (updates.system_instructions !== undefined)
    dbUpdates.system_instructions = updates.system_instructions;
  if (updates.tools !== undefined) dbUpdates.tools = updates.tools;
  if (Object.prototype.hasOwnProperty.call(updates, "eleven_labs_agent_id"))
    dbUpdates.eleven_labs_agent_id = updates.eleven_labs_agent_id;
  if (updates.sort_order !== undefined) dbUpdates.sort_order = updates.sort_order;
  if (updates.is_active !== undefined) dbUpdates.is_active = updates.is_active;

  const { data, error } = await admin
    .from("agent_profiles")
    .update(dbUpdates)
    .eq("slug", slug.trim())
    .select()
    .single();

  if (error) {
    console.error("Labz agents PATCH error:", error);
    return NextResponse.json({ error: "Failed to update agent" }, { status: 500 });
  }

  return NextResponse.json({
    agent: {
      id: data.id,
      slug: data.slug,
      display_name: data.display_name,
      blurb: data.blurb,
      image_path: data.image_path,
      openai_model: data.openai_model,
      openai_voice: data.openai_voice,
      system_instructions: data.system_instructions,
      tools: data.tools ?? [],
      eleven_labs_agent_id: data.eleven_labs_agent_id,
      sort_order: data.sort_order,
      is_active: data.is_active,
      created_at: data.created_at,
      updated_at: data.updated_at,
    },
  });
}
