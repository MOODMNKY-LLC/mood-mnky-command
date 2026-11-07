import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  MainNav,
  MainFooter,
  MainGlassCard,
} from "@/components/main"
import { MainMnkyIdCta } from "@/components/main/main-mnky-id-cta"
import {
  getMnkyIdEnrollmentState,
  getMnkyIdVipPortalState,
} from "@/lib/mnky-id"
import { loginHrefWithReturn } from "@/lib/auth/safe-return-path"

export const metadata: Metadata = {
  title: "MNKY ID — MOOD MNKY",
  description:
    "Learn what a MNKY ID is, how it differs from Dojo/shop sign-in, and why VIP and services need separate approval.",
}

export default function MnkyIdIntroPage() {
  const enrollment = getMnkyIdEnrollmentState()
  const vip = getMnkyIdVipPortalState()

  return (
    <>
      <MainNav />
      <main className="main-container w-full py-12 md:py-16">
        <header className="mx-auto max-w-3xl space-y-4 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Identity
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-5xl">
            MNKY ID
          </h1>
          <p className="text-base text-muted-foreground md:text-lg">
            MNKY ID is the common account direction for the MOOD MNKY brand.
            Creating an ID does not unlock VIP packages, mesh services, or LABZ
            admin access — those still require separate approval.
          </p>
        </header>

        <section
          className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2"
          aria-label="What a MNKY ID is and is not"
        >
          <MainGlassCard className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">What it is</h2>
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>A brand identity you can create when enrollment is enabled.</li>
              <li>
                The planned common login for VIP portal and related member
                experiences.
              </li>
              <li>
                Separate from existing Dojo / shop email, Discord, GitHub, and
                password sign-in on this site.
              </li>
            </ul>
          </MainGlassCard>
          <MainGlassCard className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">
              What it is not
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>Not an automatic VIP membership or service grant.</li>
              <li>Not a replacement for current Dojo or LABZ login handlers.</li>
              <li>
                Not proof that public enrollment is live — that is
                config-gated and separately approved.
              </li>
            </ul>
          </MainGlassCard>
        </section>

        <section className="mx-auto mt-12 max-w-3xl space-y-6 text-center">
          <h2 className="text-2xl font-semibold text-foreground">Next steps</h2>
          <MainMnkyIdCta layout="stack" className="items-center" />
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button asChild variant="outline">
              <Link href="/main/mnky-id/create">Create-ID introduction</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/main/mnky-id/sign-in">Sign-in options</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href={loginHrefWithReturn("/main")}>
                Use existing site login
              </Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Enrollment status:{" "}
            {enrollment.enabled
              ? "live link enabled for this environment."
              : enrollment.reason === "url_missing"
                ? "flag on but enrollment URL missing — CTA hidden."
                : "preview only — public enrollment not activated."}{" "}
            VIP portal link:{" "}
            {vip.enabled
              ? "configured."
              : "config-gated off (no silent deep-link)."}
          </p>
        </section>
      </main>
      <MainFooter />
    </>
  )
}
