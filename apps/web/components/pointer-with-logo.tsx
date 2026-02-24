"use client"

import { Pointer } from "@/components/ui/pointer"

/**
 * Wraps the app so the custom cursor (logo-hair.svg) is shown when hovering.
 * Pointer attaches to its parent; this div is that parent.
 */
export function PointerWithLogo({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full">
      <Pointer>
        {/* Custom pointer per Magic UI docs: https://magicui.design/docs/components/pointer */}
        <img
          src="/auth/logo-hair.svg"
          alt=""
          className="h-8 w-auto"
          width={24}
          height={34}
          aria-hidden
        />
      </Pointer>
      {children}
    </div>
  )
}
