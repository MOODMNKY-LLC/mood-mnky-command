"use client"

import Link from "next/link"

export function MainNav() {
  return (
    <header className="main-container main-glass-nav sticky top-0 z-50 py-4" role="banner">
      <nav
        className="flex items-center justify-between"
        aria-label="Main navigation"
      >
        <Link
          href="/main"
          className="text-lg font-semibold text-foreground transition-colors hover:text-primary"
        >
          MOOD MNKY
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/main/about"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            About
          </Link>
          <Link
            href="/main/pricing"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </Link>
          <Link
            href="/verse"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            MNKY VERSE
          </Link>
          <Link
            href="/auth/login"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
        </div>
      </nav>
    </header>
  )
}
