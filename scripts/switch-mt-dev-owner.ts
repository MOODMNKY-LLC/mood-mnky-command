/**
 * Add a user ID as a dev overseer (platform_owner_external_users).
 * Use the UUID of the account you use to log in to the main app (apps/web) so the Overseer API works.
 *
 * Option A — Only external (main-auth) overseer: adds UUID to platform_owner_external_users.
 * Option B — Also tenant owner in MT: run with --tenant-owner; the UUID must already exist in MT auth.users
 *   (e.g. you signed up in an app that uses MT auth), or the tenant_members insert will fail with FK.
 *
 * Usage: pnpm switch-mt-dev-owner 92e73dfc-ee3b-445b-b7dc-95d4b8dde6d9
 *        pnpm switch-mt-dev-owner 92e73dfc-ee3b-445b-b7dc-95d4b8dde6d9 --tenant-owner
 *
 * Requires: NEXT_PUBLIC_SUPABASE_MT_URL, SUPABASE_MT_SERVICE_ROLE_KEY in env.
 */

import { createClient } from "@supabase/supabase-js";

const DEFAULT_TENANT_ID = "46149958-9165-420c-92c6-62efbc1a1526"; // local mood-mnky tenant
const PREVIOUS_OWNER_ID = "3f7bff49-abcf-409c-8fef-4748c593d383";

const url = process.env.NEXT_PUBLIC_SUPABASE_MT_URL;
const serviceRoleKey = process.env.SUPABASE_MT_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_MT_URL or SUPABASE_MT_SERVICE_ROLE_KEY");
  process.exit(1);
}

const args = process.argv.slice(2);
const newOwnerId = args.find((a) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(a));
const alsoTenantOwner = args.includes("--tenant-owner");

if (!newOwnerId) {
  console.error("Usage: pnpm switch-mt-dev-owner NEW_OWNER_UUID [--tenant-owner]");
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey);

async function main() {
  // 1. Always add to platform_owner_external_users (Overseer API when logged in to main app with this ID)
  const { error: extErr } = await admin.from("platform_owner_external_users").upsert(
    { external_user_id: newOwnerId },
    { onConflict: "external_user_id" }
  );

  if (extErr) {
    console.error("Failed to update platform_owner_external_users:", extErr.message);
    process.exit(1);
  }

  console.log("Dev overseer (external) added:", newOwnerId);
  console.log("  platform_owner_external_users: OK — Overseer API will allow this user when logged in to main app (main Supabase).");

  if (!alsoTenantOwner) {
    return;
  }

  // 2. Optionally replace owner in tenant_members (requires newOwnerId to exist in MT auth.users)
  const { error: delErr } = await admin
    .from("tenant_members")
    .delete()
    .eq("tenant_id", DEFAULT_TENANT_ID)
    .eq("user_id", PREVIOUS_OWNER_ID);

  if (delErr) {
    console.error("Failed to remove previous owner from tenant_members:", delErr.message);
    process.exit(1);
  }

  const { error: insErr } = await admin.from("tenant_members").insert({
    tenant_id: DEFAULT_TENANT_ID,
    user_id: newOwnerId,
    role: "owner",
  });

  if (insErr) {
    console.error("Failed to set tenant owner (user must exist in MT auth.users):", insErr.message);
    console.error("  Run without --tenant-owner to only add external overseer. Restore previous owner: pnpm restore-mt-dev-owner");
    process.exit(1);
  }

  console.log("  tenant_members: owner for tenant", DEFAULT_TENANT_ID, "->", newOwnerId);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
