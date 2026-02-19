import { NextRequest, NextResponse } from "next/server"
import { requireInternalApiKey } from "@/lib/api/internal-auth"

type SyncResultItem = {
  database: string
  success: boolean
  error?: string
  created?: number
  updated?: number
  total?: number
  recordsSynced?: number
}

const SYNC_OPS: Array<{
  database: string
  path: string
  method: "GET" | "POST"
  body?: Record<string, string>
  requireAuth?: boolean
}> = [
  { database: "fragrance-oils", path: "/api/notion/sync/fragrance-oils", method: "POST" },
  { database: "collections", path: "/api/notion/sync/collections", method: "GET" },
  {
    database: "fragrance-notes",
    path: "/api/notion/sync/fragrance-notes",
    method: "POST",
    body: { direction: "to-supabase" },
  },
  { database: "blog", path: "/api/notion/sync/blog", method: "POST" },
  { database: "assistant-knowledge", path: "/api/notion/sync/assistant-knowledge", method: "POST" },
  { database: "manga", path: "/api/notion/sync/manga", method: "POST", requireAuth: true },
]

function getBaseUrl(request: NextRequest): string {
  try {
    return new URL(request.url).origin
  } catch {
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
    return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const base = getBaseUrl(request)
  const results: SyncResultItem[] = []

  for (const op of SYNC_OPS) {
    if (op.requireAuth && !requireInternalApiKey(request)) {
      results.push({
        database: op.database,
        success: false,
        error: "Manga sync requires MOODMNKY_API_KEY. Skipped.",
      })
      continue
    }
    try {
      const headers: Record<string, string> = op.body ? { "Content-Type": "application/json" } : {}
      if (op.requireAuth && authHeader) headers["Authorization"] = authHeader
      const res = await fetch(`${base}${op.path}`, {
        method: op.method,
        headers,
        body: op.body ? JSON.stringify(op.body) : undefined,
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        results.push({
          database: op.database,
          success: false,
          error: data.error ?? `HTTP ${res.status}`,
        })
        continue
      }
      results.push({
        database: op.database,
        success: true,
        created: data.created,
        updated: data.updated,
        total: data.total ?? data.recordsSynced,
        recordsSynced: data.recordsSynced,
      })
    } catch (err) {
      results.push({
        database: op.database,
        success: false,
        error: err instanceof Error ? err.message : "Request failed",
      })
    }
  }

  return NextResponse.json({ results })
}
