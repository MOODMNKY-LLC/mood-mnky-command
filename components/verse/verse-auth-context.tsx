import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentCustomer } from "@/lib/shopify/customer-account-client";
import { VerseProviders } from "./verse-providers";
import { VerseStorefrontShell } from "./verse-storefront-shell";

/** Server component: fetches user + profile (Supabase or Shopify Customer Account API), passes to shell */
export async function VerseAuthContext({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  let profile: { display_name?: string } | null = null;

  if (user && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const admin = createAdminClient();
      const { data } = await admin
        .from("profiles")
        .select("role, is_admin, display_name")
        .eq("id", user.id)
        .single();
      if (data) {
        profile = data;
        isAdmin = data.role === "admin" || data.is_admin === true;
      }
    } catch {
      // Fallback to session client
      const { data } = await supabase
        .from("profiles")
        .select("role, is_admin, display_name")
        .eq("id", user.id)
        .single();
      if (data) {
        profile = data;
        isAdmin = data.role === "admin" || data.is_admin === true;
      }
    }
  }

  let userInfo: { id: string; email?: string; displayName?: string } | null =
    user
      ? {
          id: user.id,
          email: user.email ?? undefined,
          displayName: profile?.display_name ?? undefined,
        }
      : null;

  if (!userInfo) {
    const shopifyCustomer = await getCurrentCustomer();
    if (shopifyCustomer) {
      userInfo = {
        id: shopifyCustomer.id,
        email: shopifyCustomer.email,
        displayName: shopifyCustomer.displayName,
      };
    }
  }

  return (
    <VerseProviders>
      <VerseStorefrontShell isAdmin={isAdmin} user={userInfo}>
        {children}
      </VerseStorefrontShell>
    </VerseProviders>
  );
}
