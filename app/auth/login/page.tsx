import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              MOOD MNKY Lab
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to manage your product lab
            </p>
          </div>
          <Card className="w-full border-border bg-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Sign in</CardTitle>
              <CardDescription>
                Enter your credentials to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
