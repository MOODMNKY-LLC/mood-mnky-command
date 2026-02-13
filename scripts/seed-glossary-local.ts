/**
 * Seed the fragrance glossary into local Supabase.
 *
 * Usage: pnpm glossary:seed-local
 *
 * Runs supabase status -o env to get local URL and keys, then runs
 * glossary fetch-and-seed. Requires local Supabase to be running (supabase start).
 */

import { execSync } from "child_process"

// Get local Supabase env from `supabase status -o env`
let envOutput: string
try {
  envOutput = execSync("supabase status -o env", {
    encoding: "utf-8",
    cwd: process.cwd(),
  })
} catch (err) {
  console.error(
    "Failed to run supabase status. Is local Supabase running? Run: supabase start"
  )
  process.exit(1)
}

// Parse KEY="value" lines and set process.env
for (const line of envOutput.split("\n")) {
  const match = line.match(/^([A-Z_][A-Z0-9_]*)=["']?([^"'\n]*)["']?$/)
  if (match) {
    const [, key, value] = match
    if (key && value) process.env[key] = value
  }
}

// Map Supabase CLI output to our expected var names
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.API_URL
process.env.SUPABASE_URL = process.env.API_URL
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY

// Signal to fetch-and-seed and seed-fragrance-notes to skip .env (use our local vars)
process.env.GLOSSARY_USE_LOCAL = "1"

;(async () => {
  const { main } = await import("./fetch-and-seed-glossary")
  await main()
})().catch((err) => {
  console.error(err)
  process.exit(1)
})
