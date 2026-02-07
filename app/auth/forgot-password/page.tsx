import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              MOOD MNKY Lab
            </h1>
            <p className="text-sm text-muted-foreground">
              Reset your password
            </p>
          </div>
          <Card className="w-full border-border bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Forgot password</CardTitle>
              <CardDescription>
                {"We'll send you a link to reset it"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ForgotPasswordForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
