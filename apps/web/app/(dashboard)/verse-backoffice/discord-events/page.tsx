import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function DiscordEventsPage() {
  const supabase = await createClient()
  const { data: events } = await supabase
    .from("discord_event_ledger")
    .select("id, profile_id, discord_user_id, guild_id, event_type, value, created_at")
    .order("created_at", { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Discord Events</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm mb-4">
            Events are ingested via <code className="rounded bg-muted px-1">POST /api/discord/events</code> (MOODMNKY_API_KEY). For roles and webhooks, use <Link href="/platform/discord" className="text-primary underline">Platform → Discord</Link>.
          </p>
          {(!events || events.length === 0) && (
            <p className="text-muted-foreground text-sm">No events yet.</p>
          )}
          {events && events.length > 0 && (
            <ul className="divide-y text-sm">
              {events.map((e) => (
                <li key={e.id} className="flex items-center justify-between py-2 first:pt-0">
                  <span className="font-mono text-muted-foreground">{e.event_type}</span>
                  <span>guild {e.guild_id?.slice(0, 8)}… · value {e.value}</span>
                  <span className="text-muted-foreground">{new Date(e.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
