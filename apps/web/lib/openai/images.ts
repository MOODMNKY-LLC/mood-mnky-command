import OpenAI from "openai"
import type {
  ImageEditStreamEvent,
  ImageGenStreamEvent,
} from "openai/resources/images"

/** Latest OpenAI image model (state of the art). See: https://platform.openai.com/docs/guides/image-generation */
export const DEFAULT_IMAGE_MODEL = "gpt-image-1.5" as const

export type ImageModel = "gpt-image-1.5" | "gpt-image-1" | "gpt-image-1-mini"
export type ImageSize = "1024x1024" | "1792x1024" | "1024x1792"
export type ImageQuality = "low" | "high"

export interface GenerateImageOptions {
  prompt: string
  model?: ImageModel
  size?: ImageSize
  quality?: ImageQuality
  n?: number
}

export interface EditImageOptions {
  prompt: string
  /** Array of reference image URLs. Order: [0] = subject to edit, [1] = style reference (optional). */
  referenceImageUrls: string[]
  model?: ImageModel
  size?: ImageSize
  quality?: ImageQuality
}

/** Stream event payload - partial or completed image. */
export type GenerateImageStreamEvent = ImageGenStreamEvent
export type EditImageStreamEvent = ImageEditStreamEvent

function getClient(): OpenAI {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error("OPENAI_API_KEY is not set")
  return new OpenAI({ apiKey: key })
}

/**
 * Generate an image from a text prompt using OpenAI Images API.
 * Returns base64-encoded PNG.
 */
export async function generateImage(
  options: GenerateImageOptions
): Promise<string> {
  const client = getClient()
  // GPT image models (gpt-image-1*) always return base64; response_format is only for dall-e-2/dall-e-3
  const { data } = await client.images.generate({
    model: options.model ?? DEFAULT_IMAGE_MODEL,
    prompt: options.prompt,
    n: options.n ?? 1,
    size: options.size ?? "1024x1024",
    quality: options.quality ?? "high",
  })

  const b64 = data[0]?.b64_json
  if (!b64) throw new Error("No image data returned from OpenAI")
  return b64
}

/**
 * Edit/composite an image using one or more reference images and a prompt.
 * Order: [0] = subject to edit, [1] = style reference (optional).
 * Fetches reference images from URLs and passes to OpenAI edit API.
 * Returns base64-encoded PNG.
 */
export async function editImage(options: EditImageOptions): Promise<string> {
  const client = getClient()

  const urls = options.referenceImageUrls
  if (!urls.length) throw new Error("At least one reference image URL is required")

  const imageFiles: File[] = await Promise.all(
    urls.map(async (url, i) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Failed to fetch reference image ${i + 1}: ${res.statusText}`)
      const blob = await res.blob()
      return new File([blob], `reference-${i}.png`, { type: blob.type || "image/png" })
    })
  )

  // GPT image models always return base64; response_format is only for dall-e-2/dall-e-3
  const { data } = await client.images.edit({
    model: options.model ?? DEFAULT_IMAGE_MODEL,
    prompt: options.prompt,
    image: imageFiles,
    size: options.size ?? "1024x1024",
    quality: options.quality ?? "high",
  })

  const b64 = data[0]?.b64_json
  if (!b64) throw new Error("No image data returned from OpenAI")
  return b64
}

/**
 * Generate an image from a text prompt in streaming mode.
 * Yields partial_image events (b64_json) and a final completed event.
 * Use partial_images: 2 (default) for progressive preview updates.
 */
export async function* generateImageStream(
  options: GenerateImageOptions & { partial_images?: number }
): AsyncGenerator<ImageGenStreamEvent> {
  const client = getClient()
  const stream = await client.images.generate({
    model: options.model ?? DEFAULT_IMAGE_MODEL,
    prompt: options.prompt,
    n: options.n ?? 1,
    size: (options.size ?? "1024x1024") as "1024x1024" | "1024x1536" | "1536x1024",
    quality: (options.quality ?? "high") as "low" | "medium" | "high" | "auto",
    stream: true,
    partial_images: options.partial_images ?? 2,
  })

  for await (const event of stream) {
    yield event
  }
}

/**
 * Edit/composite an image in streaming mode.
 * Yields partial_image events and a final completed event.
 */
export async function* editImageStream(
  options: EditImageOptions & { partial_images?: number }
): AsyncGenerator<ImageEditStreamEvent> {
  const client = getClient()

  const urls = options.referenceImageUrls
  if (!urls.length) throw new Error("At least one reference image URL is required")

  const imageFiles: File[] = await Promise.all(
    urls.map(async (url, i) => {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Failed to fetch reference image ${i + 1}: ${res.statusText}`)
      const blob = await res.blob()
      return new File([blob], `reference-${i}.png`, { type: blob.type || "image/png" })
    })
  )

  const stream = await client.images.edit({
    model: options.model ?? DEFAULT_IMAGE_MODEL,
    prompt: options.prompt,
    image: imageFiles,
    size: (options.size ?? "1024x1024") as "1024x1024" | "1024x1536" | "1536x1024",
    quality: (options.quality ?? "high") as "low" | "medium" | "high" | "auto",
    stream: true,
    partial_images: options.partial_images ?? 2,
  })

  for await (const event of stream) {
    yield event
  }
}
