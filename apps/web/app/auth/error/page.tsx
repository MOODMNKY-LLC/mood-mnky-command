import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AuthPageLayout } from "@/components/auth/auth-page-layout"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return (
    <AuthPageLayout>
      <div className="w-full max-w-sm">
        <Card className="auth-card w-full">
          <CardHeader>
            <CardTitle className="text-lg text-[var(--verse-text)]">Authentication error</CardTitle>
          </CardHeader>
          <CardContent>
            {params?.error ? (
              <p className="text-sm text-[var(--verse-text-muted)]">
                Error: {params.error}
              </p>
            ) : (
              <p className="text-sm text-[var(--verse-text-muted)]">
                An unspecified error occurred during authentication.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthPageLayout>
  )
}
