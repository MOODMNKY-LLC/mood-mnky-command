"use client"

import { SmoothCursor } from "@/components/ui/smooth-cursor"

/**
 * Renders a physics-based smooth cursor using logo-hair.svg.
 * Theme-aware: black in light mode, white in dark mode (via dark:invert).
 * @see https://magicui.design/docs/components/smooth-cursor
 */
export function PointerWithLogo({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full cursor-none">
      <SmoothCursor
        cursor={
          <img
            src="/auth/logo-hair.svg"
            alt=""
            className="h-8 w-auto dark:invert"
            width={24}
            height={34}
            aria-hidden
          />
        }
      />
      {children}
    </div>
  )
}
