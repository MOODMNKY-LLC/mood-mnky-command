import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { UpdatePasswordForm } from "@/components/auth/update-password-form"

export default function UpdatePasswordPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              MOOD MNKY LABZ
            </h1>
            <p className="text-sm text-muted-foreground">
              Set a new password
            </p>
          </div>
          <Card className="w-full border-border bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Update password</CardTitle>
              <CardDescription>
                Enter your new password below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UpdatePasswordForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
