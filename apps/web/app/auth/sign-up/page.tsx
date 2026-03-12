import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AuthPageLayout } from "@/components/auth/auth-page-layout"
import { SignUpForm } from "@/components/auth/sign-up-form"

export default function SignUpPage() {
  return (
    <AuthPageLayout>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-xl font-semibold tracking-tight text-[var(--verse-text)]">
              MOOD MNKY LABZ
            </h1>
            <p className="text-sm text-[var(--verse-text-muted)]">
              Create your account
            </p>
          </div>
          <Card className="auth-card w-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-[var(--verse-text)]">Sign up</CardTitle>
              <CardDescription className="text-[var(--verse-text-muted)]">
                Get access to the MOOD MNKY product lab
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SignUpForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthPageLayout>
  )
}
