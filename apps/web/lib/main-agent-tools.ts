/**
 * Registry of agent tool ids to display name and use-case description.
 * Used on Main landing for agent cards (tooltips). Keys align with env integrations
 * and chat/labz tool names (snake_case).
 */
export type MainAgentToolDef = {
  name: string
  description: string
}

export const MAIN_AGENT_TOOLS: Record<string, MainAgentToolDef> = {
  web_search: {
    name: "Web Search",
    description: "Search the web for up-to-date information and sources.",
  },
  search_formulas: {
    name: "Search Formulas",
    description: "Find candle and skincare formulas by name or ingredients.",
  },
  search_fragrance_oils: {
    name: "Fragrance Oil Search",
    description: "Search the fragrance catalog by name, family, or notes.",
  },
  generate_image: {
    name: "Image Generation",
    description: "Create images with OpenAI for scenes or product concepts.",
  },
  get_fragrance_oil_by_id: {
    name: "Fragrance Details",
    description: "Fetch full details for a specific fragrance oil.",
  },
  calculate_blend_proportions: {
    name: "Blend Calculator",
    description: "Calculate proportions for custom fragrance blends.",
  },
  calculate_wax_for_vessel: {
    name: "Wax Calculator",
    description: "Compute wax amounts for candle vessels.",
  },
  list_containers: {
    name: "Containers",
    description: "List available candle containers and specs.",
  },
  show_blend_suggestions: {
    name: "Blend Suggestions",
    description: "Suggest complementary oils and blend ideas.",
  },
  show_product_picker: {
    name: "Product Picker",
    description: "Browse and select VERSE products.",
  },
  show_personalization_form: {
    name: "Personalization",
    description: "Capture customization options for orders.",
  },
  save_custom_blend: {
    name: "Save Blend",
    description: "Save a custom blend to the user's account.",
  },
  list_saved_blends: {
    name: "Saved Blends",
    description: "List the user's saved fragrance blends.",
  },
  get_saved_blend: {
    name: "Load Blend",
    description: "Load a saved blend by ID.",
  },
  show_intake_form: {
    name: "Intake Form",
    description: "Show funnel or intake forms.",
  },
  get_latest_funnel_submission: {
    name: "Funnel Data",
    description: "Retrieve latest funnel submission for context.",
  },
  list_formulas: {
    name: "List Formulas",
    description: "List formulas from the lab catalog.",
  },
  list_fragrance_oils: {
    name: "List Oils",
    description: "List fragrance oils from the catalog.",
  },
  search_glossary: {
    name: "Glossary",
    description: "Search the fragrance glossary and notes.",
  },
  get_labz_pages_summary: {
    name: "MNKY LABZ Pages",
    description: "Get a summary of MNKY LABZ dashboard pages.",
  },
  notion_sync_status: {
    name: "Notion Sync",
    description: "Check Notion sync status for content.",
  },
  open_labz_section: {
    name: "Open MNKY LABZ",
    description: "Open a specific MNKY LABZ dashboard section.",
  },
  flowise: {
    name: "Flowise",
    description: "Run custom workflows and chatflows (e.g. Blending Lab).",
  },
  n8n: {
    name: "n8n",
    description: "Trigger automations and batch workflows.",
  },
  discord: {
    name: "Discord",
    description: "Connect to MNKY VERSE community and announcements.",
  },
  supabase: {
    name: "Supabase",
    description: "Query and manage app data securely.",
  },
  s3_storage: {
    name: "S3 Storage",
    description: "Access and manage stored assets and documents.",
  },
  music: {
    name: "Music",
    description: "Play and manage MNKY VERSE tracks and playlists.",
  },
  eleven_labs: {
    name: "Voice",
    description: "Real-time voice conversation with ElevenLabs.",
  },
}

export function getAgentToolDef(toolId: string): MainAgentToolDef | null {
  const key = typeof toolId === "string" ? toolId.trim().toLowerCase() : ""
  return MAIN_AGENT_TOOLS[key] ?? null
}

export function getAgentToolDisplay(toolId: string): string {
  const def = getAgentToolDef(toolId)
  return def?.name ?? toolId.replace(/_/g, " ")
}
