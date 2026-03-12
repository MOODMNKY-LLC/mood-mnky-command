import { notFound } from "next/navigation";
import { AgentProfilePageClient } from "./agent-profile-page-client";
import { createClient } from "@/lib/supabase/server";
import { isAgentSlug, getFallbackAgentProfile } from "@/lib/agents";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function AgentProfilePage({ params }: PageProps) {
  const { slug } = await params;
  if (!slug || !isAgentSlug(slug)) {
    notFound();
  }

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("agent_profiles")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  const agent = row
    ? {
        id: row.id,
        slug: row.slug,
        display_name: row.display_name,
        blurb: row.blurb,
        image_path: row.image_path,
        openai_model: row.openai_model,
        openai_voice: row.openai_voice,
        system_instructions: row.system_instructions,
        tools: (row.tools ?? []) as string[],
      }
    : {
        ...getFallbackAgentProfile(slug),
        tools: slug === "mood_mnky"
          ? ["fragrance_discovery", "product_recommendations", "verse_navigation"]
          : slug === "sage_mnky"
            ? ["learning_guidance", "wellness_practices", "community_engagement"]
            : ["development_guidance", "api_help", "infrastructure"],
      };

  return <AgentProfilePageClient agent={agent} />;
}
