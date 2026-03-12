import { NextResponse } from "next/server"
import {
  listProjects,
  getProject,
  isManagementConfigured,
} from "@/lib/supabase/management"

export async function GET() {
  if (!isManagementConfigured()) {
    return NextResponse.json(
      { error: "Management API not configured" },
      { status: 503 }
    )
  }

  try {
    const [projects, currentProject] = await Promise.all([
      listProjects(),
      getProject(),
    ])

    return NextResponse.json({
      projects,
      currentProject,
      projectRef: process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
