'use server'

import { requireAdmin } from '@/lib/auth/require-admin'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  listDocumentStores,
  createDocumentStore,
  deleteDocumentStore,
  upsertDocumentStoreFiles,
  listChatflows,
  listVariables,
} from '@/lib/flowise/client'

export type ProfileRole = 'admin' | 'moderator' | 'user' | 'pending'

export interface ProfileRow {
  id: string
  display_name: string | null
  avatar_url: string | null
  role: ProfileRole
  default_chatflow_id: string | null
  last_sign_in_at: string | null
  allowed_openai_models: string[] | null
  created_at: string
  updated_at: string
}

const DEFAULT_PAGE_SIZE = 20

/**
 * Merge last_sign_in_at from Auth into profile rows so status reflects real sign-in time
 * even when profiles table isn't synced (e.g. missing trigger in project).
 */
async function mergeLastSignInFromAuth(
  admin: ReturnType<typeof createAdminClient>,
  rows: ProfileRow[],
): Promise<ProfileRow[]> {
  if (rows.length === 0) return rows
  try {
    const { data } = await admin.auth.admin.listUsers({ per_page: 1000 })
    const users = data?.users ?? []
    const lastSignInById = new Map<string, string | null>()
    for (const u of users) {
      const at = (u as { last_sign_in_at?: string | null }).last_sign_in_at ?? null
      lastSignInById.set(u.id, at)
    }
    return rows.map((row) => {
      const fromAuth = lastSignInById.get(row.id)
      const last_sign_in_at = fromAuth ?? row.last_sign_in_at
      return { ...row, last_sign_in_at }
    })
  } catch {
    return rows
  }
}

/** List profiles with pagination (admin only). For user management and infinite list. */
export async function listProfiles(options?: {
  limit?: number
  offset?: number
}): Promise<
  | { ok: true; data: ProfileRow[]; nextOffset: number | null }
  | { ok: false; error: string }
> {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return { ok: false, error: auth.error }
  }
  const limit = options?.limit ?? DEFAULT_PAGE_SIZE
  const offset = options?.offset ?? 0
  const baseSelect =
    'id, display_name, avatar_url, role, default_chatflow_id, created_at, updated_at'
  const extendedSelect = `${baseSelect}, last_sign_in_at, allowed_openai_models`

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('profiles')
      .select(extendedSelect)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      const msg = error.message
      const missingColumn =
        /column.*(?:last_sign_in_at|allowed_openai_models).*does not exist/i.test(msg) ||
        /does not exist/i.test(msg)
      if (missingColumn) {
        const fallback = await admin
          .from('profiles')
          .select(baseSelect)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)
        if (fallback.error) {
          return { ok: false, error: fallback.error.message }
        }
        const rows = ((fallback.data ?? []) as Record<string, unknown>[]).map((row) => ({
          ...row,
          last_sign_in_at: null as string | null,
          allowed_openai_models: null as string[] | null,
        })) as ProfileRow[]
        const nextOffset = rows.length === limit ? offset + limit : null
        const rowsWithAuth = await mergeLastSignInFromAuth(admin, rows)
        return { ok: true, data: rowsWithAuth, nextOffset }
      }
      return { ok: false, error: msg }
    }

    const rows = (data ?? []) as ProfileRow[]
    const nextOffset = rows.length === limit ? offset + limit : null
    const rowsWithAuth = await mergeLastSignInFromAuth(admin, rows)
    return { ok: true, data: rowsWithAuth, nextOffset }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Failed to list profiles',
    }
  }
}

/** Update a user's role (admin only). */
export async function updateProfileRole(
  profileId: string,
  role: ProfileRole,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return { ok: false, error: auth.error }
  }
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('profiles').update({ role, updated_at: new Date().toISOString() }).eq('id', profileId)
    if (error) {
      return { ok: false, error: error.message }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to update role' }
  }
}

/** List document stores (admin only). Wraps Flowise client. */
export async function adminListDocumentStores() {
  const auth = await requireAdmin()
  if (!auth.ok) throw new Error(auth.error)
  return listDocumentStores()
}

