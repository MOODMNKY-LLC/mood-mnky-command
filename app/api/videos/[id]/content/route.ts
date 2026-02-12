import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  getVideo,
  getVideoContent,
} from "@/lib/openai/videos"
import {
  uploadFile,
  saveMediaAsset,
  getPublicUrl,
  BUCKETS,
  type BucketId,
} from "@/lib/supabase/storage"

export const maxDuration = 60

export async function GET(
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

  const { searchParams } = new URL(request.url)
  const saveToMedia = searchParams.get("save") === "true"

  try {
    const video = await getVideo(id)
    if (video.status !== "completed") {
      return NextResponse.json(
        { error: "Video not ready for download" },
        { status: 400 }
      )
    }

    const content = await getVideoContent(id)
    const buffer = Buffer.from(content)

    if (saveToMedia) {
      const adminSupabase = createAdminClient()
      const timestamp = Date.now()
      const fileName = `sora_${timestamp}_${id.replace(/^video_/, "")}.mp4`
      const blob = new Blob([buffer], { type: "video/mp4" })

      const { path } = await uploadFile(
        adminSupabase,
        BUCKETS.aiVideos as BucketId,
        user.id,
        fileName,
        blob,
        { contentType: "video/mp4", upsert: true }
      )

      const publicUrl = getPublicUrl(
        adminSupabase,
        BUCKETS.aiVideos as BucketId,
        path
      )

      await saveMediaAsset(adminSupabase, {
        user_id: user.id,
        bucket_id: BUCKETS.aiVideos as BucketId,
        storage_path: path,
        file_name: fileName,
        mime_type: "video/mp4",
        file_size: buffer.length,
        tags: ["ai-generated", "sora"],
        public_url: publicUrl,
        category: "sora-video",
        source_model: video.model,
        generation_prompt: video.prompt ?? undefined,
      })
    }

    return new Response(buffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="video-${id}.mp4"`,
      },
    })
  } catch (err) {
    console.error("Download video error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to download video" },
      { status: 500 }
    )
  }
}
