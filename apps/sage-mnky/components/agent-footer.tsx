import Link from "next/link"

const MAIN_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL || "https://www.moodmnky.com"

export function AgentFooter() {
  return (
    <footer className="main-glass-footer mt-auto">
      <div className="main-container flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted-foreground">
          SAGE MNKY – Wisdom-focused advisor. Guidance, reflection, perspective.
        </p>
        <div className="flex flex-wrap gap-6 text-sm">
          <Link href={MAIN_URL + "/main"} className="text-muted-foreground hover:text-foreground">
            Main site
          </Link>
          <Link
            href={MAIN_URL + "/dojo"}
            className="text-muted-foreground hover:text-foreground"
          >
            The Dojo
          </Link>
        </div>
      </div>
    </footer>
  )
}
