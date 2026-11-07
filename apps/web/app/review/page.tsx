import Link from "next/link"

const INTENDED_GATES = [
  {
    title: "Real Dojo member hub",
    href: "/dojo/me",
    note: "Intended gate — requires a real signed-in, approved member. Not unlocked by review flags.",
  },
  {
    title: "Blog / quests / preferences / profile",
    href: "/dojo/blog",
    note: "Intended gates on live storefront — sign-in required. Use illustrative links below for preview.",
  },
] as const

const ILLUSTRATIVE = [
  {
    title: "Member home + private services",
    href: "/review/member-home",
    note: "Sample member space and entitlement states.",
  },
  {
    title: "Quests (sample)",
    href: "/review/quests",
    note: "Read-only quest cards — not tracked progress.",
  },
  {
    title: "Preferences (sample)",
    href: "/review/preferences",
    note: "Read-only preference labels — writes disabled.",
  },
  {
    title: "Profile (sample)",
    href: "/review/profile",
    note: "Illustrative profile summary — not a real account.",
  },
  {
    title: "Blog (sample)",
    href: "/review/blog",
    note: "Placeholder posts — not live CMS content.",
  },
] as const

/**
 * Review hub: separates intended auth gates from illustrative preview navigation.
 * No credentials, no sessions, no genuine rights.
 */
export default function ReviewHubPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 p-4 md:p-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Unified experience · review hub
        </h1>
        <p className="text-sm text-muted-foreground">
          Use illustrative routes to walk the journey without fake credentials or
          a live identity backend. Review flags never grant Dojo, LABZ, VIP, or
          API rights.
        </p>
        <p className="text-sm">
          <Link
            href="/main?review=1"
            className="underline underline-offset-2"
          >
            Brand home
          </Link>
          {" · "}
          <Link href="/auth/login?review=1" className="underline underline-offset-2">
            Account entry
          </Link>
          {" · "}
          <Link
            href="/dojo/blending-guide"
            className="underline underline-offset-2"
          >
            Public blending guide
          </Link>
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Illustrative (safe demo)
        </h2>
        <ul className="space-y-3">
          {ILLUSTRATIVE.map((item) => (
            <li
              key={item.href}
              className="rounded-xl border border-border/60 bg-card/40 px-4 py-3"
            >
              <Link
                href={item.href}
                className="font-medium underline-offset-2 hover:underline"
              >
                {item.title}
              </Link>
              <p className="mt-1 text-xs text-muted-foreground">{item.note}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Intended live gates (expect sign-in)
        </h2>
        <ul className="space-y-3">
          {INTENDED_GATES.map((item) => (
            <li
              key={item.href}
              className="rounded-xl border border-dashed border-border px-4 py-3"
            >
              <p className="font-medium">{item.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.note}</p>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                {item.href}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
