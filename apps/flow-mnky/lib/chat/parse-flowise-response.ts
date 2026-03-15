const TEXT_KEYS = [
  'text',
  'result',
  'message',
  'output',
  'response',
  'data',
  'content',
  'answer',
  'outputMessage',
  'outputText',
  'reply',
] as const

function getString(obj: Record<string, unknown>, keys: readonly string[]): string {
  for (const k of keys) {
    const v = obj[k]
    if (typeof v === 'string' && v.trim()) return v
  }
  return ''
}

/**
 * Extract displayable message text from Flowise prediction response (stream chunk or full JSON).
 * Handles top-level and nested shapes used by Flowise and agent flows.
 */
export function extractMessageText(obj: unknown): string {
  if (obj == null) return ''
  if (typeof obj === 'string') return obj.trim() || ''
  if (typeof obj !== 'object') return ''

  const o = obj as Record<string, unknown>

  const top = getString(o, TEXT_KEYS)
  if (top) return top

  // Nested: result.message, data.text, output.message, etc.
  for (const key of ['result', 'data', 'output', 'response', 'message']) {
    const nested = o[key]
    if (nested && typeof nested === 'object') {
      const str = getString(nested as Record<string, unknown>, TEXT_KEYS)
      if (str) return str
    }
  }

  // Array of message parts (e.g. some agents return [{ type: 'text', text: '...' }])
  const arr = o.messages ?? o.chunks ?? o.parts
  if (Array.isArray(arr)) {
    for (const item of arr) {
      if (item && typeof item === 'object') {
        const str =
          typeof (item as Record<string, unknown>).text === 'string'
            ? (item as Record<string, unknown>).text
            : getString(item as Record<string, unknown>, TEXT_KEYS)
        if (str) return String(str)
      }
    }
  }

  return ''
}
