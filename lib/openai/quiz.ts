import { openai } from "./client"

export type RubricItem = {
  criterion: string
  maxPoints: number
}

/**
 * Grade a freeform answer against a rubric using OpenAI.
 * Use for quiz open-ended questions; combine with deterministic scoring.
 */
export async function gradeFreeformWithRubric(
  question: string,
  correctAnswer: string,
  studentAnswer: string,
  rubric: RubricItem[],
  maxScore: number
): Promise<{ score: number; feedback?: string }> {
  const rubricText = rubric
    .map((r) => `- ${r.criterion} (max ${r.maxPoints} pts)`)
    .join("\n")

  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a fair grader. Score the student's answer from 0 to ${maxScore} based on the rubric. Reply with JSON only: { "score": number, "feedback": "optional short feedback" }.`,
      },
      {
        role: "user",
        content: `Question: ${question}\nReference answer: ${correctAnswer}\nRubric:\n${rubricText}\n\nStudent answer: ${studentAnswer}`,
      },
    ],
    response_format: { type: "json_object" },
  })

  const content = resp.choices[0]?.message?.content
  if (!content) {
    return { score: 0 }
  }

  try {
    const parsed = JSON.parse(content) as { score?: number; feedback?: string }
    const score = Math.min(maxScore, Math.max(0, Number(parsed.score) ?? 0))
    return { score, feedback: parsed.feedback }
  } catch {
    return { score: 0 }
  }
}
