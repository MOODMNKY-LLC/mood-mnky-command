import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  ensureMnkyCollectionMetaobjectDefinition,
  ensureMnkyIssueMetaobjectDefinition,
  metaobjectCreateMnkyCollection,
  metaobjectUpdateMnkyCollection,
  metaobjectListMnkyCollectionHandles,
  metaobjectCreateMnkyIssue,
  metaobjectUpdateMnkyIssue,
  metaobjectListMnkyIssueHandles,
  isShopifyGraphQLConfigured,
} from "@/lib/shopify-admin-graphql"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/shopify/sync/metaobject-manga
 *
 * One-way sync: Supabase mnky_collections + mnky_issues (published) → Shopify metaobjects.
 * Ensures mnky_collection and mnky_issue definitions exist, then creates/updates by slug.
 * Updates shopify_metaobject_id and shopify_synced_at on mnky_collections and mnky_issues.
 *
 * Auth: Bearer MOODMNKY_API_KEY or authenticated admin (is_admin()).
 * Optional query: ?issueSlug=... or ?issueId=... to publish a single issue only.
 */
export async function POST(request: NextRequest) {
  const auth = await checkAuth(request)
  if (!auth.ok) {
    return auth.response
  }

  if (!isShopifyGraphQLConfigured()) {
    return NextResponse.json(
      { error: "Shopify not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_API_TOKEN." },
      { status: 503 }
    )
  }

  const supabase = createAdminClient()
  const url = request.nextUrl
  const issueSlug = url.searchParams.get("issueSlug")
  const issueId = url.searchParams.get("issueId")

  try {
    await ensureMnkyCollectionMetaobjectDefinition()
    await ensureMnkyIssueMetaobjectDefinition()
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json(
      { error: `Failed to ensure metaobject definitions: ${message}` },
      { status: 500 }
    )
  }

  const collectionHandleToId = new Map<string, string>()
  try {
    const existingCol = await metaobjectListMnkyCollectionHandles()
    existingCol.forEach((n) => collectionHandleToId.set(n.handle, n.id))
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json(
      { error: `Failed to list collection metaobjects: ${message}` },
      { status: 500 }
    )
  }

  const issueHandleToId = new Map<string, string>()
  try {
    const existingIssue = await metaobjectListMnkyIssueHandles()
    existingIssue.forEach((n) => issueHandleToId.set(n.handle, n.id))
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json(
      { error: `Failed to list issue metaobjects: ${message}` },
      { status: 500 }
    )
  }

  let issuesQuery = supabase
    .from("mnky_issues")
    .select("id, collection_id, issue_number, title, slug, status, arc_summary, cover_asset_url, published_at, shopify_metaobject_id")
    .eq("status", "published")

  if (issueSlug) {
    issuesQuery = issuesQuery.eq("slug", issueSlug)
  } else if (issueId) {
    issuesQuery = issuesQuery.eq("id", issueId)
  }

  const { data: issues, error: issuesError } = await issuesQuery

  if (issuesError) {
    return NextResponse.json(
      { error: `Supabase issues fetch failed: ${issuesError.message}` },
      { status: 500 }
    )
  }

  if (!issues?.length) {
    return NextResponse.json({
      created: { collections: 0, issues: 0 },
      updated: { collections: 0, issues: 0 },
      message: "No published issues to sync (or no match for issueSlug/issueId).",
    })
  }

  const collectionIds = [...new Set(issues.map((i) => i.collection_id))]
  const { data: collections, error: colError } = await supabase
    .from("mnky_collections")
    .select("id, name, slug, shopify_collection_gid, shopify_metaobject_id")
    .in("id", collectionIds)

  if (colError || !collections?.length) {
    return NextResponse.json(
      { error: `Supabase collections fetch failed: ${colError?.message ?? "no rows"}` },
      { status: 500 }
    )
  }

  const colById = new Map(collections.map((c) => [c.id, c]))
  let createdCol = 0
  let updatedCol = 0
  const collectionGidBySupabaseId = new Map<string, string>()

  for (const col of collections) {
    const handle = col.slug
    const existingGid = (col as { shopify_metaobject_id?: string }).shopify_metaobject_id
    let gid: string | undefined
    try {
      if (existingGid) {
        const result = await metaobjectUpdateMnkyCollection(existingGid, {
          name: col.name,
          slug: col.slug,
          shopify_collection_gid: col.shopify_collection_gid ?? "",
        })
        gid = result.id
        updatedCol++
      } else if (collectionHandleToId.has(handle)) {
        const existingId = collectionHandleToId.get(handle)!
        const result = await metaobjectUpdateMnkyCollection(existingId, {
          name: col.name,
          slug: col.slug,
          shopify_collection_gid: col.shopify_collection_gid ?? "",
        })
        gid = result.id
        updatedCol++
      } else {
        const result = await metaobjectCreateMnkyCollection(handle, {
          name: col.name,
          slug: col.slug,
          shopify_collection_gid: col.shopify_collection_gid ?? "",
        })
        gid = result.id
        collectionHandleToId.set(handle, result.id)
        createdCol++
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      return NextResponse.json(
        { error: `Collection ${col.name} (${handle}): ${message}` },
        { status: 500 }
      )
    }
    if (gid) {
      collectionGidBySupabaseId.set(col.id, gid)
      await supabase
        .from("mnky_collections")
        .update({
          shopify_metaobject_id: gid,
          shopify_synced_at: new Date().toISOString(),
        })
        .eq("id", col.id)
    }
  }

  let createdIssue = 0
  let updatedIssue = 0
  const errors: string[] = []

  for (const issue of issues) {
    const collectionGid = collectionGidBySupabaseId.get(issue.collection_id)
    if (!collectionGid) {
      errors.push(`Issue ${issue.slug}: collection not found or not synced`)
      continue
    }
    const handle = issue.slug
    const existingGid = (issue as { shopify_metaobject_id?: string }).shopify_metaobject_id
    const publishedAt = issue.published_at
      ? new Date(issue.published_at).toISOString()
      : null

    const fields = {
      collection_gid: collectionGid,
      issue_number: issue.issue_number,
      title: issue.title,
      slug: issue.slug,
      arc_summary: issue.arc_summary ?? "",
      cover_asset_url: issue.cover_asset_url ?? "",
      status: issue.status,
      published_at: publishedAt,
    }

    let issueMetaobjectId: string | undefined
    try {
      if (existingGid) {
        await metaobjectUpdateMnkyIssue(existingGid, fields)
        issueMetaobjectId = existingGid
        updatedIssue++
      } else if (issueHandleToId.has(handle)) {
        const existingId = issueHandleToId.get(handle)!
        await metaobjectUpdateMnkyIssue(existingId, fields)
        issueMetaobjectId = existingId
        updatedIssue++
      } else {
        const result = await metaobjectCreateMnkyIssue(handle, fields)
        issueMetaobjectId = result.id
        issueHandleToId.set(handle, result.id)
        createdIssue++
      }
    } catch (err) {
      errors.push(`${issue.title} (${handle}): ${err instanceof Error ? err.message : "Unknown error"}`)
      continue
    }

    if (issueMetaobjectId) {
      await supabase
        .from("mnky_issues")
        .update({
          shopify_metaobject_id: issueMetaobjectId,
          shopify_synced_at: new Date().toISOString(),
        })
        .eq("id", issue.id)
    }
  }

  return NextResponse.json({
    created: { collections: createdCol, issues: createdIssue },
    updated: { collections: updatedCol, issues: updatedIssue },
    errors: errors.length ? errors : undefined,
  })
}

async function checkAuth(
  request: NextRequest
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const authHeader = request.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7)
    const key = process.env.MOODMNKY_API_KEY
    if (key && token === key) return { ok: true }
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  const isAdmin =
    profile?.role === "admin" || profile?.role === "super_admin"
  if (!isAdmin) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    }
  }
  return { ok: true }
}
