import { openai } from "./client"

const DEFAULT_MODEL = "text-embedding-3-small"

/**
 * Generate embedding for a single text (e.g. for semantic search over issues/chapters).
 */
export async function embedText(
  text: string,
  options?: { model?: string }
): Promise<number[]> {
  const resp = await openai.embeddings.create({
    model: options?.model ?? DEFAULT_MODEL,
    input: text.slice(0, 8191),
  })
  const vec = resp.data[0]?.embedding
  if (!vec) throw new Error("No embedding returned")
  return vec
}

/**
 * Generate embeddings for multiple texts in one call (more efficient).
 */
export async function embedTexts(
  texts: string[],
  options?: { model?: string }
): Promise<number[][]> {
  if (texts.length === 0) return []
  const input = texts.map((t) => t.slice(0, 8191))
  const resp = await openai.embeddings.create({
    model: options?.model ?? DEFAULT_MODEL,
    input,
  })
  const sorted = [...resp.data].sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
  return sorted.map((d) => d.embedding)
}
