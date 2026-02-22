import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET: List active agent_profiles for Main section (public).
 * Returns slug, display_name, blurb, image_path, openai_model, system_instructions for character cards and multi-agent chat.
 * RLS allows anon to SELECT active agents.
 */
export async function GET() {
  const supabase = await createClient()

  const { data: rows, error } = await supabase
    .from("agent_profiles")
    .select("slug, display_name, blurb, image_path, openai_model, system_instructions, tools, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  if (error) {
    console.error("Main agents GET error:", error)
    return NextResponse.json(
      { error: "Failed to load agents", agents: [] },
      { status: 200 }
    )
  }

  const agents = (rows ?? []).map((r) => ({
    slug: r.slug,
    displayName: r.display_name,
    blurb: r.blurb ?? null,
    imagePath: r.image_path ?? "/verse/mood-mnky-3d.png",
    model: r.openai_model ?? null,
    systemInstructions: r.system_instructions ?? null,
    tools: (r.tools ?? []) as string[],
  }))

  return NextResponse.json({ agents })
}
