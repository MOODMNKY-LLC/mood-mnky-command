#!/usr/bin/env node
/**
 * Validates that required env vars exist in .env.local.
 * Run before deploy to catch missing vars. Does NOT push to Vercel.
 *
 * Usage: pnpm vercel:env-check
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_STORE_DOMAIN",
  "PUBLIC_STORE_DOMAIN",
  "NEXT_PUBLIC_STOREFRONT_API_TOKEN",
  "PUBLIC_STOREFRONT_API_TOKEN",
  "PUBLIC_CUSTOMER_ACCOUNT_API_CLIENT_ID",
  "NEXT_PUBLIC_APP_URL",
];

const root = resolve(process.cwd());
const envPath = resolve(root, ".env.local");

if (!existsSync(envPath)) {
  console.warn("⚠ .env.local not found. Copy from .env.example and fill in values.");
  process.exit(1);
}

const content = readFileSync(envPath, "utf-8");
const defined = new Set();
for (const line of content.split("\n")) {
  const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=/);
  if (m) defined.add(m[1]);
}

const missing = required.filter((k) => !defined.has(k));

if (missing.length) {
  console.error("❌ Missing or empty required env vars in .env.local:");
  missing.forEach((k) => console.error("   -", k));
  console.error("\nAdd these to .env.local and sync to Vercel with: vercel env add <name> production");
  process.exit(1);
}

console.log("✓ Required env vars present in .env.local.");
console.log("  Remember to sync to Vercel: vercel env pull / vercel env add");
process.exit(0);
