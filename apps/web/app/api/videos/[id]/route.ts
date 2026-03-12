import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getVideo, deleteVideo } from "@/lib/openai/videos"

export async function GET(
  _request: Request,
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

  try {
    const video = await getVideo(id)
    return NextResponse.json(video)
  } catch (err) {
    console.error("Get video error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to get video" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
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

  try {
    const result = await deleteVideo(id)
    return NextResponse.json(result)
  } catch (err) {
    console.error("Delete video error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to delete video" },
      { status: 500 }
    )
  }
}
