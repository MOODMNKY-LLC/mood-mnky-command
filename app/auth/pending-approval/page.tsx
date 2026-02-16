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
    <div className="flex min-h-svh w-full items-center justify-center bg-background p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              MOOD MNKY LABZ
            </h1>
            <p className="text-sm text-muted-foreground">
              Account activation pending
            </p>
          </div>
          <Card className="w-full border-border bg-card">
            <CardHeader className="pb-4">
              <div className="flex justify-center mb-2">
                <Clock className="h-12 w-12 text-muted-foreground/60" />
              </div>
              <CardTitle className="text-lg text-center">
                Pending Approval
              </CardTitle>
              <CardDescription className="text-center">
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
    </div>
  )
}
