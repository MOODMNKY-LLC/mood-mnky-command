import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PACKAGES = ["core", "agent", "agent-gpu-nvidia", "agent-gpu-amd", "supabase"] as const;
const MAX_CPU = 32;
const MAX_RAM_MB = 131072;
const MAX_DISK_GB = 2000;

/**
 * POST: Create a stack subscription request (tenant admin for tenant_id).
 * Body: { tenant_id, package, spec_cpu?, spec_ram_mb?, spec_disk_gb? }
 * RLS ensures only tenant admins for that tenant can insert.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  let body: { tenant_id?: string; package?: string; spec_cpu?: number; spec_ram_mb?: number; spec_disk_gb?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body." }, { status: 400 });
  }

  const tenant_id = body.tenant_id?.trim();
  const pkg = body.package?.trim();
  if (!tenant_id || !pkg) {
    return NextResponse.json(
      { message: "tenant_id and package are required." },
      { status: 400 }
    );
  }
  if (!PACKAGES.includes(pkg as (typeof PACKAGES)[number])) {
    return NextResponse.json(
      { message: `package must be one of: ${PACKAGES.join(", ")}.` },
      { status: 400 }
    );
  }

  const spec_cpu = Math.min(MAX_CPU, Math.max(1, Number(body.spec_cpu) || 2));
  const spec_ram_mb = Math.min(MAX_RAM_MB, Math.max(512, Number(body.spec_ram_mb) || 4096));
  const spec_disk_gb = Math.min(MAX_DISK_GB, Math.max(10, Number(body.spec_disk_gb) || 50));

  const { data, error } = await supabase
    .from("tenant_stack_subscriptions")
    .insert({
      tenant_id,
      package: pkg,
      spec_cpu,
      spec_ram_mb,
      spec_disk_gb,
      status: "requested",
    })
    .select("id, tenant_id, package, spec_cpu, spec_ram_mb, spec_disk_gb, status, created_at")
    .single();

  if (error) {
    if (error.code === "42501") {
      return NextResponse.json({ message: "Forbidden: not a tenant admin for this org." }, { status: 403 });
    }
    return NextResponse.json({ message: error.message ?? "Insert failed." }, { status: 500 });
  }

  return NextResponse.json({ data });
}
