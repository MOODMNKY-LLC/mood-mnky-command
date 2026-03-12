import { listDocumentStores } from '@/lib/flowise/client'
import { DocumentStoreIngest } from './document-store-ingest'

export default async function AdminDocumentStoresPage() {
  let stores: Awaited<ReturnType<typeof listDocumentStores>> = []
  try {
    stores = await listDocumentStores()
  } catch {
    // Flowise unreachable or not configured
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Document stores</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage Flowise document stores and ingest files into the vector store.
        </p>
      </div>

      <DocumentStoreIngest stores={stores} />

      <section>
        <h2 className="text-lg font-medium mb-3">Stores</h2>
        {stores.length === 0 ? (
          <p className="text-sm text-muted-foreground">No document stores. Create one in Flowise or via API.</p>
        ) : (
          <ul className="rounded-lg border border-border/50 divide-y divide-border/50">
            {stores.map((s) => (
              <li key={s.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{s.name}</p>
                  {s.description && (
                    <p className="text-xs text-muted-foreground">{s.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">ID: {s.id}</p>
                </div>
                <span className="text-xs text-muted-foreground capitalize">{s.status ?? '—'}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
