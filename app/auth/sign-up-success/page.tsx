import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-sm">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg">Check your email</CardTitle>
            <CardDescription>
              We sent you a confirmation link
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {"You've successfully signed up for MOOD MNKY LABZ. Please check your email to confirm your account before signing in."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
