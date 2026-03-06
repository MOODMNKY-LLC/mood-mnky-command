/**
 * RLS isolation verification for the Multi-Tenant Supabase (MT) project.
 * Creates two tenants, two users, and one row per tenant in tenant_brand_copy;
 * then asserts that each user can only read their own tenant's row via the anon client.
 *
 * Requires: NEXT_PUBLIC_SUPABASE_MT_URL, SUPABASE_MT_SERVICE_ROLE_KEY in env.
 * Run: pnpm exec tsx scripts/verify-mt-rls-isolation.ts
 * (or: node --loader ts-node/esm scripts/verify-mt-rls-isolation.ts)
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_MT_URL;
const serviceRoleKey = process.env.SUPABASE_MT_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_MT_URL or SUPABASE_MT_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey);

const TENANT_A_SLUG = "rls-test-tenant-a";
const TENANT_B_SLUG = "rls-test-tenant-b";
const USER_A_EMAIL = "rls-test-user-a@example.com";
const USER_B_EMAIL = "rls-test-user-b@example.com";
const TEST_PASSWORD = "test-password-ChangeMe!";

async function main() {
  let tenantAId: string;
  let tenantBId: string;
  let userAId: string;
  let userBId: string;

  try {
    // Create two tenants
    const { data: tA, error: eA } = await admin.from("tenants").insert({
      slug: TENANT_A_SLUG,
      name: "RLS Test Tenant A",
      status: "active",
    }).select("id").single();
    if (eA || !tA) {
      throw new Error(`Failed to create tenant A: ${eA?.message ?? "no data"}`);
    }
    tenantAId = tA.id;

    const { data: tB, error: eB } = await admin.from("tenants").insert({
      slug: TENANT_B_SLUG,
      name: "RLS Test Tenant B",
      status: "active",
    }).select("id").single();
    if (eB || !tB) {
      throw new Error(`Failed to create tenant B: ${eB?.message ?? "no data"}`);
    }
    tenantBId = tB.id;

    // Create two auth users
    const { data: uA, error: euA } = await admin.auth.admin.createUser({
      email: USER_A_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
    });
    if (euA || !uA?.user) {
      throw new Error(`Failed to create user A: ${euA?.message ?? "no user"}`);
    }
    userAId = uA.user.id;

    const { data: uB, error: euB } = await admin.auth.admin.createUser({
      email: USER_B_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
    });
    if (euB || !uB?.user) {
      throw new Error(`Failed to create user B: ${euB?.message ?? "no user"}`);
    }
    userBId = uB.user.id;

    // Add memberships
    await admin.from("tenant_members").insert([
      { user_id: userAId, tenant_id: tenantAId, role: "owner" },
      { user_id: userBId, tenant_id: tenantBId, role: "owner" },
    ]);

    // One row per tenant in tenant_brand_copy
    await admin.from("tenant_brand_copy").insert([
      { tenant_id: tenantAId, scope: "test", key: "only_a", content: "tenant-a" },
      { tenant_id: tenantBId, scope: "test", key: "only_b", content: "tenant-b" },
    ]);

    // Anon client: sign in as user A and select
    const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_MT_ANON_KEY ?? "");
    const { data: sessionA, error: signInA } = await anon.auth.signInWithPassword({
      email: USER_A_EMAIL,
      password: TEST_PASSWORD,
    });
    if (signInA || !sessionA?.user) {
      throw new Error(`User A sign in failed: ${signInA?.message ?? "no session"}`);
    }

    const { data: rowsA, error: selectA } = await anon.from("tenant_brand_copy").select("tenant_id, content");
    if (selectA) throw new Error(`User A select failed: ${selectA.message}`);
    if (!rowsA || rowsA.length !== 1 || rowsA[0].tenant_id !== tenantAId || rowsA[0].content !== "tenant-a") {
      throw new Error(`User A should see exactly one row (tenant A); got: ${JSON.stringify(rowsA)}`);
    }

    await anon.auth.signOut();

    // Sign in as user B and select
    const { data: sessionB, error: signInB } = await anon.auth.signInWithPassword({
      email: USER_B_EMAIL,
      password: TEST_PASSWORD,
    });
    if (signInB || !sessionB?.user) {
      throw new Error(`User B sign in failed: ${signInB?.message ?? "no session"}`);
    }

    const { data: rowsB, error: selectB } = await anon.from("tenant_brand_copy").select("tenant_id, content");
    if (selectB) throw new Error(`User B select failed: ${selectB.message}`);
    if (!rowsB || rowsB.length !== 1 || rowsB[0].tenant_id !== tenantBId || rowsB[0].content !== "tenant-b") {
      throw new Error(`User B should see exactly one row (tenant B); got: ${JSON.stringify(rowsB)}`);
    }

    console.log("RLS isolation check passed: each user saw only their tenant's row.");
  } finally {
    // Cleanup: delete test data (order matters for FKs)
    if (typeof tenantAId !== "undefined" && typeof tenantBId !== "undefined") {
      await admin.from("tenant_brand_copy").delete().in("tenant_id", [tenantAId, tenantBId]).then(() => {});
      await admin.from("tenant_members").delete().in("tenant_id", [tenantAId, tenantBId]).then(() => {});
      await admin.from("tenants").delete().in("id", [tenantAId, tenantBId]).then(() => {});
    }
    if (typeof userAId !== "undefined") await admin.auth.admin.deleteUser(userAId).then(() => {});
    if (typeof userBId !== "undefined") await admin.auth.admin.deleteUser(userBId).then(() => {});
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
