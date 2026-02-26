import Link from "next/link"
import { Button } from "@/components/ui/button"

const AUTH_URL =
  process.env.NEXT_PUBLIC_MAIN_AUTH_URL || "https://mnky-command.moodmnky.com/auth"
const MAIN_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL || "https://www.moodmnky.com"

export function AgentNav() {
  return (
    <header className="sticky top-0 z-50 w-full main-glass-nav">
      <div className="main-container flex h-14 items-center justify-between">
        <Link href="/" className="font-semibold text-foreground">
          MOOD MNKY
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/roadmap"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Roadmap
          </Link>
          <Link
            href={MAIN_URL}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Main site
          </Link>
          <Button variant="outline" size="sm" asChild>
            <Link href={AUTH_URL}>Sign in</Link>
          </Button>
        </nav>
      </div>
    </header>
  )
}
