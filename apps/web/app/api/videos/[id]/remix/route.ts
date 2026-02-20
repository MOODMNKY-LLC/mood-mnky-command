import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { remixVideo } from "@/lib/openai/videos"

export const maxDuration = 60

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: "Video ID required" }, { status: 400 })
  }

  let body: { prompt: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { prompt } = body
  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 })
  }

  try {
    const video = await remixVideo(id, prompt)
    return NextResponse.json(video)
  } catch (err) {
    console.error("Remix video error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Remix failed" },
      { status: 500 }
    )
  }
}
