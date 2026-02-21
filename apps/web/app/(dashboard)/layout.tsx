"use client"

import React, { useState, useEffect } from "react"

import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { LabzContextProvider } from "@/components/labz-context-provider"
import { Separator } from "@/components/ui/separator"
import { AppInfoDialog } from "@/components/app-info-dialog"
import { DocsButton } from "@/components/docs/docs-button"
import { DocsProvider } from "@/components/docs/docs-context"
import { Toaster } from "@/components/ui/sonner"
import { LabzDock } from "@/components/labz/labz-dock"
import { LabzPersonaStateProvider } from "@/components/labz/labz-persona-state-context"

/**
 * Skeleton shown until client mount. Avoids Radix useId() hydration mismatch
 * (server vs client generate different id/aria-controls) by not rendering
 * Radix-heavy UI or page content until after hydration.
 */
function DashboardLayoutSkeleton() {
  return (
    <div className="flex min-h-screen w-full">
      <div className="w-16 shrink-0 border-r border-sidebar-border bg-sidebar" aria-hidden />
      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex h-14 min-h-[44px] shrink-0 items-center justify-between gap-2 border-b border-border px-4">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 shrink-0 rounded-md bg-muted" />
            <div className="mr-2 h-4 w-px shrink-0 bg-border" role="separator" />
            <span className="text-sm font-medium text-muted-foreground">
              MOOD MNKY LABZ
            </span>
          </div>
        </header>
        <div className="flex-1 overflow-auto" />
      </div>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return (
      <>
        <Toaster />
        <DashboardLayoutSkeleton />
      </>
    )
  }

  return (
    <DocsProvider>
      <Toaster />
      <LabzContextProvider>
        <SidebarProvider>
          <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 min-h-[44px] shrink-0 items-center justify-between gap-2 border-b border-border px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1 min-h-[44px] min-w-[44px]" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <span className="text-sm font-medium text-muted-foreground">
                MOOD MNKY LABZ
              </span>
            </div>
            <div className="flex items-center gap-1">
              <AppInfoDialog variant="labz" />
              <DocsButton />
            </div>
          </header>
          <div className="flex-1 overflow-auto">{children}</div>
        </SidebarInset>
          <LabzPersonaStateProvider>
            <LabzDock />
          </LabzPersonaStateProvider>
        </SidebarProvider>
      </LabzContextProvider>
    </DocsProvider>
  )
}
