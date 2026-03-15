import { requireAdmin } from '@/lib/auth/require-admin'
import { getN8nConfigSummary, listN8nWorkflows } from '@/lib/n8n/client'

async function guardAdmin() {
  const auth = await requireAdmin()
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status })
  return null
}

export async function GET(req: Request) {
  const err = await guardAdmin()
  if (err) return err

  const { configured } = getN8nConfigSummary()
  if (!configured) {
    return Response.json({ workflows: [], configured: false })
  }

  try {
    const url = new URL(req.url)
    const activeParam = url.searchParams.get('active')
    const active =
      activeParam === 'true'
        ? true
        : activeParam === 'false'
          ? false
          : undefined

    const workflows = await listN8nWorkflows(active)
    return Response.json({ workflows, configured: true })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : String(error), workflows: [], configured: true },
      { status: 502 }
    )
  }
}
