import { NextResponse } from 'next/server'

/**
 * AI SQL generation endpoint.
 * Full implementation depends on @/lib/pg-meta and @/lib/management-api-schema
 * (see supabase-mt/portal). Stubbed here so flow-mnky builds; implement or
 * remove when this feature is needed.
 */
export async function POST() {
  return NextResponse.json(
    { message: 'AI SQL is not implemented in flow-mnky. Use Supabase Studio or MT Portal for this feature.' },
    { status: 501 }
  )
}
