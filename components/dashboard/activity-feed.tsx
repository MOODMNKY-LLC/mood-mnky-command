import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ActivityItem } from "@/lib/types"

interface ActivityFeedProps {
  activities: ActivityItem[]
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start justify-between gap-4 border-b border-border pb-4 last:border-0 last:pb-0"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-sm text-foreground">
                  {activity.action}
                </span>
                <span className="text-sm font-medium text-primary">
                  {activity.target}
                </span>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {activity.timestamp}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
