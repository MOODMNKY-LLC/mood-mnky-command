import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MainNav, MainFooter, MainGlassCard } from "@/components/main"
import {
  getMnkyIdEnrollmentState,
  MNKY_ID_ENROLLMENT_URL_REFERENCE,
} from "@/lib/mnky-id"
import { signUpHrefWithReturn } from "@/lib/auth/safe-return-path"

export const metadata: Metadata = {
  title: "Create a MNKY ID — MOOD MNKY",
  description:
    "Introduction to creating a MNKY ID. Public enrollment is config-gated and separately approved from VIP access.",
}

export default function MnkyIdCreateIntroPage() {
  const enrollment = getMnkyIdEnrollmentState()

  return (
    <>
      <MainNav />
      <main className="main-container w-full py-12 md:py-16">
        <header className="mx-auto max-w-3xl space-y-4 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Create
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-5xl">
            Create a MNKY ID
          </h1>
          <p className="text-base text-muted-foreground md:text-lg">
            Anyone can create a MNKY ID when enrollment is approved and enabled.
            That identity alone does not grant VIP or other service access.
          </p>
        </header>

        <section className="mx-auto mt-12 max-w-2xl space-y-6">
          <MainGlassCard className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              How enrollment works
            </h2>
            <ol className="list-decimal space-y-3 pl-5 text-sm text-muted-foreground">
              <li>
                Review this introduction (you are here). No account is created
                by opening this page.
              </li>
              <li>
                When public enrollment is activated, you complete identity
                creation in the approved IdP flow — not a new parallel password
                form on this site.
              </li>
              <li>
                VIP packages and other services remain separately approved after
                an ID exists.
              </li>
            </ol>
          </MainGlassCard>

          {enrollment.enabled ? (
            <MainGlassCard className="space-y-4 border-primary/30">
              <h2 className="text-xl font-semibold text-foreground">
                Enrollment is enabled
              </h2>
              <p className="text-sm text-muted-foreground">
                This environment has the enrollment flag and URL configured.
                Continue only if you intend to create a live identity.
              </p>
              <Button asChild size="lg">
                <a href={enrollment.url} rel="noopener noreferrer">
                  Continue to create MNKY ID
                </a>
              </Button>
            </MainGlassCard>
          ) : (
            <MainGlassCard className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">
                Preview — enrollment not live here
              </h2>
              <p className="text-sm text-muted-foreground">
                Public enrollment is not activated for this deployment. A
                hardcoded reference URL alone is not treated as live (
                <code className="text-xs">
                  {MNKY_ID_ENROLLMENT_URL_REFERENCE}
                </code>
                ). Operators enable{" "}
                <code className="text-xs">
                  NEXT_PUBLIC_MNKY_ID_ENROLLMENT_ENABLED
                </code>{" "}
                and{" "}
                <code className="text-xs">
                  NEXT_PUBLIC_MNKY_ID_ENROLLMENT_URL
                </code>{" "}
                only after separate approval.
              </p>
              <p className="text-sm text-muted-foreground">
                Meanwhile you can still use existing Dojo / shop sign-up on this
                site — unchanged and compatible.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="outline">
                  <Link href={signUpHrefWithReturn("/main")}>
                    Dojo / shop sign-up
                  </Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/main/mnky-id">Back to MNKY ID</Link>
                </Button>
              </div>
            </MainGlassCard>
          )}
        </section>
      </main>
      <MainFooter />
    </>
  )
}
