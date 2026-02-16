"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"

/**
 * Theme toggle for the main app (LABZ dashboard).
 * Uses next-themes; cycles between light and dark.
 * Supports asChild for use inside SidebarMenuButton.
 */
export const ThemeToggle = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button">
>(function ThemeToggle({ onClick, className, ...props }, ref) {
  const { setTheme, resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
    setTheme(isDark ? "light" : "dark")
    onClick?.(e)
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={handleToggle}
      className={className}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
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
