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

export function ConsumerLoginCard({
  redirectTo = "/dojo/me",
}: {
  redirectTo?: string
}) {
  const vip = getVipPortalLink()

  return (
    <Card className="border border-[var(--verse-border)] bg-[rgba(var(--verse-bg-rgb),0.85)] shadow-[0_8px_32px_rgba(0,0,0,0.1)] backdrop-blur-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg text-[var(--verse-text)]">
          Sign in to your account
        </CardTitle>
        <CardDescription className="text-[var(--verse-text-muted)]">
          Shop, blend, and save in The Dojo. Private services use MNKY ID
          separately when approved — this form does not grant VIP access.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <OAuthProviderButton
          provider="discord"
          redirectTo={`/verse/auth/callback?next=${encodeURIComponent(redirectTo)}`}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[var(--verse-button)] px-4 text-sm font-medium text-[var(--verse-button-text)] transition-opacity hover:opacity-90"
        >
          <SiDiscord className="size-5 shrink-0" aria-hidden />
          Continue with Discord
        </OAuthProviderButton>
        <LoginForm redirectTo={redirectTo} />
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
            href="/main"
            className="text-xs text-[var(--verse-text-muted)] transition-colors hover:text-[var(--verse-text)]"
          >
            Back to MOOD MNKY
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
