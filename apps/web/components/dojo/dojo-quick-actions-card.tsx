import Link from "next/link";
import { MessageSquare, Settings, ShoppingBag, BookMarked, Image } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type QuickActionItem = {
  title: string
  href: string
  icon: typeof Settings
  subtitle?: string
}

const QUICK_ACTIONS: QuickActionItem[] = [
  {
    title: "Preferences",
    href: "/dojo/me/preferences",
    icon: Settings,
    subtitle: "Agent, fragrance, shop sync",
  },
  { title: "MNKY VERSE Shop", href: "/verse/shop", icon: ShoppingBag },
  { title: "Chat", href: "/verse/chat", icon: MessageSquare },
  { title: "Issues", href: "/verse/issues", icon: BookMarked },
  { title: "UGC", href: "/verse/ugc", icon: Image },
]

/** Illustrative review shortcuts — never invent live member rights. */
export const ILLUSTRATIVE_QUICK_ACTIONS: QuickActionItem[] = [
  {
    title: "Preferences (sample)",
    href: "/review/preferences",
    icon: Settings,
    subtitle: "Read-only sample",
  },
  {
    title: "Quests (sample)",
    href: "/review/quests",
    icon: BookMarked,
    subtitle: "Not tracked progress",
  },
  {
    title: "Profile (sample)",
    href: "/review/profile",
    icon: Image,
    subtitle: "Illustrative only",
  },
  {
    title: "Blog (sample)",
    href: "/review/blog",
    icon: MessageSquare,
    subtitle: "Placeholder posts",
  },
  {
    title: "Brand home",
    href: "/main?review=1",
    icon: ShoppingBag,
  },
]

export function DojoQuickActionsCard({
  actions = QUICK_ACTIONS,
  description = "Shortcuts to key Verse features",
}: {
  actions?: QuickActionItem[]
  description?: string
} = {}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => {
            const Icon = action.icon
            const subtitle = action.subtitle
            return (
              <Link
                key={action.href}
                href={action.href}
                className="inline-flex flex-col items-start gap-0.5 rounded-md border bg-muted/50 px-3 py-1.5 text-sm transition-colors hover:bg-muted"
              >
                <span className="inline-flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5" />
                  {action.title}
                </span>
                {subtitle && (
                  <span className="text-xs text-muted-foreground">{subtitle}</span>
                )}
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
