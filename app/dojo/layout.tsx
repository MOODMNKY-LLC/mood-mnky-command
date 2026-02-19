import { DojoAuthContext } from "@/components/dojo/dojo-auth-context";
import { DojoDashboardLayout } from "@/components/dojo/dojo-dashboard-layout";

export default function DojoLayout({
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
