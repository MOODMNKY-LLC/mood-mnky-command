import * as React from "react"

export function BoxHero({
  kicker = "MNKY BOX",
  title = "THE SUMMER DROP",
  subhead = "A seasonal selection—built to bottle the mood.",
  lore,
  children,
}: {
  kicker?: string
  title?: string
  subhead?: string
  lore?: string | null
  children?: React.ReactNode
}) {
  return (
    <header className="py-16 text-center">
      <div className="text-mnkyBox-text-secondary text-xs font-bold uppercase tracking-[0.18em]">
        {kicker}
      </div>
      <h1 className="mt-3 text-4xl font-extrabold uppercase tracking-tight md:text-6xl text-mnkyBox-text">
        {title}
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-mnkyBox-text-secondary leading-relaxed">
        {subhead}
      </p>
      {children ? <div className="mt-10">{children}</div> : null}
      {lore ? (
        <p className="mx-auto mt-10 max-w-3xl text-mnkyBox-text-muted leading-relaxed">
          {lore}
        </p>
      ) : null}
    </header>
  )
}
