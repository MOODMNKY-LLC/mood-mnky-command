/**
 * Add a main-Supabase user ID as an overseer in the MT project (platform_owner_external_users).
 * Use for both local dev and production: the UUID must be the auth user ID from the Supabase
 * project used for app login (main Supabase). In production, that is the production main Supabase;
 * dev and prod UUIDs differ and cannot be copied between environments.
 *
 * Usage (local):  pnpm add-mt-overseer <UUID>
 * Usage (prod):  Use production MT env vars, then run with the production main-Supabase user UUID:
 *   pnpm add-mt-overseer <PRODUCTION_MAIN_USER_UUID>
 *
 * Get the UUID: main Supabase Dashboard → Authentication → Users, or call /api/me when logged in.
 *
 * Requires: NEXT_PUBLIC_SUPABASE_MT_URL, SUPABASE_MT_SERVICE_ROLE_KEY (for the MT project you target).
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_MT_URL;
const serviceRoleKey = process.env.SUPABASE_MT_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_MT_URL or SUPABASE_MT_SERVICE_ROLE_KEY");
  process.exit(1);
}

const args = process.argv.slice(2);
const uuid = args.find((a) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(a));

if (!uuid) {
  console.error("Usage: pnpm add-mt-overseer <USER_UUID>");
  console.error("  USER_UUID = main Supabase auth user id (from Dashboard → Auth → Users or /api/me)");
  console.error("  For production: use production MT env vars and the production main-Supabase user UUID.");
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey);

async function main() {
  const { error } = await admin.from("platform_owner_external_users").upsert(
    { external_user_id: uuid },
    { onConflict: "external_user_id" }
  );

  if (error) {
    console.error("Failed to add overseer:", error.message);
    process.exit(1);
  }

  console.log("Overseer added:", uuid);
  console.log("  This user can call the Overseer API (list tenants, update status, app instances) when logged in to the main app.");
}

main();
