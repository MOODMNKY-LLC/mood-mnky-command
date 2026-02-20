import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ImagePlus } from "lucide-react"
import { UgcModerationClient } from "./ugc-moderation-client"

export const dynamic = "force-dynamic"

export default async function UgcModerationPage() {
  const supabase = await createClient()
  const { data: pending } = await supabase
    .from("ugc_submissions")
    .select("id, type, caption, media_path, status, created_at, profile_id")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(50)

  const { count: pendingCount } = await supabase
    .from("ugc_submissions")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">UGC Moderation</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImagePlus className="h-5 w-5" />
            Pending ({pendingCount ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(!pending || pending.length === 0) && (
            <p className="text-muted-foreground text-sm">No pending submissions.</p>
          )}
          {pending && pending.length > 0 && (
            <UgcModerationClient submissions={pending} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
