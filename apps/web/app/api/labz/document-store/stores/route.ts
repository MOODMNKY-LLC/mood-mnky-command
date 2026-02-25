/**
 * GET /api/labz/document-store/stores
 * Proxies to Flowise list document stores. MNKY LABZ backend context; uses system FLOWISE_API_KEY.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { flowiseFetch } from "@/lib/flowise/client";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = await flowiseFetch("document-store/store", { method: "GET" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      { error: (data as { message?: string })?.message ?? "Failed to list document stores" },
      { status: res.status },
    );
  }
  return NextResponse.json(data);
}
