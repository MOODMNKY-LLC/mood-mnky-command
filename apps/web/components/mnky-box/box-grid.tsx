import * as React from "react"

export function BoxGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
      style={{ gap: "var(--mnky-box-grid-gap)" }}
    >
      {children}
    </div>
  )
}
