import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { forwardToProxmox } from "@/lib/proxmox-proxy";

async function requirePlatformAdmin(): Promise<NextResponse | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("platform_role")
    .eq("id", user.id)
    .single();
  if (profile?.platform_role !== "platform_admin") {
    return NextResponse.json({ message: "Forbidden. Platform admin required." }, { status: 403 });
  }
  return null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const forbidden = await requirePlatformAdmin();
  if (forbidden) return forbidden;
  const { path } = await params;
  return forwardToProxmox(path ?? [], request);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const forbidden = await requirePlatformAdmin();
  if (forbidden) return forbidden;
  const { path } = await params;
  return forwardToProxmox(path ?? [], request);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const forbidden = await requirePlatformAdmin();
  if (forbidden) return forbidden;
  const { path } = await params;
  return forwardToProxmox(path ?? [], request);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const forbidden = await requirePlatformAdmin();
  if (forbidden) return forbidden;
  const { path } = await params;
  return forwardToProxmox(path ?? [], request);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const forbidden = await requirePlatformAdmin();
  if (forbidden) return forbidden;
  const { path } = await params;
  return forwardToProxmox(path ?? [], request);
}