/** Create document store (admin only). */
export async function adminCreateDocumentStore(body: { name: string; description?: string }) {
  const auth = await requireAdmin()
  if (!auth.ok) throw new Error(auth.error)
  return createDocumentStore(body)
}

/** Delete document store (admin only). */
export async function adminDeleteDocumentStore(id: string) {
  const auth = await requireAdmin()
  if (!auth.ok) throw new Error(auth.error)
  return deleteDocumentStore(id)
}

/** List chatflows (admin only). */
export async function adminListChatflows() {
  const auth = await requireAdmin()
  if (!auth.ok) throw new Error(auth.error)
  return listChatflows()
}

/** List variables (admin only). */
export async function adminListVariables() {
  const auth = await requireAdmin()
  if (!auth.ok) throw new Error(auth.error)
  return listVariables()
}

// ── Chatflow assignments (admin only) ─────────────────────────────────────────

export interface ChatflowAssignmentRow {
  id: string
  profile_id: string
  chatflow_id: string
  display_name: string | null
  override_config: Record<string, unknown>
  created_at: string
  updated_at: string
}

/** Set a user's allowed OpenAI models (admin only). Null/empty = no restriction. */
export async function setUserAllowedOpenAIModels(
  profileId: string,
  modelIds: string[] | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }
  try {
    const admin = createAdminClient()
    const { error } = await admin
      .from('profiles')
      .update({
        allowed_openai_models: modelIds?.length ? modelIds : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId)
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to update allowed models' }
  }
}

/** Set a user's default chatflow (admin only). */
export async function setUserDefaultChatflow(
  profileId: string,
  chatflowId: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }
  try {
    const admin = createAdminClient()
    const { error } = await admin
      .from('profiles')
      .update({
        default_chatflow_id: chatflowId?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId)
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to update default chatflow' }
  }
}

/** List chatflow assignments for a profile (admin only). */
export async function listChatflowAssignments(
  profileId: string,
): Promise<{ ok: true; data: ChatflowAssignmentRow[] } | { ok: false; error: string }> {
  const auth = await requireAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('flowise_chatflow_assignments')
      .select('id, profile_id, chatflow_id, display_name, override_config, created_at, updated_at')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: true })
    if (error) return { ok: false, error: error.message }
    return { ok: true, data: (data ?? []) as ChatflowAssignmentRow[] }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to list assignments' }
  }
}

/** Add chatflow assignment for a user (admin only). */
export async function addChatflowAssignment(
  profileId: string,
  chatflowId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('flowise_chatflow_assignments').insert({
      profile_id: profileId,
      chatflow_id: chatflowId.trim(),
      override_config: {},
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to add assignment' }
  }
}

/** Remove chatflow assignment (admin only). */
export async function removeChatflowAssignment(
  assignmentId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }
  try {
    const admin = createAdminClient()
    const { error } = await admin
      .from('flowise_chatflow_assignments')
      .delete()
      .eq('id', assignmentId)
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to remove assignment' }
  }
}

export type IngestResult = { ok: true } | { ok: false; error: string }

/**
 * Ingest files into a Flowise document store (admin only).
 * FormData must include: storeId (string), files (one or more File).
 * For use with useActionState: (prevState, formData) => Promise<IngestResult>.
 */
export async function ingestFilesToDocumentStore(
  _prevState: IngestResult | null,
  formData: FormData,
): Promise<IngestResult> {
  const auth = await requireAdmin()
  if (!auth.ok) return { ok: false, error: auth.error }
  const storeId = formData.get('storeId')
  if (typeof storeId !== 'string' || !storeId) {
    return { ok: false, error: 'Store is required' }
  }
  const files = formData.getAll('files')
  if (!files.length) {
    return { ok: false, error: 'At least one file is required' }
  }
  const ingestForm = new FormData()
  files.forEach((file) => {
    if (file instanceof File) ingestForm.append('files', file)
  })
  try {
    await upsertDocumentStoreFiles(storeId, ingestForm)
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Ingest failed' }
  }
}
