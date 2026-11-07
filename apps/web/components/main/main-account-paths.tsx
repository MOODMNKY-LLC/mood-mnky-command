import Link from "next/link"
import { MainGlassCard } from "@/components/main/main-glass-card"
import { Button } from "@/components/ui/button"
import {
  getMnkyIdEnrollmentState,
  getMnkyIdVipPortalState,
} from "@/lib/mnky-id"
import { loginHrefWithReturn, signUpHrefWithReturn } from "@/lib/auth/safe-return-path"

/**
 * Honest account-path matrix for the brand homepage.
 * Does not claim one account opens VIP/services or Dojo admin access.
 */
export function MainAccountPaths() {
  const enrollment = getMnkyIdEnrollmentState()
  const vip = getMnkyIdVipPortalState()

  return (
    <section
      className="space-y-6"
      aria-labelledby="main-account-paths-heading"
    >
      <div className="mx-auto max-w-2xl text-center space-y-2">
        <h2
          id="main-account-paths-heading"
          className="text-2xl font-bold tracking-tight text-foreground md:text-3xl"
        >
          Accounts, honestly
        </h2>
        <p className="text-sm text-muted-foreground md:text-base">
          Creating a MNKY ID is the common identity direction. VIP and other
          services still need separate approval. Existing Dojo, shop, and LABZ
          sign-in options stay available and unchanged.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <MainGlassCard className="flex flex-col">
          <h3 className="text-lg font-semibold text-foreground">MNKY ID</h3>
          <p className="mt-2 flex-1 text-sm text-muted-foreground">
            Your brand identity for the MNKY ecosystem. Anyone may create an ID
            when enrollment is enabled; membership packages stay approval-gated.
          </p>
          <Button asChild className="mt-4" variant="default">
            <Link href="/main/mnky-id">Learn about MNKY ID</Link>
          </Button>
          {!enrollment.enabled ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Public enrollment is not activated in this environment. Preview
              the create-ID guide without starting a live flow.
            </p>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              Enrollment is config-enabled for this environment.
            </p>
          )}
        </MainGlassCard>

        <MainGlassCard className="flex flex-col">
          <h3 className="text-lg font-semibold text-foreground">
            Dojo / shop account
          </h3>
          <p className="mt-2 flex-1 text-sm text-muted-foreground">
            Existing email/password and social sign-in for The Dojo storefront
            and community. Unchanged — not replaced by a parallel password
            system.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild>
              <Link href={signUpHrefWithReturn("/main")}>Sign up</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={loginHrefWithReturn("/main")}>Sign in</Link>
            </Button>
          </div>
        </MainGlassCard>

        <MainGlassCard className="flex flex-col">
          <h3 className="text-lg font-semibold text-foreground">
            VIP &amp; services
          </h3>
          <p className="mt-2 flex-1 text-sm text-muted-foreground">
            Access to VIP and other services requires separate approval. An
            identity alone does not grant packages or admin/LABZ rights.
          </p>
          {vip.enabled ? (
            <Button asChild className="mt-4" variant="outline">
              <a href={vip.url} rel="noopener noreferrer">
                VIP portal entry
              </a>
            </Button>
          ) : (
            <p className="mt-4 text-xs text-muted-foreground">
              VIP portal deep-link is config-gated and currently off. Ask an
              operator when invitations or enrollment are approved.
            </p>
          )}
        </MainGlassCard>
      </div>
    </section>
  )
}
