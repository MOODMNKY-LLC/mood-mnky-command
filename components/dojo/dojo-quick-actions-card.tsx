import Link from "next/link";
import { MessageSquare, Settings, ShoppingBag, BookMarked, Image } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const QUICK_ACTIONS = [
  { title: "Preferences", href: "/dojo/preferences", icon: Settings },
  { title: "MNKY VERSE Shop", href: "/verse/shop", icon: ShoppingBag },
  { title: "Chat", href: "/verse/chat", icon: MessageSquare },
  { title: "Issues", href: "/verse/issues", icon: BookMarked },
  { title: "UGC", href: "/verse/ugc", icon: Image },
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
            return (
              <Link
                key={action.href}
                href={action.href}
                className="inline-flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5 text-sm transition-colors hover:bg-muted"
              >
                <Icon className="h-3.5 w-3.5" />
                {action.title}
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
