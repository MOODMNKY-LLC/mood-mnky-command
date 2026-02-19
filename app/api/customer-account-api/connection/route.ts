/**
 * Auth-scoped Shopify connection status.
 * GET /api/customer-account-api/connection
 * Returns { linked, needsReconnect, email? } for the current Supabase user.
 * Used by profile and hero to show masked email and reconnect state.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCustomerAccessToken } from "@/lib/shopify/customer-account-client";
import { getCurrentCustomer } from "@/lib/shopify/customer-account-client";

function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "***@***";
  const [local, domain] = email.split("@");
  const first = local?.charAt(0) ?? "";
  return `${first}***@${domain}`;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminSupabase = createAdminClient();
  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("shopify_customer_id")
    .eq("id", user.id)
    .single();

  const hasProfileLink = !!profile?.shopify_customer_id;
  const token = await getCustomerAccessToken();
  const linked = !!token;

  let needsReconnect = false;
  let email: string | undefined;

  if (linked) {
    try {
      const customer = await getCurrentCustomer();
      if (customer?.email) email = maskEmail(customer.email);
    } catch {
      // token may be invalid
    }
  } else if (hasProfileLink) {
    needsReconnect = true;
  }

  return NextResponse.json({
    linked,
    needsReconnect,
    email: email ?? undefined,
  });
}
