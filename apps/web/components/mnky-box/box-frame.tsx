import * as React from "react"

export function BoxFrame({ children }: { children: React.ReactNode }) {
  return (
    <section className="mnky-box p-6">
      <div
        className="mx-auto border-[length:var(--mnky-box-frame-width)] border-mnkyBox-border-frame bg-mnkyBox-bg p-6 max-w-mnky-container"
        style={{ borderWidth: "var(--mnky-box-frame-width)" }}
      >
        {children}
      </div>
    </section>
  )
}
