import Link from "next/link";
import { BookOpen, CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export type QuestWithAction = {
  id: string;
  title: string;
  description: string | null;
  xp_reward: number | null;
  status: "completed" | "in_progress" | "not_started";
  actionHref?: string;
  actionLabel?: string;
};

interface DojoQuestsCardProps {
  totalActive: number;
  completedCount: number;
  quests?: QuestWithAction[];
}

export function DojoQuestsCard({
  totalActive,
  completedCount,
  quests = [],
}: DojoQuestsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Quests</CardTitle>
        <BookOpen className="text-muted-foreground h-4 w-4" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{totalActive} active</div>
        <p className="text-muted-foreground text-xs">{completedCount} completed</p>

        {quests.length > 0 && (
          <ul className="mt-3 space-y-2">
            {quests.map((q) => (
              <li
                key={q.id}
                className="flex items-start justify-between gap-2 rounded-md border bg-muted/30 px-2 py-1.5 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {q.status === "completed" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-500" />
                    ) : (
                      <Circle className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                    )}
                    <span
                      className={
                        q.status === "completed"
                          ? "text-muted-foreground line-through"
                          : "font-medium"
                      }
                    >
                      {q.title}
                    </span>
                    {q.xp_reward != null && q.xp_reward > 0 && (
                      <Badge variant="secondary" className="text-[10px]">
                        +{q.xp_reward} XP
                      </Badge>
                    )}
                  </div>
                  {q.actionHref &&
                    q.actionLabel &&
                    q.status !== "completed" && (
                      <Link
                        href={q.actionHref}
                        className="mt-0.5 block text-xs text-primary hover:underline"
                      >
                        {q.actionLabel}
                      </Link>
                    )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {quests.length > 0 && (
          <Link
            href="/dojo/quests"
            className="mt-3 block text-center text-xs text-primary hover:underline"
          >
            View all quests →
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
