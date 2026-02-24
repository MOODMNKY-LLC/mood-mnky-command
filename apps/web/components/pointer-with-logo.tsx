"use client"

/**
 * Wrapper for app content. Custom cursor effects (SmoothCursor) have been
 * removed for a standard chat/UI experience.
 */
export function PointerWithLogo({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
