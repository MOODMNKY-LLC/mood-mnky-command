/**
 * Restore the previous dev owner (3f7bff49-...) to tenant_members after a failed switch.
 * Run: pnpm restore-mt-dev-owner
 */

import { createClient } from "@supabase/supabase-js";

const DEFAULT_TENANT_ID = "46149958-9165-420c-92c6-62efbc1a1526";
const PREVIOUS_OWNER_ID = "3f7bff49-abcf-409c-8fef-4748c593d383";

const url = process.env.NEXT_PUBLIC_SUPABASE_MT_URL;
const key = process.env.SUPABASE_MT_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_MT_URL or SUPABASE_MT_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, key);

async function main() {
  const { error } = await admin.from("tenant_members").insert({
    tenant_id: DEFAULT_TENANT_ID,
    user_id: PREVIOUS_OWNER_ID,
    role: "owner",
  });
  if (error) {
    console.error("Restore failed:", error.message);
    process.exit(1);
  }
  console.log("Restored owner", PREVIOUS_OWNER_ID, "for tenant", DEFAULT_TENANT_ID);
}

main();
