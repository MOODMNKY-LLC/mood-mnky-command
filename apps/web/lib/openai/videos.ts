import OpenAI from "openai"
import type {
  Video,
  VideoCreateParams,
  VideoListParams,
  VideoRemixParams,
} from "openai/resources/videos"
import sharp from "sharp"

export type VideoModel = "sora-2" | "sora-2-pro"
export type VideoSize = "720x1280" | "1280x720" | "1024x1792" | "1792x1024"
export type VideoSeconds = "4" | "8" | "12"

export interface CreateVideoOptions {
  prompt: string
  model?: VideoModel
  size?: VideoSize
  seconds?: VideoSeconds
  /** Reference image URL for image-to-video. Will be resized to match size. */
  referenceImageUrl?: string
}

function getClient(): OpenAI {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error("OPENAI_API_KEY is not set")
  return new OpenAI({ apiKey: key })
}

/**
 * Parse size string to [width, height].
 */
function parseSize(size: VideoSize): [number, number] {
  const [w, h] = size.split("x").map(Number)
  return [w, h]
}

/**
 * Resize image from URL to exact dimensions for video API.
 * Returns a Buffer suitable for File/Blob.
 */
async function resizeReferenceImage(
  imageUrl: string,
  size: VideoSize
): Promise<{ buffer: Buffer; mimeType: string }> {
  const res = await fetch(imageUrl)
  if (!res.ok) throw new Error(`Failed to fetch reference image: ${res.statusText}`)
  const arrayBuffer = await res.arrayBuffer()
  const inputBuffer = Buffer.from(arrayBuffer)
  const contentType = res.headers.get("content-type") || "image/png"
  const mimeType = contentType.split(";")[0].trim()

  const [width, height] = parseSize(size)
  const resized = await sharp(inputBuffer)
    .resize(width, height, { fit: "cover" })
    .toFormat(mimeType.includes("jpeg") || mimeType.includes("jpg") ? "jpeg" : "png")
    .toBuffer()

  const outputMime = mimeType.includes("jpeg") || mimeType.includes("jpg") ? "image/jpeg" : "image/png"
  return { buffer: resized, mimeType: outputMime }
}

/**
 * Create a video from a prompt, with optional reference image.
 */
export async function createVideo(options: CreateVideoOptions): Promise<Video> {
  const client = getClient()
  const {
    prompt,
    model = "sora-2",
    size = "1280x720",
    seconds = "8",
    referenceImageUrl,
  } = options

  const params: VideoCreateParams = {
    prompt,
    model,
    size,
    seconds,
  }

  if (referenceImageUrl) {
    const { buffer, mimeType } = await resizeReferenceImage(referenceImageUrl, size)
    const file = new File([buffer], "reference.png", { type: mimeType })
    params.input_reference = file
  }

  return client.videos.create(params)
}

/**
 * Retrieve video job status.
 */
export async function getVideo(id: string): Promise<Video> {
  const client = getClient()
  return client.videos.retrieve(id)
}

/**
 * Download video content as MP4.
 */
export async function getVideoContent(id: string): Promise<ArrayBuffer> {
  const client = getClient()
  const response = await client.videos.downloadContent(id)
  return response.arrayBuffer()
}

/**
 * List videos with pagination.
 */
export async function listVideos(
  params?: VideoListParams
): Promise<{ data: Video[]; has_more: boolean }> {
  const client = getClient()
  const page = await client.videos.list(params ?? {})
  return {
    data: page.data,
    has_more: page.has_more,
  }
}

/**
 * Delete a video.
 */
export async function deleteVideo(id: string): Promise<{ id: string; deleted: boolean }> {
  const client = getClient()
  const res = await client.videos.delete(id)
  return { id: res.id, deleted: res.deleted }
}

/**
 * Remix an existing video with a new prompt.
 */
export async function remixVideo(id: string, prompt: string): Promise<Video> {
  const client = getClient()
  const body: VideoRemixParams = { prompt }
  return client.videos.remix(id, body)
}
