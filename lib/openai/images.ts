import OpenAI from "openai"

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
  referenceImageUrl: string
  model?: ImageModel
  size?: ImageSize
  quality?: ImageQuality
}

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
 * Edit/composite an image using a reference image and prompt.
 * Use for placing mascot/reference in a scene.
 * Fetches the reference image from URL and passes to OpenAI edit API.
 * Returns base64-encoded PNG.
 */
export async function editImage(options: EditImageOptions): Promise<string> {
  const client = getClient()

  // Fetch reference image and convert to Blob for the API
  const imageRes = await fetch(options.referenceImageUrl)
  if (!imageRes.ok) throw new Error(`Failed to fetch reference image: ${imageRes.statusText}`)
  const imageBlob = await imageRes.blob()
  const imageFile = new File([imageBlob], "reference.png", { type: imageBlob.type || "image/png" })

  // GPT image models always return base64; response_format is only for dall-e-2/dall-e-3
  const { data } = await client.images.edit({
    model: options.model ?? DEFAULT_IMAGE_MODEL,
    prompt: options.prompt,
    image: imageFile,
    size: options.size ?? "1024x1024",
    quality: options.quality ?? "high",
  })

  const b64 = data[0]?.b64_json
  if (!b64) throw new Error("No image data returned from OpenAI")
  return b64
}
