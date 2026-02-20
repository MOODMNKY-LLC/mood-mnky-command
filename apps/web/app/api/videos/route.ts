import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createVideo, listVideos } from "@/lib/openai/videos"
import type { VideoSize, VideoSeconds, VideoModel } from "@/lib/openai/videos"

export const maxDuration = 60

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get("limit")) || 20
    const after = searchParams.get("after") || undefined
    const order = (searchParams.get("order") as "asc" | "desc") || "desc"

    const result = await listVideos({ limit, after, order })
    return NextResponse.json(result)
  } catch (err) {
    console.error("List videos error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to list videos" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: {
    prompt: string
    model?: VideoModel
    size?: VideoSize
    seconds?: VideoSeconds
    referenceImageUrl?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { prompt, model, size, seconds, referenceImageUrl } = body

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 })
  }

  try {
    const video = await createVideo({
      prompt,
      model,
      size,
      seconds,
      referenceImageUrl,
    })
    return NextResponse.json(video)
  } catch (err) {
    console.error("Create video error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create video" },
      { status: 500 }
    )
  }
}
