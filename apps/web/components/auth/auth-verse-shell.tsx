"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

/**
 * Syncs next-themes resolved theme to data-verse-theme for verse-storefront CSS.
 * Auth pages use next-themes (via AuthModeToggle); Verse uses its own VerseThemeProvider.
 * This wrapper lets auth inherit verse tokens without duplicating theme logic.
 */
export function AuthVerseShell({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const verseTheme = !mounted
    ? "light"
    : resolvedTheme === "dark"
      ? "dark"
      : "light"

  return (
    <div
      className="verse-storefront auth-shell min-h-svh"
      data-verse-theme={verseTheme}
    >
      {children}
    </div>
  )
}
