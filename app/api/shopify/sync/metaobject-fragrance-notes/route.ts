import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  ensureFragranceNoteMetaobjectDefinition,
  metaobjectCreateFragranceNote,
  metaobjectUpdateFragranceNote,
  metaobjectListFragranceNoteHandles,
  type FragranceNoteMetaobjectFields,
  isShopifyGraphQLConfigured,
} from "@/lib/shopify-admin-graphql"

/**
 * POST /api/shopify/sync/metaobject-fragrance-notes
 * One-way sync: Supabase fragrance_notes → Shopify metaobjects (type fragrance_note).
 * Ensures the metaobject definition exists, then creates or updates entries by slug (handle).
 * Updates fragrance_notes.shopify_metaobject_id and shopify_synced_at.
 * Requires SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_API_TOKEN, and Supabase migration 20260220100000.
 */
export async function POST() {
  if (!isShopifyGraphQLConfigured()) {
    return NextResponse.json(
      { error: "Shopify is not configured. Add SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_API_TOKEN." },
      { status: 503 }
    )
  }

  const supabase = createAdminClient()

  try {
    await ensureFragranceNoteMetaobjectDefinition()
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json(
      { error: `Failed to ensure metaobject definition: ${message}` },
      { status: 500 }
    )
  }

  const handleToId = new Map<string, string>()
  try {
    const existing = await metaobjectListFragranceNoteHandles()
    existing.forEach((n) => handleToId.set(n.handle, n.id))
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json(
      { error: `Failed to list existing metaobjects: ${message}` },
      { status: 500 }
    )
  }

  const { data: notes, error: fetchError } = await supabase
    .from("fragrance_notes")
    .select("id, name, slug, description_short, olfactive_profile, facts, shopify_metaobject_id")
    .order("name")

  if (fetchError) {
    return NextResponse.json(
      { error: `Supabase fetch failed: ${fetchError.message}. Ensure migration 20260220100000_fragrance_notes_shopify_metaobject.sql is applied.` },
      { status: 500 }
    )
  }

  const fields = (row: {
    name: string
    slug: string
    description_short: string | null
    olfactive_profile: string | null
    facts: string | null
  }): FragranceNoteMetaobjectFields => ({
    name: row.name,
    slug: row.slug,
    description_short: row.description_short ?? "",
    olfactive_profile: row.olfactive_profile ?? "",
    facts: row.facts ?? "",
  })

  let created = 0
  let updated = 0
  const errors: string[] = []

  for (const row of notes ?? []) {
    const metaobjectId = (row as { shopify_metaobject_id?: string }).shopify_metaobject_id
    const handle = row.slug
    let gid: string | undefined

    try {
      if (metaobjectId) {
        const result = await metaobjectUpdateFragranceNote(metaobjectId, fields(row))
        gid = result.id
        updated++
      } else if (handleToId.has(handle)) {
        const existingId = handleToId.get(handle)!
        const result = await metaobjectUpdateFragranceNote(existingId, fields(row))
        gid = result.id
        updated++
      } else {
        const result = await metaobjectCreateFragranceNote(handle, fields(row))
        gid = result.id
        handleToId.set(handle, result.id)
        created++
      }
    } catch (err) {
      errors.push(`${row.name} (${handle}): ${err instanceof Error ? err.message : "Unknown error"}`)
      continue
    }

    if (gid) {
      await supabase
        .from("fragrance_notes")
        .update({
          shopify_metaobject_id: gid,
          shopify_synced_at: new Date().toISOString(),
        })
        .eq("id", row.id)
    }
  }

  return NextResponse.json({
    created,
    updated,
    total: notes?.length ?? 0,
    errors: errors.length ? errors : undefined,
  })
}
