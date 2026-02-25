import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { inngest } from "@/lib/inngest/client"
import { z } from "zod"

const moderateSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  moderationNotes: z.string().max(1000).optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = moderateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { data: submission, error: fetchError } = await admin
    .from("ugc_submissions")
    .select("id, profile_id, status")
    .eq("id", id)
    .single()

  if (fetchError || !submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 })
  }

  if (submission.status !== "pending") {
    return NextResponse.json(
      { error: "Submission already moderated" },
      { status: 409 }
    )
  }

  const { error: updateError } = await admin
    .from("ugc_submissions")
    .update({
      status: parsed.data.status,
      moderation_notes: parsed.data.moderationNotes ?? null,
    })
    .eq("id", id)

  if (updateError) {
    return NextResponse.json(
      { error: "Failed to update", details: updateError.message },
      { status: 500 }
    )
  }

  if (parsed.data.status === "approved") {
    await inngest.send({
      name: "ugc/on.approved",
      data: {
        submissionId: id,
        profileId: submission.profile_id,
      },
    })
  }

  return NextResponse.json({ ok: true, status: parsed.data.status })
}
