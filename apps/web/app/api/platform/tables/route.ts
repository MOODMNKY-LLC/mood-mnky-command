import { NextRequest, NextResponse } from "next/server"
import {
  listTables,
  listRlsPolicies,
  isManagementConfigured,
} from "@/lib/supabase/management"

export async function GET(request: NextRequest) {
  if (!isManagementConfigured()) {
    return NextResponse.json(
      { error: "Management API not configured" },
      { status: 503 }
    )
  }

  const schema = request.nextUrl.searchParams.get("schema") || "public"

  try {
    const [tables, policies] = await Promise.all([
      listTables(schema),
      listRlsPolicies(schema),
    ])

    // Attach policies to their respective tables
    const tablesWithPolicies = tables.map((table) => ({
      ...table,
      policies: policies.filter((p) => p.table === table.name),
    }))

    return NextResponse.json({ tables: tablesWithPolicies, schema })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
