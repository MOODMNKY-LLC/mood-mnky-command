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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import { ThemePaletteSwitcher } from "@/components/theme-palette-switcher"
import { useMainTalkToAgent } from "@/components/main/main-talk-to-agent-context"
import { BrandMatrixText } from "@/components/main/elevenlabs/brand-matrix-text"
import { MainNavAuth } from "@/components/main/main-nav-auth"
import { cn } from "@/lib/utils"
import { ROUTES } from "@/lib/nav-routes"
import {
  COLLECTIONS_LINKS,
  ABOUT_LINKS,
  JOIN_LINKS,
  DOJO_CTA,
} from "@/lib/main-nav-config"

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
      router.push(`${ROUTES.MAIN_SEARCH}?q=${encodeURIComponent(trimmed)}`)
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

type NavLink = { href: string; label: string }

function MainNavDropdown({
  links,
  label,
  ariaLabel,
  tooltip,
  onNavigate,
  triggerClassName,
}: {
  links: readonly NavLink[]
  label: string
  ariaLabel: string
  tooltip: string
  onNavigate?: () => void
  triggerClassName?: string
}) {
  const content = (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(linkClass, "flex items-center gap-0.5 outline-none", triggerClassName)}
        aria-haspopup="menu"
        aria-label={ariaLabel}
      >
        {label}
        <ChevronDown className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="main-glass-panel-card min-w-[10rem] border-border rounded-xl p-1"
      >
        {links.map(({ href, label: itemLabel }) => (
          <DropdownMenuItem key={href} asChild>
            <Link
              href={href}
              className="cursor-pointer"
              onClick={onNavigate}
            >
              {itemLabel}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}

export function MainNav() {
  const [open, setOpen] = useState(false)
  const talk = useMainTalkToAgent()
  const onMobileNav = () => setOpen(false)

  return (
    <header
      className="main-container main-glass-nav sticky top-0 z-50 mx-4 mt-4 rounded-2xl py-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:py-4"
      role="banner"
    >
      <nav
        className="flex items-center justify-between gap-4"
        aria-label="Main navigation"
      >
        <Link
          href={ROUTES.MAIN}
          className="relative flex shrink-0 items-center gap-2 overflow-hidden rounded-md py-1 pr-1 text-lg font-semibold text-foreground transition-colors hover:text-primary"
          aria-label="MOOD MNKY – Home"
        >
          <VerseLogoHairIcon
            withRing
            size="md"
            className="relative z-10 h-6 w-6 text-foreground"
            ringClassName="border-foreground/80"
          />
          <BrandMatrixText
            variant="MOOD MNKY"
            size={3}
            gap={1}
            className="h-6 w-auto"
            animation="flicker"
            static={false}
          />
        </Link>

        <div className="hidden flex-1 justify-center px-4 md:flex">
          <MainSearchForm />
        </div>

        <div className="hidden items-center gap-5 lg:flex xl:gap-6">
          <ThemePaletteSwitcher
            className="text-muted-foreground transition-colors hover:text-foreground"
          />
          <AnimatedThemeToggler
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Toggle theme"
          />
          <MainNavDropdown
            links={COLLECTIONS_LINKS}
            label="Collections"
            ariaLabel="Collections menu"
            tooltip="Shop, fragrances, and formulas"
          />
          <MainNavDropdown
            links={ABOUT_LINKS}
            label="About"
            ariaLabel="About menu"
            tooltip="What we offer: brand, design, media, and services"
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className="font-medium shrink-0"
                asChild
              >
                <Link href={DOJO_CTA.href}>{DOJO_CTA.label}</Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              {DOJO_CTA.tooltip}
            </TooltipContent>
          </Tooltip>
          <MainNavDropdown
            links={JOIN_LINKS}
            label="Join"
            ariaLabel="Join menu"
            tooltip="Community and loyalty"
          />
          <MainNavAuth />
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="min-h-[44px] min-w-[44px] shrink-0 lg:hidden"
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
              <span className="text-sm text-muted-foreground">Palette</span>
              <ThemePaletteSwitcher className="text-muted-foreground transition-colors hover:text-foreground" />
            </div>
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
              onSubmitted={onMobileNav}
            />
            <div className="flex flex-col gap-1">
              <MainNavDropdown
                links={COLLECTIONS_LINKS}
                label="Collections"
                ariaLabel="Collections menu"
                tooltip="Shop, fragrances, and formulas"
                onNavigate={onMobileNav}
                triggerClassName="flex min-h-[44px] items-center gap-1 rounded-md text-left"
              />
              <MainNavDropdown
                links={ABOUT_LINKS}
                label="About"
                ariaLabel="About menu"
                tooltip="What we offer: brand, design, media, and services"
                onNavigate={onMobileNav}
                triggerClassName="flex min-h-[44px] items-center gap-1 rounded-md text-left"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="default" size="sm" className="w-full justify-center font-medium min-h-[44px]" asChild>
                    <Link href={DOJO_CTA.href} onClick={onMobileNav}>
                      {DOJO_CTA.label}
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  {DOJO_CTA.tooltip}
                </TooltipContent>
              </Tooltip>
              <MainNavDropdown
                links={JOIN_LINKS}
                label="Join"
                ariaLabel="Join menu"
                tooltip="Community and loyalty"
                onNavigate={onMobileNav}
                triggerClassName="flex min-h-[44px] items-center gap-1 rounded-md text-left"
              />
              <MainNavAuth className="self-start" />
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  )
}
