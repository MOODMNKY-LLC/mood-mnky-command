import { openai } from "./client"

export type ModerationResult = {
  flagged: boolean
  categories: Record<string, boolean>
  categoryScores: Record<string, number>
}

/**
 * Run OpenAI Moderation on text (e.g. UGC caption).
 * Use for triage before human review.
 */
export async function moderateContent(input: string): Promise<ModerationResult> {
  const resp = await openai.moderations.create({ input })
  const result = resp.results[0]
  if (!result) {
    return { flagged: false, categories: {}, categoryScores: {} }
  }
  return {
    flagged: result.flagged,
    categories: result.categories as unknown as Record<string, boolean>,
    categoryScores: (result.category_scores as unknown as Record<string, number>) ?? {},
  }
}
