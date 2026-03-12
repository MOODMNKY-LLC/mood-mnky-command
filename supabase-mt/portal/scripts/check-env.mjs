#!/usr/bin/env node
/**
 * Optional: validate that required portal env vars are set before dev.
 * Loads supabase-mt/.env.local (same path as portal lib/env-file.ts).
 * Run from portal/: node scripts/check-env.mjs
 * Or: pnpm run check-env (if added to package.json).
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const REQUIRED = [
  "NEXT_PUBLIC_SUPABASE_MT_URL",
  "NEXT_PUBLIC_SUPABASE_MT_ANON_KEY",
  "SUPABASE_MT_SERVICE_ROLE_KEY",
];

function loadEnv(path) {
  if (!existsSync(path)) return {};
  const raw = readFileSync(path, "utf-8");
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let value = t.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
      value = value.slice(1, -1).trim();
    out[key] = value;
  }
  return out;
}

const envPath = join(__dirname, "..", "..", ".env.local");
const env = { ...process.env, ...loadEnv(envPath) };

const missing = REQUIRED.filter((key) => !env[key]?.trim());
if (missing.length) {
  console.error("Missing required env (set in supabase-mt/.env.local):");
  missing.forEach((k) => console.error("  -", k));
  process.exit(1);
}
console.log("Required portal env vars are set.");
