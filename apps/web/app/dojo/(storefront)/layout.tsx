import { VerseAuthContext } from "@/components/verse/verse-auth-context";
import { DojoStorefrontChrome } from "../dojo-storefront-chrome";

/**
 * Server layout for dojo storefront routes. Provides VerseAuthContext (server)
 * so that customer-account-client and next/headers are never imported in the client bundle.
 */
export default function DojoStorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <VerseAuthContext>
      <DojoStorefrontChrome>{children}</DojoStorefrontChrome>
    </VerseAuthContext>
  );
}
