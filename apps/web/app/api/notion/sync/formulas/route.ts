import { NextResponse } from "next/server"

/**
 * @deprecated Formulas are now stored in Supabase (Whole Elise database).
 * Use GET /api/formulas instead.
 */
export async function GET() {
  return NextResponse.json(
    {
      error: "Formulas sync is deprecated. Formulas are now served from the Supabase database (Whole Elise). Use GET /api/formulas instead.",
      migration: "/api/formulas",
    },
    { status: 410 } // Gone
  )
}
