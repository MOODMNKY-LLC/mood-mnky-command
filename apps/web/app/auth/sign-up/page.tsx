import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AuthPageLayout } from "@/components/auth/auth-page-layout"
import { SignUpForm } from "@/components/auth/sign-up-form"
import { AuthVerseLogoBlock } from "@/components/auth/auth-verse-logo-block"
import { hasSupabaseAnonConfig } from "@/lib/supabase/config"

export default function SignUpPage() {
  const authBackendAvailable = hasSupabaseAnonConfig()

  return (
    <AuthPageLayout>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-6">
          <AuthVerseLogoBlock />
          <Card className="auth-card w-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-[var(--verse-text)]">
                {authBackendAvailable
                  ? "Create your account"
                  : "Account creation unavailable here"}
              </CardTitle>
              <CardDescription className="text-[var(--verse-text-muted)]">
                {authBackendAvailable ? (
                  <>
                    Join The Dojo to shop, blend, and save scents. This does not
                    grant private VERSE services, LABZ access, or a hosted
                    unified MNKY ID — those remain separate and inactive until
                    configured.
                  </>
                ) : (
                  <>
                    This preview host has no auth backend configured. Do not
                    enter credentials — signup would not create a real MNKY ID
                    or Dojo membership. Existing production logins are unchanged;
                    use the illustrative review journey for navigation.
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {authBackendAvailable ? (
                <>
                  <SignUpForm redirectTo="/dojo/me" />
                  <p className="text-center text-sm text-[var(--verse-text-muted)]">
                    Already have an account?{" "}
                    <Link
                      href="/auth/login?next=/dojo/me"
                      className="font-medium text-[var(--verse-text)] underline-offset-4 hover:underline"
                    >
                      Sign in
                    </Link>
                  </p>
                </>
              ) : (
                <div className="space-y-3 text-sm text-[var(--verse-text-muted)]">
                  <p className="rounded-md border border-dashed border-[var(--verse-border)] bg-[rgba(var(--verse-bg-rgb),0.4)] px-3 py-2 text-xs leading-relaxed">
                    Inactive on this preview: credential signup, Discord OAuth,
                    MNKY ID enrollment, VIP / private services, identity bridge.
                    Live Dojo/LABZ gates stay fail-closed.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <Link
                        href="/main?review=1"
                        className="font-medium text-[var(--verse-text)] underline underline-offset-4"
                      >
                        Brand home
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/review"
                        className="font-medium text-[var(--verse-text)] underline underline-offset-4"
                      >
                        Illustrative review hub
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/review/member-home"
                        className="font-medium text-[var(--verse-text)] underline underline-offset-4"
                      >
                        Sample member home
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/auth/login?review=1"
                        className="font-medium text-[var(--verse-text)] underline underline-offset-4"
                      >
                        Account entry (existing form UI)
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthPageLayout>
  )
}
