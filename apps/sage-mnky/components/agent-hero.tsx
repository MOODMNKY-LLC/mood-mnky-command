import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getAgentAvatarUrl } from "@/lib/agent-avatar"

export function AgentHero() {
  const avatarUrl = getAgentAvatarUrl()
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
          SAGE MNKY
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Wisdom-focused advisor and mentor.
        </p>
        <p
          className="max-w-2xl text-muted-foreground"
          style={{ fontSize: "var(--main-hero-subtitle-size)" }}
        >
          Thoughtful guidance, reflection, and perspective for complex decisions and growth.
        </p>
        <div className="flex flex-wrap gap-4">
          <Button size="lg" asChild>
            <Link href="/">Reflect</Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/">Guides</Link>
          </Button>
        </div>
      </div>
      <div className="flex flex-1 justify-center md:justify-end">
        <div className="main-glass-panel main-float rounded-2xl p-4">
          <img
            src={avatarUrl}
            alt="SAGE MNKY"
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
