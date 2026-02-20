"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { DojoSidebar } from "@/components/dojo/dojo-sidebar";
import { DojoContextProvider, useDojoContext } from "@/components/dojo/dojo-context-provider";
import { DojoFlowiseBubble } from "@/components/dojo/dojo-flowise-bubble";
import { DojoChatProvider } from "@/components/dojo/dojo-chat-context";
import { DojoChatSidebarWithContext } from "@/components/dojo/dojo-chat-sidebar";

function getBreadcrumbPage(pathname: string): string {
  if (pathname === "/dojo" || pathname === "/dojo/") return "Home";
  if (pathname.startsWith("/dojo/chat")) return "MNKY CHAT";
  if (pathname.startsWith("/dojo/preferences")) return "Preferences";
  if (pathname.startsWith("/dojo/crafting/saved")) return "Saved Blends";
  if (pathname.startsWith("/dojo/crafting")) return "Crafting";
  return "Home";
}

function DojoLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pageLabel = getBreadcrumbPage(pathname ?? "/dojo");
  const { contextId } = useDojoContext();

  if (contextId === "chat") {
    return (
      <DojoChatProvider>
        <DojoChatSidebarWithContext />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href="/dojo">The Dojo</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{pageLabel}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="dojo-dashboard flex-1 overflow-auto">{children}</div>
        </SidebarInset>
      </DojoChatProvider>
    );
  }

  return (
    <>
      <DojoSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/dojo">The Dojo</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{pageLabel}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="dojo-dashboard flex-1 overflow-auto">{children}</div>
        <DojoFlowiseBubble />
      </SidebarInset>
    </>
  );
}

export function DojoDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DojoContextProvider>
      <SidebarProvider>
        <DojoLayoutInner>{children}</DojoLayoutInner>
      </SidebarProvider>
    </DojoContextProvider>
  );
}
