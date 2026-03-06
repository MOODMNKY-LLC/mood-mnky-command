import { createClient } from "@/lib/supabase/server";
import { createClient as createMTAdmin } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/create-tenant — Create a new tenant and add the current user as owner.
 * Body: { name: string, slug: string }
 * Requires: authenticated user, MT service role for insert.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_MT_URL;
  const serviceRoleKey = process.env.SUPABASE_MT_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    return NextResponse.json(
      { error: "MT project not configured" },
      { status: 503 }
    );
  }

  let body: { name?: string; slug?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = body.name?.trim();
  const slug = body.slug?.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  if (!name || !slug) {
    return NextResponse.json(
      { error: "Body must include name and slug" },
      { status: 400 }
    );
  }

  const admin = createMTAdmin(url, serviceRoleKey);

  const { data: tenant, error: tenantErr } = await admin
    .from("tenants")
    .insert({ name, slug, status: "active" })
    .select("id")
    .single();

  if (tenantErr) {
    if (tenantErr.code === "23505") {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }
    return NextResponse.json(
      { error: "Failed to create tenant", details: tenantErr.message },
      { status: 500 }
    );
  }

  const { error: memberErr } = await admin.from("tenant_members").insert({
    tenant_id: tenant.id,
    user_id: user.id,
    role: "owner",
  });

  if (memberErr) {
    await admin.from("tenants").delete().eq("id", tenant.id);
    return NextResponse.json(
      { error: "Failed to add owner", details: memberErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ tenant: { id: tenant.id, slug, name } });
}
