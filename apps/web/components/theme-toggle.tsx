"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"

/**
 * Theme toggle for the main app (LABZ dashboard).
 * Uses next-themes; cycles between light and dark.
 * Supports asChild for use inside SidebarMenuButton.
 * Deferred icon render to avoid hydration mismatch (theme comes from localStorage).
 */
export const ThemeToggle = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button">
>(function ThemeToggle({ onClick, className, ...props }, ref) {
  const [mounted, setMounted] = React.useState(false)
  const { setTheme, resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    setTheme(isDark ? "light" : "dark")
    onClick?.(e)
  }

  // Render a neutral placeholder during SSR / before mount to avoid hydration mismatch.
  // Theme is resolved from localStorage, which differs from server.
  if (!mounted) {
    return (
      <button
        ref={ref}
        type="button"
        onClick={handleToggle}
        className={className}
        title="Toggle theme"
        aria-label="Toggle theme"
        {...props}
      >
        <span className="h-4 w-4" aria-hidden />
      </button>
    )
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleToggle}
      className={className}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label="Toggle theme"
      {...props}
    >
      {isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  )
})
