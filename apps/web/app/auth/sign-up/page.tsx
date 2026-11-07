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

export default function SignUpPage() {
  return (
    <AuthPageLayout>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-6">
          <AuthVerseLogoBlock />
          <Card className="auth-card w-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-[var(--verse-text)]">
                Create your account
              </CardTitle>
              <CardDescription className="text-[var(--verse-text-muted)]">
                Join The Dojo to shop, blend, and save scents. This does not
                grant private VERSE services or LABZ access.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
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
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthPageLayout>
  )
}
