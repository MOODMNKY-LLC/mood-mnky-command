/**
 * Injects Context7 documentation into Flowise overrideConfig when agent mode is "coder".
 * Flowise flows can read overrideConfig.systemMessage or vars.context7Docs.
 */

import { getContext7MCPService } from '@/lib/services/context7-mcp.service'

const CODER_DOC_LIBRARIES = ['nodejs', 'typescript', 'react']
const MAX_DOC_CHARS = 6000

export interface OverrideConfigWithContext7Input {
  overrideConfig?: Record<string, unknown>
  agentMode?: string
}

/**
 * If agentMode is 'coder', fetches Context7 docs and merges into overrideConfig.
 * Appends a "Context7 documentation" section to systemMessage and sets vars.context7Docs (truncated).
 */
export async function injectContext7IntoOverrideConfig(
  input: OverrideConfigWithContext7Input
): Promise<Record<string, unknown> | undefined> {
  const { overrideConfig, agentMode } = input
  if (agentMode !== 'coder') return overrideConfig

  try {
    const service = getContext7MCPService()
    const libraries =
      (overrideConfig?.vars as Record<string, unknown> | undefined)?.context7Libraries as string[] | undefined
    const libList = Array.isArray(libraries) && libraries.length > 0 ? libraries : CODER_DOC_LIBRARIES
    const docs = await service.fetchDocumentation(libList)
    if (!docs.length) return overrideConfig

    const docBlock = docs
      .map((d) => `## ${d.library} (${d.version})\n${d.summary || d.content?.slice(0, 800) || ''}`)
      .join('\n\n')
    const truncated = docBlock.length > MAX_DOC_CHARS ? docBlock.slice(0, MAX_DOC_CHARS) + '\n\n[...truncated]' : docBlock
    const section = `\n\n---\n## Context7 documentation (for reference)\n${truncated}`

    const merged: Record<string, unknown> = {
      ...(overrideConfig ?? {}),
      vars: {
        ...((overrideConfig?.vars as Record<string, unknown>) ?? {}),
        context7Docs: truncated,
      },
    }
    const existingSystem = (overrideConfig?.systemMessage as string) ?? ''
    merged.systemMessage = existingSystem + section
    return merged
  } catch (err) {
    console.warn('[context7-inject] Failed to fetch docs:', err instanceof Error ? err.message : err)
    return overrideConfig
  }
}
