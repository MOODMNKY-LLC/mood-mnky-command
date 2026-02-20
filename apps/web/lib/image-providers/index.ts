import type { ImageProvider } from "./types"
import { openaiProvider } from "./openai-provider"

export type { ImageProvider, ImageProviderId, GenerateOptions, EditOptions } from "./types"
export { openaiProvider }

/**
 * Get image provider. Always returns OpenAI (only supported provider).
 */
export function getImageProvider(): ImageProvider {
  return openaiProvider
}
