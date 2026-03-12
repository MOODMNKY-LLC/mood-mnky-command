import { listChatflows } from '@/lib/flowise/client'
import { ChatflowsList } from '@/components/admin/chatflows-list'

export default async function AdminChatflowsPage() {
  let chatflows: Awaited<ReturnType<typeof listChatflows>> = []
  try {
    chatflows = await listChatflows()
  } catch {
    // Flowise unreachable or not configured
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Chatflows</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Flowise chatflows. Toggle <strong>Deployed</strong> to make a flow live (callable) or draft-only.
          Assign a default chatflow per user in User management.
        </p>
      </div>
      {chatflows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No chatflows. Configure Flowise or create chatflows in the Flowise UI.
        </p>
      ) : (
        <ChatflowsList initialChatflows={chatflows} />
      )}
    </div>
  )
}
