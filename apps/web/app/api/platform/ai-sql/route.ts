/**
 * Server-side OpenAI — not routed through Flowise.
 * See docs/AI-SEPARATION-REPORT.md.
 */
import { NextRequest, NextResponse } from "next/server"
import { listTables, isManagementConfigured } from "@/lib/supabase/management"

export async function POST(request: NextRequest) {
  if (!isManagementConfigured()) {
    return NextResponse.json({ error: "Management API not configured" }, { status: 503 })
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 503 })
  }

  try {
    const { prompt } = await request.json()
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Fetch current schema context for the AI
    const tables = await listTables("public")
    const schemaContext = tables
      .map((t) => {
        const cols = t.columns.map((c) => `  ${c.name} ${c.type}${c.is_nullable ? "" : " NOT NULL"}${c.is_identity ? " (PK)" : ""}`).join("\n")
        return `TABLE ${t.schema}.${t.name}:\n${cols}`
      })
      .join("\n\n")

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a PostgreSQL expert. Generate SQL queries based on the user's request.
You have access to the following database schema:

${schemaContext}

Rules:
- Output ONLY the SQL query, no explanation or markdown
- Use proper PostgreSQL syntax
- For SELECT queries, limit results to 100 rows unless specified
- Never generate DROP DATABASE, DROP SCHEMA, or DROP ROLE statements
- Always use parameterized-safe patterns (no string interpolation)`,
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 1000,
      }),
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: `OpenAI API error: ${res.status}` },
        { status: 500 }
      )
    }

    const data = await res.json()
    const sql = data.choices?.[0]?.message?.content?.trim() || ""

    // Strip markdown code fences if present
    const cleanSql = sql.replace(/^```sql?\n?/i, "").replace(/\n?```$/i, "").trim()

    return NextResponse.json({ sql: cleanSql })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
