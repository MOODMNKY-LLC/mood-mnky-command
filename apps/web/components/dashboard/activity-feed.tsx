import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import type { ActivityItem } from "@/lib/types"

interface ActivityFeedProps {
  activities: ActivityItem[]
  isLoading?: boolean
}

export function ActivityFeed({ activities, isLoading }: ActivityFeedProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start justify-between gap-4 border-b border-border pb-4 last:border-0 last:pb-0">
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">
              No recent activity. Connect your integrations to see live updates.
            </p>
            <p className="text-xs text-muted-foreground">
              Sync Notion or update products to see activity here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start justify-between gap-4 border-b border-border pb-4 last:border-0 last:pb-0"
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-foreground">
                      {activity.action}
                    </span>
                    {activity.source && (
                      <Badge variant="secondary" className="text-[10px] font-normal capitalize">
                        {activity.source}
                      </Badge>
                    )}
                  </div>
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
        )}
      </CardContent>
    </Card>
  )
}
