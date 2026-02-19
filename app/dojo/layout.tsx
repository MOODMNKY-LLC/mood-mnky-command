import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { DojoSidebar } from "@/components/dojo/dojo-sidebar";
import { DojoAuthContext } from "@/components/dojo/dojo-auth-context";

export default function DojoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DojoAuthContext>
      <SidebarProvider>
        <DojoSidebar />
        <SidebarInset>
          <header className="flex h-14 min-h-[44px] shrink-0 items-center justify-between gap-2 border-b border-border px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1 min-h-[44px] min-w-[44px]" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <span className="text-sm font-medium text-muted-foreground">
                The Dojo
              </span>
            </div>
          </header>
          <div className="dojo-dashboard flex-1 overflow-auto">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </DojoAuthContext>
  );
}
