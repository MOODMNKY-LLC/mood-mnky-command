/**
 * Seed production Supabase with formula data from supabase/seed_formulas.sql.
 *
 * Usage:
 *   pnpm formulas:seed-production
 *
 * This runs with Vercel production env (no secrets written to disk). Alternatively,
 * set SUPABASE_DB_URL in .env and run: tsx scripts/seed-formulas-production.ts
 *
 * Requires: SUPABASE_DB_URL (direct Postgres connection string from Supabase Dashboard
 *   → Project Settings → Database → Connection string). Add to Vercel env for production.
 */

import { config } from "dotenv"
import { readFileSync } from "fs"
import { join } from "path"
import { Client } from "pg"

// Load .env when not using vercel env run (e.g. local test with .env)
config({ path: join(process.cwd(), ".env"), override: true })

const SEED_PATH = join(process.cwd(), "supabase", "seed_formulas.sql")

async function main(): Promise<void> {
  const dbUrl = process.env.SUPABASE_DB_URL
  if (!dbUrl || !dbUrl.startsWith("postgresql://")) {
    console.error(
      "SUPABASE_DB_URL is not set or invalid. Get the connection string from Supabase Dashboard → Project Settings → Database → Connection string, then add it to Vercel (production) or .env."
    )
    process.exit(1)
  }

  // Avoid accidentally running against local DB when intending production
  if (dbUrl.includes("127.0.0.1") || dbUrl.includes("localhost")) {
    console.error(
      "SUPABASE_DB_URL points to localhost. This script is for production. Use supabase db reset for local seeding."
    )
    process.exit(1)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  if (supabaseUrl.includes("127.0.0.1") || supabaseUrl.includes("localhost")) {
    console.warn(
      "Warning: NEXT_PUBLIC_SUPABASE_URL is local. Ensure SUPABASE_DB_URL is the production database."
    )
  }

  let sql: string
  try {
    sql = readFileSync(SEED_PATH, "utf-8")
  } catch (err) {
    console.error("Failed to read seed file:", SEED_PATH, err)
    process.exit(1)
  }

  const client = new Client({ connectionString: dbUrl })
  try {
    await client.connect()
    await client.query(sql)
    console.log("Formula seed completed successfully.")
  } catch (err) {
    console.error("Seed failed:", err)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()
