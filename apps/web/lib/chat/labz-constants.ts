/**
 * Shared constants for LABZ chat and CODE MNKY config.
 * Used by app/api/labz/chat/route.ts and app/api/labz/config/route.ts.
 */

export const LABZ_DEFAULT_MODEL = "gpt-4o-mini"

/** Allowed models for LABZ chat; validate body.model and config default_model against this. */
export const LABZ_ALLOWED_MODELS = [
  "gpt-5",
  "gpt-5-mini",
  "gpt-5-nano",
  "gpt-5.1",
  "gpt-5.2",
  "o1",
  "o1-mini",
  "o3",
  "o3-mini",
  "gpt-4o",
  "gpt-4o-mini",
  "gpt-4o-nano",
  "gpt-4-turbo",
] as const

export type LabzAllowedModel = (typeof LABZ_ALLOWED_MODELS)[number]

export function isLabzAllowedModel(id: string): id is LabzAllowedModel {
  return (LABZ_ALLOWED_MODELS as readonly string[]).includes(id)
}

/** Prefixes for model IDs we accept (exact or versioned, e.g. gpt-4o-mini-2024-07-18). */
const LABZ_ALLOWED_MODEL_PREFIXES = [
  "gpt-5",
  "gpt-4o",
  "gpt-4-turbo",
  "o1",
  "o3",
] as const

/**
 * Returns true if the model id is allowed for saving (config) and use in chat.
 * Accepts exact LABZ_ALLOWED_MODELS entries or versioned IDs from the OpenAI API.
 */
export function isLabzAllowedModelOrPrefix(id: string): boolean {
  if (!id || typeof id !== "string") return false
  if (isLabzAllowedModel(id)) return true
  return LABZ_ALLOWED_MODEL_PREFIXES.some((p) => id.startsWith(p))
}

/** Tool keys in labzTools (for tool_overrides). */
export const LABZ_TOOL_KEYS = [
  "list_formulas",
  "list_fragrance_oils",
  "search_glossary",
  "get_labz_pages_summary",
  "notion_sync_status",
  "open_labz_section",
] as const
