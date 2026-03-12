import { DojoAuthContext } from "@/components/dojo/dojo-auth-context";
import { DojoDashboardLayout } from "@/components/dojo/dojo-dashboard-layout";

/**
 * Server layout for dojo member hub (/dojo/me). Provides DojoAuthContext (server)
 * so that supabase/server and next/headers are never imported in the client bundle.
 */
export default function DojoMemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DojoAuthContext>
      <DojoDashboardLayout>{children}</DojoDashboardLayout>
    </DojoAuthContext>
  );
}
