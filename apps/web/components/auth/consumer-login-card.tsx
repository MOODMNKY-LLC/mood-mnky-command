"use client"

import Link from "next/link"
import { SiDiscord } from "react-icons/si"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LoginForm } from "@/components/auth/login-form"
import { OAuthProviderButton } from "@/components/auth/oauth-provider-button"
import { getVipPortalLink } from "@/lib/mnky-id"

function hasBrowserAnonConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  )
}

export function ConsumerLoginCard({
  redirectTo = "/dojo/me",
}: {
  redirectTo?: string
}) {
  const vip = getVipPortalLink()
  const authBackendAvailable = hasBrowserAnonConfig()

  return (
    <Card className="border border-[var(--verse-border)] bg-[rgba(var(--verse-bg-rgb),0.85)] shadow-[0_8px_32px_rgba(0,0,0,0.1)] backdrop-blur-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-[var(--verse-text)]">
          Sign in to your account
        </CardTitle>
        <CardDescription className="text-[var(--verse-text-muted)]">
          Shop, blend, and save in The Dojo. Private services use MNKY ID
          separately when approved — this form does not grant VIP access.
          {!authBackendAvailable && (
            <>
              {" "}
              On this preview host the auth backend is inactive; the form stays
              for continuity but will not create a session. Use the review hub
              for the illustrative journey.
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {authBackendAvailable ? (
          <>
            <OAuthProviderButton
              provider="discord"
              redirectTo={`/verse/auth/callback?next=${encodeURIComponent(redirectTo)}`}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[var(--verse-button)] px-4 text-sm font-medium text-[var(--verse-button-text)] transition-opacity hover:opacity-90"
            >
              <SiDiscord className="size-5 shrink-0" aria-hidden />
              Continue with Discord
            </OAuthProviderButton>
            <LoginForm redirectTo={redirectTo} />
          </>
        ) : (
          <p className="rounded-md border border-dashed border-[var(--verse-border)] px-3 py-2 text-xs leading-relaxed text-[var(--verse-text-muted)]">
            Credential and Discord sign-in are inactive without Preview Supabase
            anon config. Existing production accounts are unchanged. No fake
            hosted MNKY ID is offered here.
          </p>
        )}
        <p className="text-center text-sm text-[var(--verse-text-muted)]">
          Don&apos;t have an account?{" "}
          <Link
            href={`/auth/sign-up?next=${encodeURIComponent(redirectTo)}`}
            className="font-medium text-[var(--verse-text)] underline-offset-4 hover:underline"
          >
            Sign up
          </Link>
        </p>
        <div className="flex flex-col items-center gap-2 text-center">
          <Link
            href="/main?review=1"
            className="text-xs text-[var(--verse-text-muted)] transition-colors hover:text-[var(--verse-text)]"
          >
            Back to MOOD MNKY
          </Link>
          <Link
            href="/review"
            className="text-xs text-[var(--verse-text-muted)] underline-offset-2 transition-colors hover:text-[var(--verse-text)] hover:underline"
          >
            Review hub (illustrative journey)
          </Link>
          <Link
            href="/review/member-home"
            className="text-xs text-[var(--verse-text-muted)] underline-offset-2 transition-colors hover:text-[var(--verse-text)] hover:underline"
          >
            Sample member home
          </Link>
          {vip.enabled ? (
            <a
              href={vip.url}
              rel="noopener noreferrer"
              className="text-xs text-[var(--verse-text-muted)] transition-colors hover:text-[var(--verse-text)]"
            >
              Private services (MNKY ID)
            </a>
          ) : (
            <p className="max-w-xs text-[10px] leading-relaxed text-[var(--verse-text-muted)]">
              MNKY ID / private VERSE entry is config-gated and not activated in
              this environment.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
