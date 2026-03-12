import Link from "next/link";
import { MessageSquare, Settings, ShoppingBag, BookMarked, Image } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const QUICK_ACTIONS = [
  {
    title: "Preferences",
    href: "/dojo/me/preferences",
    icon: Settings,
    subtitle: "Agent, fragrance, shop sync",
  },
  { title: "MNKY VERSE Shop", href: "/verse/shop", icon: ShoppingBag, subtitle: undefined },
  { title: "Chat", href: "/verse/chat", icon: MessageSquare, subtitle: undefined },
  { title: "Issues", href: "/verse/issues", icon: BookMarked, subtitle: undefined },
  { title: "UGC", href: "/verse/ugc", icon: Image, subtitle: undefined },
] as const;

export function DojoQuickActionsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
        <CardDescription>
          Shortcuts to key Verse features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            const subtitle = action.subtitle;
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
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
