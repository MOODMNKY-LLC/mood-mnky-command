/**
 * Dynamic default starter prompts per chatflow use case.
 * Used when the Flowise chatflow does not define its own starterPrompts.
 * Selection is by explicit chatflow id, then by name keywords, then by flow type, then default.
 */

export type StarterUseCase = 'code' | 'general' | 'support' | 'default'

const STARTERS_BY_USE_CASE: Record<StarterUseCase, string[]> = {
  code: [
    'Explain this code step by step',
    'Suggest a simpler approach',
    'How can I debug this?',
    'What does this function do?',
  ],
  general: [
    'Summarize the main points',
    'Explain step by step',
    'What are the key takeaways?',
    'Suggest follow-up questions',
  ],
  support: [
    'What do I need to do next?',
    'Can you give me an example?',
    'What are common issues?',
    'Where can I find more help?',
  ],
  default: [
    'Summarize the last message',
    'Explain step by step',
    'What are the key points?',
    'Suggest follow-up questions',
  ],
}

/** Optional explicit mapping: chatflow id -> use case (e.g. for known flows). */
const CHATFLOW_ID_TO_USE_CASE: Record<string, StarterUseCase> = {
  // Add entries like: 'uuid-here': 'code',
}

/** Name substrings that imply a use case (case-insensitive). */
const NAME_KEYWORDS: Record<StarterUseCase, string[]> = {
  code: ['code', 'coder', 'developer', 'dev', 'programming', 'script'],
  general: [],
  support: ['support', 'help', 'faq', 'troubleshoot'],
  default: [],
}

/**
 * Returns starter prompts for the given chatflow when Flowise does not provide any.
 * Uses explicit id map, then name keywords, then MULTIAGENT -> code, else default.
 */
export function getStarterPromptsForChatflow(
  chatflowId: string,
  chatflowName?: string | null,
  flowType?: 'CHATFLOW' | 'MULTIAGENT' | null
): string[] {
  const idMatch = CHATFLOW_ID_TO_USE_CASE[chatflowId]
  if (idMatch) return [...STARTERS_BY_USE_CASE[idMatch]]

  const name = (chatflowName ?? '').toLowerCase()
  for (const [useCase, keywords] of Object.entries(NAME_KEYWORDS) as [StarterUseCase, string[]][]) {
    if (useCase === 'default') continue
    if (keywords.some((k) => name.includes(k))) return [...STARTERS_BY_USE_CASE[useCase]]
  }

  if (flowType === 'MULTIAGENT') return [...STARTERS_BY_USE_CASE.code]

  return [...STARTERS_BY_USE_CASE.default]
}
