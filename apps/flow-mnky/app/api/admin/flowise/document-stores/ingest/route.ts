import { requireAdmin } from '@/lib/auth/require-admin'
import { upsertDocumentStoreFiles } from '@/lib/flowise/client'

/**
 * POST /api/admin/flowise/document-stores/ingest
 * Body: multipart/form-data with storeId (string) and files (one or more File).
 * Avoids Server Action 1MB body limit for large uploads.
 */
export async function POST(req: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return Response.json({ error: auth.error }, { status: auth.status })
  }

  const formData = await req.formData()
  const storeId = formData.get('storeId')
  if (typeof storeId !== 'string' || !storeId.trim()) {
    return Response.json({ error: 'storeId is required' }, { status: 400 })
  }

  const files = formData.getAll('files').filter((f): f is File => f instanceof File)
  if (files.length === 0) {
    return Response.json({ error: 'At least one file is required' }, { status: 400 })
  }

  const ingestForm = new FormData()
  files.forEach((file) => ingestForm.append('files', file))

  try {
    const result = await upsertDocumentStoreFiles(storeId.trim(), ingestForm)
    return Response.json({ ok: true, ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ingest failed'
    const isLoaderNotConfigured =
      /Loader not configured/i.test(message) || /loader not configured/i.test(message)
    const errorPayload = isLoaderNotConfigured
      ? {
          ok: false,
          error: message,
          hint: 'Configure the document store in Flowise first: open Flowise → Document Stores → select this store → add a Document Loader (e.g. PDF File), Text Splitter (e.g. Recursive Character Text Splitter), Embedding model, and Vector Store. Save, then try Ingest again.',
        }
      : { ok: false, error: message }
    return Response.json(errorPayload, { status: 502 })
  }
}
