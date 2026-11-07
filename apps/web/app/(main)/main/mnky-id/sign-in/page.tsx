import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MainNav, MainFooter, MainGlassCard } from "@/components/main"
import { getMnkyIdVipPortalState } from "@/lib/mnky-id"
import { loginHrefWithReturn } from "@/lib/auth/safe-return-path"

export const metadata: Metadata = {
  title: "Sign in options — MNKY ID — MOOD MNKY",
  description:
    "Clarify existing Dojo/shop/LABZ sign-in versus MNKY ID. No parallel password system.",
}

export default function MnkyIdSignInIntroPage() {
  const vip = getMnkyIdVipPortalState()

  return (
    <>
      <MainNav />
      <main className="main-container w-full py-12 md:py-16">
        <header className="mx-auto max-w-3xl space-y-4 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Sign in
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-5xl">
            Existing sign-in options
          </h1>
          <p className="text-base text-muted-foreground md:text-lg">
            This brand site keeps current Supabase email/password and social
            logins. We are not introducing a second password system on Main.
          </p>
        </header>

        <section className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2">
          <MainGlassCard className="flex flex-col space-y-3">
            <h2 className="text-xl font-semibold text-foreground">
              Dojo / shop (this site)
            </h2>
            <p className="flex-1 text-sm text-muted-foreground">
              Email and password, Discord (Dojo), GitHub (LABZ tab), and other
              existing handlers under{" "}
              <code className="text-xs">/auth</code>. Callbacks and recovery
              flows stay as they are.
            </p>
            <Button asChild>
              <Link href={loginHrefWithReturn("/main")}>
                Sign in (return to Main)
              </Link>
            </Button>
          </MainGlassCard>

          <MainGlassCard className="flex flex-col space-y-3">
            <h2 className="text-xl font-semibold text-foreground">
              MNKY ID / VIP portal
            </h2>
            <p className="flex-1 text-sm text-muted-foreground">
              MNKY ID sign-in for the private VIP portal is a separate identity
              universe today. Linking or migrating accounts is out of scope for
              this preview and needs its own approval.
            </p>
            {vip.enabled ? (
              <Button asChild variant="outline">
                <a href={vip.url} rel="noopener noreferrer">
                  Open VIP portal sign-in
                </a>
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">
                VIP portal deep-link is config-gated off. No silent redirect to
                an unapproved enrollment or portal flow.
              </p>
            )}
            <Button asChild variant="ghost">
              <Link href="/main/mnky-id/create">Create-ID introduction</Link>
            </Button>
          </MainGlassCard>
        </section>

        <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-muted-foreground">
          Pending Dojo accounts can still browse public Main. Member Dojo routes
          and LABZ remain protected until approved.
        </p>
      </main>
      <MainFooter />
    </>
  )
}
