import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AuthPageLayout } from "@/components/auth/auth-page-layout"

export default function SignUpSuccessPage() {
  return (
    <AuthPageLayout>
      <div className="w-full max-w-sm">
        <Card className="auth-card w-full">
          <CardHeader>
            <CardTitle className="text-lg text-[var(--verse-text)]">Check your email</CardTitle>
            <CardDescription className="text-[var(--verse-text-muted)]">
              We sent you a confirmation link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--verse-text-muted)]">
              {"You've successfully signed up for MOOD MNKY LABZ. Please check your email to confirm your account before signing in."}
            </p>
          </CardContent>
        </Card>
      </div>
    </AuthPageLayout>
  )
}
