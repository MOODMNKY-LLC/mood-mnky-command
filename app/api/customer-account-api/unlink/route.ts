/**
 * Shopify Customer Account API - Unlink.
 * POST /api/customer-account-api/unlink
 * Requires Supabase auth. Clears session cookie and profile shopify_customer_id;
 * optionally deletes the token row for the current session.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  CUSTOMER_SESSION_COOKIE,
  getCustomerSessionCookieOptions,
} from "@/lib/shopify/customer-account-auth";
import { cookies } from "next/headers";

function clearCookie(response: NextResponse) {
  const opts = getCustomerSessionCookieOptions();
  response.cookies.set(CUSTOMER_SESSION_COOKIE, "", {
    ...opts,
    maxAge: 0,
  });
  return response;
}

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cookieStore = await cookies();
  const tokenId = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;

  const adminSupabase = createAdminClient();
  if (tokenId) {
    await adminSupabase
      .from("customer_account_tokens")
      .delete()
      .eq("id", tokenId);
  }

  await adminSupabase
    .from("profiles")
    .update({ shopify_customer_id: null })
    .eq("id", user.id);

  const response = NextResponse.json({ success: true });
  return clearCookie(response);
}
