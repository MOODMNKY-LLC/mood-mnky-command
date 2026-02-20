"use client"

import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AuthPageLayout } from "@/components/auth/auth-page-layout"
import { createClient } from "@/lib/supabase/client"
import { Clock } from "lucide-react"

export default function PendingApprovalPage() {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <AuthPageLayout>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-xl font-semibold tracking-tight text-[var(--verse-text)]">
              MOOD MNKY LABZ
            </h1>
            <p className="text-sm text-[var(--verse-text-muted)]">
              Account activation pending
            </p>
          </div>
          <Card className="auth-card w-full">
            <CardHeader className="pb-4">
              <div className="flex justify-center mb-2">
                <Clock className="h-12 w-12 text-[var(--verse-text-muted)]/60" />
              </div>
              <CardTitle className="text-lg text-center text-[var(--verse-text)]">
                Pending Approval
              </CardTitle>
              <CardDescription className="text-center text-[var(--verse-text-muted)]">
                Your account is pending approval. An administrator will activate
                it shortly. You will be able to access the dashboard once
                approved.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleSignOut}
              >
                Sign out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthPageLayout>
  )
}
