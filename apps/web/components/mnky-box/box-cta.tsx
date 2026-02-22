import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function BoxCTA({
  title = "Enter the MNKY VERSE",
  href = "/verse",
  label = "Unlock Members Access",
}: {
  title?: string
  href?: string
  label?: string
}) {
  return (
    <section className="border-mnkyBox-border-subtle border-t py-20 text-center">
      <h2 className="text-4xl font-semibold text-mnkyBox-text">{title}</h2>
      <Button
        asChild
        className="mt-8 bg-mnkyBox-accent-primary font-semibold uppercase text-black hover:opacity-90"
      >
        <Link href={href}>{label}</Link>
      </Button>
    </section>
  )
}
