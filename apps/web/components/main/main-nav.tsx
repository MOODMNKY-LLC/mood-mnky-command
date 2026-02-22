"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Menu } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { href: "/main/about", label: "About" },
  { href: "/main/pricing", label: "Pricing" },
  { href: "/main/fragrances", label: "Fragrances" },
  { href: "/main/formulas", label: "Formulas" },
  { href: "/main/collections", label: "Collections" },
  { href: "/verse", label: "MNKY VERSE" },
  { href: "/auth/login", label: "Sign in" },
] as const

function MainSearchForm({
  className,
  onSubmitted,
}: {
  className?: string
  onSubmitted?: () => void
}) {
  const router = useRouter()
  const [q, setQ] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = q.trim()
    if (trimmed) {
      router.push(`/main/search?q=${encodeURIComponent(trimmed)}`)
      onSubmitted?.()
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("relative flex-1 max-w-xl", className)}
      role="search"
    >
      <div className="main-glass-panel main-float flex items-center gap-2 rounded-xl border border-border px-3 py-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search fragrances, formulas, and more…"
          className="h-9 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
          aria-label="Search fragrances, formulas, and more"
        />
      </div>
    </form>
  )
}

const linkClass =
  "text-sm text-muted-foreground transition-colors hover:text-foreground"

export function MainNav() {
  const [open, setOpen] = useState(false)

  return (
    <header
      className="main-container main-glass-nav sticky top-0 z-50 py-3 md:py-4"
      role="banner"
    >
      <nav
        className="flex items-center justify-between gap-4"
        aria-label="Main navigation"
      >
        <Link
          href="/main"
          className="shrink-0 text-lg font-semibold text-foreground transition-colors hover:text-primary"
        >
          MOOD MNKY
        </Link>

        {/* Center: search bar – hidden on small screens, shown md+ */}
        <div className="hidden flex-1 justify-center px-4 md:flex">
          <MainSearchForm />
        </div>

        {/* Right: nav links – hidden on small screens */}
        <div className="hidden items-center gap-5 lg:flex xl:gap-6">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className={linkClass}>
              {label}
            </Link>
          ))}
        </div>

        {/* Mobile: menu button */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="main-glass-panel-card border-l flex flex-col gap-6"
          >
            <SheetHeader>
              <SheetTitle className="text-left">Menu</SheetTitle>
            </SheetHeader>
            <MainSearchForm
              className="w-full max-w-none"
              onSubmitted={() => setOpen(false)}
            />
            <div className="flex flex-col gap-3">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={linkClass}
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  )
}
