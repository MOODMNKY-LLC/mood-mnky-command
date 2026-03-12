/**
 * Provision a new tenant in the Multi-Tenant Supabase (MT) project.
 * Creates tenant, adds owner membership, and optionally seeds default or full organization content.
 *
 * Usage:
 *   pnpm exec tsx scripts/provision-mt-tenant.ts --slug my-tenant --name "My Tenant" --owner-id YOUR_USER_UUID
 *   pnpm exec tsx scripts/provision-mt-tenant.ts --slug default --name "MOOD MNKY" --owner-id YOUR_USER_UUID --seed-defaults
 *   pnpm exec tsx scripts/provision-mt-tenant.ts --slug mood-mnky --name "MOOD MNKY LLC" --owner-id YOUR_USER_UUID --platform-owner --seed-organization
 *
 * Requires: NEXT_PUBLIC_SUPABASE_MT_URL, SUPABASE_MT_SERVICE_ROLE_KEY in env.
 */

import { createClient } from "@supabase/supabase-js";
import { brandCopy, designTokens, content, MOOD_MNKY_LLC_SLUG } from "./seed-data/mood-mnky-llc";

const url = process.env.NEXT_PUBLIC_SUPABASE_MT_URL;
const serviceRoleKey = process.env.SUPABASE_MT_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_MT_URL or SUPABASE_MT_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey);

function parseArgs(): {
  slug: string;
  name: string;
  ownerId: string;
  seedDefaults: boolean;
  platformOwner: boolean;
  seedOrganization: boolean;
} {
  const args = process.argv.slice(2);
  let slug = "";
  let name = "";
  let ownerId = "";
  let seedDefaults = false;
  let platformOwner = false;
  let seedOrganization = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--slug" && args[i + 1]) slug = args[++i];
    else if (args[i] === "--name" && args[i + 1]) name = args[++i];
    else if (args[i] === "--owner-id" && args[i + 1]) ownerId = args[++i];
    else if (args[i] === "--seed-defaults") seedDefaults = true;
    else if (args[i] === "--platform-owner") platformOwner = true;
    else if (args[i] === "--seed-organization") seedOrganization = true;
  }
  if (!slug || !name || !ownerId) {
    console.error(
      "Usage: tsx scripts/provision-mt-tenant.ts --slug SLUG --name \"NAME\" --owner-id YOUR_USER_UUID [--seed-defaults] [--platform-owner] [--seed-organization]"
    );
    process.exit(1);
  }
  return { slug, name, ownerId, seedDefaults, platformOwner, seedOrganization };
}

async function seedDefaultBrandCopy(tenantId: string) {
  const defaults = [
    { scope: "main", key: "hero_headline", content: "Welcome" },
    { scope: "dojo", key: "hero_headline", content: "The Dojo" },
    { scope: "labz", key: "hero_headline", content: "MNKY LABZ" },
  ];
  for (const row of defaults) {
    await admin.from("tenant_brand_copy").insert({ tenant_id: tenantId, ...row });
  }
}

async function seedDefaultDesignTokens(tenantId: string) {
  const tokens = [
    { token_key: "--background", value: "#ffffff", mode: "light" },
    { token_key: "--foreground", value: "#0a0a0a", mode: "light" },
    { token_key: "--background", value: "#0a0a0a", mode: "dark" },
    { token_key: "--foreground", value: "#fafafa", mode: "dark" },
  ];
  for (const row of tokens) {
    await admin.from("tenant_design_tokens").insert({ tenant_id: tenantId, ...row });
  }
}

async function seedOrganizationData(tenantId: string) {
  for (const row of brandCopy) {
    await admin.from("tenant_brand_copy").insert({ tenant_id: tenantId, ...row });
  }
  for (const row of designTokens) {
    await admin.from("tenant_design_tokens").insert({ tenant_id: tenantId, ...row });
  }
  for (const row of content) {
    await admin.from("tenant_content").insert({
      tenant_id: tenantId,
      content_type: row.content_type,
      slug: row.slug ?? null,
      key: row.key ?? null,
      body: row.body,
      metadata: row.metadata ?? {},
    });
  }
}

async function main() {
  const { slug, name, ownerId, seedDefaults, platformOwner, seedOrganization } = parseArgs();

  if (seedOrganization && slug !== MOOD_MNKY_LLC_SLUG) {
    console.error(`--seed-organization is only valid when --slug is ${MOOD_MNKY_LLC_SLUG}`);
    process.exit(1);
  }

  const tenantPayload: { slug: string; name: string; status: string; is_platform_owner?: boolean } = {
    slug,
    name,
    status: "active",
  };
  if (platformOwner) {
    tenantPayload.is_platform_owner = true;
  }

  const { data: tenant, error: tenantErr } = await admin
    .from("tenants")
    .insert(tenantPayload)
    .select("id")
    .single();

  if (tenantErr || !tenant) {
    console.error("Failed to create tenant:", tenantErr?.message ?? "no data");
    process.exit(1);
  }

  const { error: memberErr } = await admin.from("tenant_members").insert({
    user_id: ownerId,
    tenant_id: tenant.id,
    role: "owner",
  });

  if (memberErr) {
    console.error("Failed to add owner membership:", memberErr.message);
    process.exit(1);
  }

  if (platformOwner) {
    const { error: extErr } = await admin.from("platform_owner_external_users").upsert(
      { external_user_id: ownerId },
      { onConflict: "external_user_id" }
    );
    if (extErr) {
      console.error("Failed to add overseer external user:", extErr.message);
      process.exit(1);
    }
  }

  if (seedOrganization) {
    await seedOrganizationData(tenant.id);
  } else if (seedDefaults) {
    await seedDefaultBrandCopy(tenant.id);
    await seedDefaultDesignTokens(tenant.id);
  }

  console.log(
    JSON.stringify(
      { tenantId: tenant.id, slug, name, ownerId, seedDefaults, platformOwner, seedOrganization },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
