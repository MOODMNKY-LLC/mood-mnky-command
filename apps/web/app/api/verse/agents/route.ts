import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET: List active agent_profiles for VERSE (public read via RLS).
 * Used by /verse/agents, agent selector in chat, etc.
 */
export async function GET() {
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("agent_profiles")
    .select("id, slug, display_name, blurb, image_path, openai_model, openai_voice, tools")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Verse agents GET error:", error);
    return NextResponse.json(
      { error: "Failed to load agents", agents: [] },
      { status: 200 }
    );
  }

  const agents = (rows ?? []).map((r) => ({
    id: r.id,
    slug: r.slug,
    display_name: r.display_name,
    blurb: r.blurb,
    image_path: r.image_path,
    openai_model: r.openai_model,
    openai_voice: r.openai_voice,
    tools: r.tools ?? [],
  }));

  return NextResponse.json({ agents });
}
