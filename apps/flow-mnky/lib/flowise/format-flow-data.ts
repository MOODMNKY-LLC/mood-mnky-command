/**
 * Format Flowise flowData (React Flow JSON) for readable display in UI.
 * Avoids raw JSON dump; surfaces node labels/types and structure.
 */

export interface FlowSummary {
  nodeLabels: string[]
  edgeCount: number
  raw?: string
}

export function formatFlowDataSummary(flowData: string | null | undefined): FlowSummary {
  if (!flowData || typeof flowData !== 'string') {
    return { nodeLabels: [], edgeCount: 0 }
  }
  const trimmed = flowData.trim()
  if (!trimmed) return { nodeLabels: [], edgeCount: 0 }

  try {
    const data = JSON.parse(trimmed) as Record<string, unknown>
    const nodes = (data?.nodes ?? data?.node ?? []) as Array<Record<string, unknown>>
    const edges = (data?.edges ?? data?.edge ?? []) as Array<unknown>

    const labels: string[] = []
    for (const node of nodes) {
      const d = node.data as Record<string, unknown> | undefined
      const label =
        (d?.label as string) ??
        (d?.title as string) ??
        (node.type as string) ??
        (node.id as string) ??
        'Unnamed'
      labels.push(String(label))
    }

    return {
      nodeLabels: labels,
      edgeCount: Array.isArray(edges) ? edges.length : 0,
      raw: trimmed,
    }
  } catch {
    return { nodeLabels: [], edgeCount: 0, raw: trimmed }
  }
}

/** Pretty-print JSON for fallback display (indented, max width). */
export function prettyPrintJson(value: string): string {
  try {
    const parsed = JSON.parse(value)
    return JSON.stringify(parsed, null, 2)
  } catch {
    return value
  }
}
