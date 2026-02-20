/**
 * Image provider abstraction for text-to-image and edit flows.
 * OpenAI is the supported provider.
 */

export type ImageProviderId = "openai"

export interface GenerateOptions {
  prompt: string
  model?: string
  size?: string
  quality?: string
}

export interface EditOptions {
  prompt: string
  /** Array of reference image URLs. Order: [0] = subject to edit, [1] = style reference (optional). */
  referenceImageUrls: string[]
  model?: string
  size?: string
  quality?: string
}

export interface ImageProvider {
  readonly id: ImageProviderId
  /** Human-readable name for logs and UI. */
  readonly name: string
  /** Generate image from text prompt. Returns base64-encoded PNG. */
  generate(options: GenerateOptions): Promise<string>
  /**
   * Edit/image variation using reference image and prompt.
   * Returns base64-encoded PNG.
   */
  edit?(options: EditOptions): Promise<string>
}
