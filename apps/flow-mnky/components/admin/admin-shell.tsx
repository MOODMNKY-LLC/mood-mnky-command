'use client'

import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'

interface AdminShellProps {
  children: React.ReactNode
}

const MOBILE_BREAKPOINT = 768

export function AdminShell({ children }: AdminShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [isMobile, setIsMobile] = useState<boolean | null>(null)
  const showMobileShell = isMobile === true
  const showDesktopSidebar = isMobile === false

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const update = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [])

  return (
    <div className="flex h-svh w-full bg-background">
      {showDesktopSidebar && <AdminSidebar className="flex" />}

      <div className="flex min-w-0 flex-1 flex-col">
        {showMobileShell && (
          <header className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open admin navigation"
            >
              <Menu className="w-4 h-4" />
            </Button>
            <div>
              <p className="text-sm font-semibold">Admin Console</p>
              <p className="text-xs text-muted-foreground">Manage Flowise, n8n, and workspace tooling</p>
            </div>
          </header>
        )}

        <main className="min-w-0 flex-1 overflow-auto">
          {children}
        </main>
      </div>

      <Sheet open={showMobileShell ? mobileNavOpen : false} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetTitle className="sr-only">Admin navigation</SheetTitle>
          <AdminSidebar className="flex w-full border-r-0" onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
