import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AuthPageLayout } from "@/components/auth/auth-page-layout"

/**
 * Shown when OAuth code exchange fails (e.g. GitHub callback with invalid/expired code).
 * Supabase docs suggest a dedicated page for this so users see a clear "code exchange failed" message.
 */
export default function AuthCodeErrorPage() {
  return (
    <AuthPageLayout>
      <div className="w-full max-w-sm space-y-4">
        <Card className="auth-card w-full">
          <CardHeader>
            <CardTitle className="text-lg text-[var(--verse-text)]">Sign-in link invalid or expired</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-[var(--verse-text-muted)]">
              The sign-in link could not be completed. This can happen if the link was already
              used, has expired, or there was a configuration problem. Please try signing in again.
            </p>
            <Button asChild className="w-full">
              <Link href="/auth/login">Back to sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AuthPageLayout>
  )
}
