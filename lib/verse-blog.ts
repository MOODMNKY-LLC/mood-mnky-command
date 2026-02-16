/**
 * Verse blog: agent identifiers and cover image resolution.
 * Used for author card and fallback cover when Cover URL is empty.
 */

export const VERSE_BLOG_AGENTS = ["mood_mnky", "sage_mnky", "code_mnky"] as const
export type VerseBlogAgent = (typeof VERSE_BLOG_AGENTS)[number]

export const AGENT_IMAGE_PATH: Record<VerseBlogAgent, string> = {
  mood_mnky: "/verse/mood_mnky.png",
  sage_mnky: "/verse/sage_mnky.png",
  code_mnky: "/verse/code_mnky.png",
}

export const AGENT_DISPLAY_NAME: Record<VerseBlogAgent, string> = {
  mood_mnky: "MOOD MNKY",
  sage_mnky: "SAGE MNKY",
  code_mnky: "CODE MNKY",
}

export function isVerseBlogAgent(value: string | null): value is VerseBlogAgent {
  return value != null && VERSE_BLOG_AGENTS.includes(value as VerseBlogAgent)
}

/**
 * Resolve cover image URL: use cover_url if set, else agent image when author_agent is set.
 */
export function getBlogCoverUrl(
  coverUrl: string | null,
  authorAgent: string | null
): string | null {
  if (coverUrl?.trim()) return coverUrl.trim()
  if (isVerseBlogAgent(authorAgent)) return AGENT_IMAGE_PATH[authorAgent]
  return null
}
