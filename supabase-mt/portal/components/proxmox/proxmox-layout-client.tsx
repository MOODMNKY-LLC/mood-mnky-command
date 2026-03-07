"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  FolderOpen,
  Box,
  Cpu,
  HardDrive,
  PanelLeft,
} from "lucide-react";
import { ProxmoxServerView } from "./proxmox-server-view";
import { ProxmoxTasksFooter } from "./proxmox-tasks-footer";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard/proxmox", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/proxmox/cluster", label: "Cluster", icon: FolderOpen },
  { href: "/dashboard/proxmox/nodes", label: "Nodes", icon: Box },
  { href: "/dashboard/proxmox/vms", label: "VMs & LXCs", icon: Cpu },
  { href: "/dashboard/proxmox/storage", label: "Storage", icon: HardDrive },
];

type Props = { children: React.ReactNode };

export function ProxmoxLayoutClient({ children }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex min-h-0 flex-1">
        {/* Desktop: fixed-width Server View */}
        <aside
          className={cn(
            "hidden w-[240px] shrink-0 flex-col md:flex",
            "border-r border-border/50 bg-muted/20"
          )}
          aria-label="Server View"
        >
          <ProxmoxServerView />
        </aside>

        {/* Right column: nav + content + footer */}
        <div className="flex min-w-0 flex-1 flex-col">
          <nav className="flex flex-wrap items-center gap-2 border-b border-border/50 bg-muted/30 px-2 py-2 md:px-4">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="sm" className="gap-1.5" aria-label="Open Server View">
                  <PanelLeft className="h-4 w-4" />
                  Server View
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Server View</SheetTitle>
                </SheetHeader>
                <div className="h-full pt-6">
                  <ProxmoxServerView />
                </div>
              </SheetContent>
            </Sheet>
            {nav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="@container/main flex min-h-0 flex-1 flex-col gap-2">
            <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
              {children}
            </div>
            <ProxmoxTasksFooter />
          </div>
        </div>
      </div>
    </div>
  );
}
