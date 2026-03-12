/**
 * Shopify Customer Account API – Unlink.
 * POST /api/customer-account-api/unlink
 * Requires Supabase auth. Deletes token row(s) for current user, clears profiles.shopify_customer_id, clears cookie.
 */

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  CUSTOMER_SESSION_COOKIE,
  getCustomerSessionCookieOptions,
} from "@/lib/shopify/customer-account-auth";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  await admin
    .from("customer_account_tokens")
    .delete()
    .eq("profile_id", user.id);

  await admin
    .from("profiles")
    .update({ shopify_customer_id: null })
    .eq("id", user.id);

  const res = NextResponse.json({ ok: true });
  const opts = getCustomerSessionCookieOptions();
  res.cookies.set(CUSTOMER_SESSION_COOKIE, "", { ...opts, maxAge: 0 });
  return res;
}
