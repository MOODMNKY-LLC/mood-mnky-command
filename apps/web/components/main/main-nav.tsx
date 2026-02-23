"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Menu, ChevronDown } from "lucide-react"
import { VerseLogoHairIcon } from "@/components/verse/verse-logo-hair-icon"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import { useMainTalkToAgent } from "@/components/main/main-talk-to-agent-context"
import { BrandMatrixText } from "@/components/main/elevenlabs/brand-matrix-text"
import { MainNavAuth } from "@/components/main/main-nav-auth"
import { cn } from "@/lib/utils"

const COLLECTIONS_LINKS = [
  { href: "/main/collections/shop", label: "Shop" },
  { href: "/main/collections/fragrances", label: "Fragrances" },
  { href: "/main/collections/formulas", label: "Formulas" },
] as const

const NAV_LINKS = [
  { href: "/main/about", label: "About" },
  { href: "/main/design", label: "Design" },
  { href: "/main/services", label: "Services" },
  { href: "/main/community", label: "Community" },
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
          placeholder="Search fragrances, formulas, services, and more…"
          className="h-9 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
          aria-label="Search fragrances, formulas, and services"
        />
      </div>
    </form>
  )
}

const linkClass =
  "text-sm text-muted-foreground transition-colors hover:text-foreground"

export function MainNav() {
  const [open, setOpen] = useState(false)
  const talk = useMainTalkToAgent()

  return (
    <header
      className="main-container main-glass-nav sticky top-0 z-50 mx-4 mt-4 rounded-2xl py-3 md:py-4"
      role="banner"
    >
      <nav
        className="flex items-center justify-between gap-4"
        aria-label="Main navigation"
      >
        <Link
          href="/main"
          className="relative flex shrink-0 items-center gap-2 overflow-hidden rounded-md py-1 pr-1 text-lg font-semibold text-foreground transition-colors hover:text-primary"
          aria-label="MOOD MNKY – Home"
        >
          <VerseLogoHairIcon
            withRing
            size="sm"
            className="relative z-10 text-foreground"
            ringClassName="border-foreground/80"
          />
          <BrandMatrixText
            variant="MOOD MNKY"
            size={3}
            gap={1}
            className="h-6 w-auto"
          />
        </Link>

        {/* Center: search bar – hidden on small screens, shown md+ */}
        <div className="hidden flex-1 justify-center px-4 md:flex">
          <MainSearchForm />
        </div>

        {/* Right: theme toggler + nav links + collections dropdown – hidden on small screens */}
        <div className="hidden items-center gap-5 lg:flex xl:gap-6">
          <AnimatedThemeToggler
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Toggle theme"
          />
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(linkClass, "flex items-center gap-0.5 outline-none")}
              aria-haspopup="menu"
              aria-label="Collections menu"
            >
              Collections
              <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="main-glass-panel-card min-w-[10rem] border-border rounded-xl p-1"
            >
              {COLLECTIONS_LINKS.map(({ href, label }) => (
                <DropdownMenuItem key={href} asChild>
                  <Link href={href} className="cursor-pointer">
                    {label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className={linkClass}>
              {label}
            </Link>
          ))}
          <MainNavAuth />
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
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted-foreground">Theme</span>
              <AnimatedThemeToggler
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Toggle theme"
              />
            </div>
            {talk && (
              <Button
                variant="outline"
                className="w-full justify-center"
                aria-label="Talk to MOOD MNKY"
                onClick={() => {
                  talk.openDialog()
                  setOpen(false)
                }}
              >
                <VerseLogoHairIcon
                  withRing
                  size="sm"
                  className="mr-2 text-foreground"
                  ringClassName="border-foreground/80"
                />
                Talk to <BrandMatrixText variant="MOOD MNKY" size={2} gap={1} className="ml-1 inline-block h-4 align-middle" />
              </Button>
            )}
            <MainSearchForm
              className="w-full max-w-none"
              onSubmitted={() => setOpen(false)}
            />
            <div className="flex flex-col gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(linkClass, "flex items-center gap-1 outline-none text-left")}
                  aria-haspopup="menu"
                  aria-label="Collections menu"
                >
                  Collections
                  <ChevronDown className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="main-glass-panel-card border-border rounded-xl p-1"
                >
                  {COLLECTIONS_LINKS.map(({ href, label }) => (
                    <DropdownMenuItem key={href} asChild>
                      <Link
                        href={href}
                        className="cursor-pointer"
                        onClick={() => setOpen(false)}
                      >
                        {label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
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
              <MainNavAuth className="self-start" />
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  )
}
