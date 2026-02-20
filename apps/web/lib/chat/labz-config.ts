import { createClient } from "@/lib/supabase/server"
import { LABZ_SYSTEM_PROMPT } from "@/lib/chat/labz-system-prompt"
import { LABZ_DEFAULT_MODEL } from "@/lib/chat/labz-constants"

export interface LabzConfig {
  default_model: string
  system_prompt_override: string | null
  tool_overrides: Record<string, boolean> | null
}

const CONFIG_KEYS = ["default_model", "system_prompt_override", "tool_overrides"] as const

/**
 * Read CODE MNKY config from Supabase and merge with code fallbacks.
 * Use in API routes and chat route (server-only).
 */
export async function getLabzConfig(): Promise<LabzConfig> {
  const supabase = await createClient()
  const { data: rows } = await supabase
    .from("code_mnky_config")
    .select("key, value")
    .in("key", CONFIG_KEYS)

  const map = new Map<string, string>()
  for (const row of rows ?? []) {
    map.set(row.key, row.value ?? "")
  }

  let tool_overrides: Record<string, boolean> | null = null
  const rawOverrides = map.get("tool_overrides")
  if (rawOverrides) {
    try {
      const parsed = JSON.parse(rawOverrides) as unknown
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        tool_overrides = parsed as Record<string, boolean>
      }
    } catch {
      // ignore invalid JSON
    }
  }

  return {
    default_model: map.get("default_model")?.trim() || process.env.LABZ_CHAT_MODEL || LABZ_DEFAULT_MODEL,
    system_prompt_override: map.get("system_prompt_override")?.trim() || null,
    tool_overrides,
  }
}

/**
 * Resolve the system prompt to use: override from DB or code default.
 */
export function resolveSystemPrompt(config: LabzConfig): string {
  return config.system_prompt_override ?? LABZ_SYSTEM_PROMPT
}
