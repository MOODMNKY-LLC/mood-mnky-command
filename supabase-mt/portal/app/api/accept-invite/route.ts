import { createClient } from "@/lib/supabase/server";
import { createClient as createMTAdmin } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/accept-invite — Accept a tenant invite by token.
 * Body: { token: string }
 * Requires: authenticated user; invite email must match user email.
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
    return NextResponse.json({ error: "MT project not configured" }, { status: 503 });
  }

  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const token = body.token?.trim();
  if (!token) {
    return NextResponse.json({ error: "Body must include token" }, { status: 400 });
  }

  const admin = createMTAdmin(url, serviceRoleKey);
  const { data: invite, error: inviteErr } = await admin
    .from("tenant_invites")
    .select("id, tenant_id, email, role, expires_at")
    .eq("token", token)
    .maybeSingle();

  if (inviteErr || !invite || new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "Invalid or expired invite" }, { status: 400 });
  }

  if (invite.email.toLowerCase() !== (user.email ?? "").toLowerCase()) {
    return NextResponse.json({ error: "Invite email does not match your account" }, { status: 403 });
  }

  const { error: memberErr } = await admin.from("tenant_members").insert({
    tenant_id: invite.tenant_id,
    user_id: user.id,
    role: invite.role,
  });

  if (memberErr) {
    if (memberErr.code === "23505") {
      return NextResponse.json({ error: "You are already a member" }, { status: 409 });
    }
    return NextResponse.json(
      { error: "Failed to add membership", details: memberErr.message },
      { status: 500 }
    );
  }

  await admin.from("tenant_invites").delete().eq("id", invite.id);

  return NextResponse.json({ ok: true });
}
