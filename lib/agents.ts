/**
 * Agent profiles: fetch from Supabase, fallback to verse-blog constants.
 * Used across LABZ admin, VERSE agent pages, chat, and realtime voice.
 */

import {
  AGENT_IMAGE_PATH,
  AGENT_DISPLAY_NAME,
  VERSE_BLOG_AGENTS,
  type VerseBlogAgent,
} from "@/lib/verse-blog";

export type AgentProfile = {
  id: string;
  slug: string;
  display_name: string;
  blurb: string | null;
  image_path: string | null;
  openai_model: string;
  openai_voice: string;
  system_instructions: string | null;
  tools: unknown[];
  eleven_labs_agent_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

/** Static fallback when DB is unavailable (e.g. during dev) */
const FALLBACK_BLURB: Record<VerseBlogAgent, string> = {
  mood_mnky: "Your personal guide through the world of custom fragrances and self-care",
  sage_mnky: "Your mentor and guide through personalized learning experiences",
  code_mnky: "The tech behind the verse—creation and systems.",
};

export function getFallbackAgentProfile(slug: VerseBlogAgent): AgentProfile {
  return {
    id: slug,
    slug,
    display_name: AGENT_DISPLAY_NAME[slug],
    blurb: FALLBACK_BLURB[slug],
    image_path: AGENT_IMAGE_PATH[slug],
    openai_model: "gpt-realtime",
    openai_voice: slug === "mood_mnky" ? "marin" : slug === "sage_mnky" ? "cedar" : "sage",
    system_instructions: null,
    tools: [],
    eleven_labs_agent_id: null,
    sort_order: VERSE_BLOG_AGENTS.indexOf(slug),
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function isAgentSlug(value: string | null): value is VerseBlogAgent {
  return value != null && VERSE_BLOG_AGENTS.includes(value as VerseBlogAgent);
}

export const DEFAULT_AGENT_SLUG: VerseBlogAgent = "mood_mnky";
