import { adminListDocumentStores } from '@/lib/actions/admin'
import { DocumentStoreCreate } from './document-store-create'
import { DocumentStoreIngest } from './document-store-ingest'
import { DocumentStoreList } from './document-store-list'

export default async function AdminDocumentStoresPage() {
  let stores: Awaited<ReturnType<typeof adminListDocumentStores>> = []
  try {
    stores = await adminListDocumentStores()
  } catch {
    // Flowise unreachable or not configured
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Document stores</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Create knowledge bases, upload files, and ingest (train) so the agent can retrieve and use them in conversation.
        </p>
      </div>

      <DocumentStoreCreate />

      <DocumentStoreIngest stores={stores} />

      <DocumentStoreList stores={stores} />
    </div>
  )
}
