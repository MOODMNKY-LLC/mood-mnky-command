import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy } from "lucide-react"
export const dynamic = "force-dynamic"

export default async function XpQuestsPage() {
  const supabase = await createClient()
  const { data: quests } = await supabase
    .from("quests")
    .select("id, external_id, title, active, xp_reward, cooldown_days")
    .order("title")

  const { data: xpRules } = await supabase
    .from("config_xp_rules")
    .select("key, value")
    .in("key", ["mag_read", "mag_quiz", "mag_download", "purchase"])

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">XP & Quests</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Quests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(!quests || quests.length === 0) && (
            <p className="text-muted-foreground text-sm">No quests defined. Add quests to enable Discord and manga-driven rewards.</p>
          )}
          {quests && quests.length > 0 && (
            <ul className="divide-y">
              {quests.map((q) => (
                <li key={q.id} className="flex items-center justify-between py-3 first:pt-0">
                  <div>
                    <span className="font-medium">{q.title}</span>
                    <p className="text-muted-foreground text-sm">
                      {q.xp_reward ?? 0} XP · cooldown {q.cooldown_days ?? 0}d
                    </p>
                  </div>
                  <span className={q.active ? "text-green-600 text-sm" : "text-muted-foreground text-sm"}>
                    {q.active ? "Active" : "Inactive"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>XP rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Configure XP in <code className="rounded bg-muted px-1">config_xp_rules</code>. Level curve: <code className="rounded bg-muted px-1">compute_level_from_xp</code>.
          </p>
          {xpRules && xpRules.length > 0 && (
            <div className="rounded-md border bg-muted/30 p-3 font-mono text-xs">
              <pre className="overflow-x-auto whitespace-pre-wrap break-words">
                {JSON.stringify(
                  Object.fromEntries(xpRules.map((r) => [r.key, r.value])),
                  null,
                  2
                )}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
