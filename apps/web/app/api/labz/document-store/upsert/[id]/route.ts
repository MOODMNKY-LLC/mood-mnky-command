/**
 * POST /api/labz/document-store/upsert/[id]
 * Proxies to Flowise document store upsert (multipart/form-data). LABZ backend context.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFlowiseBaseUrl, getFlowiseAuthHeaders } from "@/lib/flowise/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Store id required" }, { status: 400 });
  }

  const baseUrl = getFlowiseBaseUrl().replace(/\/$/, "");
  const url = `${baseUrl}/api/v1/document-store/upsert/${id}`;
  const headers = getFlowiseAuthHeaders();
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    formData.set("metadata", JSON.stringify({ profile_id: user.id }));
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { message?: string })?.message ?? "Upsert failed" },
        { status: res.status },
      );
    }
    return NextResponse.json(data);
  }

  return NextResponse.json(
    { error: "Content-Type must be multipart/form-data with files" },
    { status: 400 },
  );
}
