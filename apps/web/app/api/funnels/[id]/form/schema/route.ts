/**
 * Return form schema for native inline form rendering in chat.
 * No JotForm API call; reads from funnel_definitions.form_schema.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const { data, error } = await supabase
    .from("funnel_definitions")
    .select("id, form_schema, question_mapping")
    .eq("id", id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "Funnel not found" }, { status: 404 })
  }

  const formSchema = (data.form_schema ?? []) as Array<{
    type: string
    text: string
    order: number
    name?: string
    required?: boolean
    options?: string[]
    semanticKey?: string
  }>

  return NextResponse.json({
    funnelId: data.id,
    formSchema: formSchema.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    questionMapping: (data.question_mapping ?? {}) as Record<string, string>,
  })
}
