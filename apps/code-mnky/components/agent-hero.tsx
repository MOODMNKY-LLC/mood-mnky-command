import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getAgentAvatarUrl } from "@/lib/agent-avatar"

const DEFAULT_SUBLINE = "Your virtual A.I. coding companion."
const DEFAULT_DESCRIPTION = "DevOps expertise, code completions, and step-by-step technical guidance."

export function AgentHero({
  subline,
  description,
}: { subline?: string | null; description?: string | null } = {}) {
  const avatarUrl = getAgentAvatarUrl()
  const s = subline ?? DEFAULT_SUBLINE
  const d = description ?? DEFAULT_DESCRIPTION
  return (
    <section
      className="flex min-h-[var(--main-hero-min-height)] flex-col justify-center py-16 md:flex-row md:items-center md:gap-12"
      style={{ gap: "var(--main-section-gap-sm)" }}
    >
      <div className="flex flex-1 flex-col justify-center" style={{ gap: "var(--main-section-gap-sm)" }}>
        <h1
          className="font-bold tracking-tight text-foreground"
          style={{ fontSize: "var(--main-hero-title-size)" }}
        >
          CODE MNKY
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground font-sans">
          {s}
        </p>
        <p
          className="max-w-2xl text-muted-foreground font-sans"
          style={{ fontSize: "var(--main-hero-subtitle-size)" }}
        >
          {d}
        </p>
        <div className="flex flex-wrap gap-4">
          <Button size="lg" asChild>
            <Link href="/">Snippets</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/">Tools</Link>
          </Button>
        </div>
      </div>
      <div className="flex flex-1 justify-center md:justify-end">
        <div className="main-glass-panel main-float rounded-2xl p-4">
          <img
            src={avatarUrl}
            alt="CODE MNKY"
            className="h-48 w-48 object-contain md:h-64 md:w-64"
            width={256}
            height={256}
            sizes="(max-width: 768px) 192px, 256px"
          />
        </div>
      </div>
    </section>
  )
}
