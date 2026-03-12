import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AuthPageLayout } from "@/components/auth/auth-page-layout"
import { UpdatePasswordForm } from "@/components/auth/update-password-form"

export default function UpdatePasswordPage() {
  return (
    <AuthPageLayout>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-xl font-semibold tracking-tight text-[var(--verse-text)]">
              MOOD MNKY LABZ
            </h1>
            <p className="text-sm text-[var(--verse-text-muted)]">
              Set a new password
            </p>
          </div>
          <Card className="auth-card w-full">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg text-[var(--verse-text)]">Update password</CardTitle>
              <CardDescription className="text-[var(--verse-text-muted)]">
                Enter your new password below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UpdatePasswordForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthPageLayout>
  )
}
