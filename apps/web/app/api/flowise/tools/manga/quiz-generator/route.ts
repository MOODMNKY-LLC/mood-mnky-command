import { NextResponse } from "next/server"
import { requireInternalApiKey } from "@/lib/api/internal-auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { z } from "zod"

const bodySchema = z.object({
  issueSlug: z.string().min(1),
})

/**
 * POST /api/flowise/tools/manga/quiz-generator
 *
 * Returns issue and chapter context so Flowise/LLM can generate quiz questions for the issue.
 * Suggested output shape: { questions: [ { question_key, question_text, options?, correct_value } ] }
 * Pass threshold is configured in config_xp_rules (mag_quiz.pass_threshold, default 70).
 */
export async function POST(request: Request) {
  if (!requireInternalApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()
  const { data: issue, error: issueError } = await supabase
    .from("mnky_issues")
    .select(
      `
      id, slug, title, status, arc_summary,
      mnky_collections ( id, name, slug )
    `
    )
    .eq("slug", parsed.data.issueSlug)
    .single()

  if (issueError || !issue) {
    return NextResponse.json(
      { error: issueError?.message ?? "Issue not found" },
      { status: 404 }
    )
  }

  const { data: chapters } = await supabase
    .from("mnky_chapters")
    .select("id, fragrance_name, shopify_product_gid, setting, chapter_order")
    .eq("issue_id", issue.id)
    .order("chapter_order")

  const { data: xpRule } = await supabase
    .from("config_xp_rules")
    .select("payload")
    .eq("key", "mag_quiz")
    .maybeSingle()

  const magQuizPayload = (xpRule?.payload as { pass_threshold?: number }) ?? {}
  const passThreshold = magQuizPayload.pass_threshold ?? 70

  return NextResponse.json({
    issue,
    chapters: chapters ?? [],
    pass_threshold: passThreshold,
    output_schema: {
      description:
        "Generate quiz questions from the issue arc and chapters. Return questions array. Each question can have question_key (string), question_text (string), options (string[] for multiple choice), correct_value (string or index). Score is computed by the app when user submits; pass when score >= pass_threshold.",
      questions: [
        {
          question_key: "q1",
          question_text: "What is the name of the first rift?",
          options: ["Indulgence", "Vitality", "Peace"],
          correct_value: "Indulgence",
        },
      ],
    },
  })
}
