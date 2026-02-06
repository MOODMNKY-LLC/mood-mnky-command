import { NextRequest, NextResponse } from "next/server"
import {
  executeSql,
  getDatabaseStats,
  isManagementConfigured,
} from "@/lib/supabase/management"

export async function POST(request: NextRequest) {
  if (!isManagementConfigured()) {
    return NextResponse.json(
      { error: "Management API not configured" },
      { status: 503 }
    )
  }

  try {
    const { query } = await request.json()

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      )
    }

    // Basic safety: block DROP DATABASE and other destructive operations
    const upperQuery = query.toUpperCase().trim()
    if (
      upperQuery.includes("DROP DATABASE") ||
      upperQuery.includes("DROP SCHEMA") ||
      upperQuery.includes("DROP ROLE")
    ) {
      return NextResponse.json(
        { error: "Destructive operations are not allowed through this interface" },
        { status: 403 }
      )
    }

    const result = await executeSql(query)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// GET: return database stats
export async function GET() {
  if (!isManagementConfigured()) {
    return NextResponse.json(
      { error: "Management API not configured" },
      { status: 503 }
    )
  }

  try {
    const stats = await getDatabaseStats()
    return NextResponse.json(stats)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
