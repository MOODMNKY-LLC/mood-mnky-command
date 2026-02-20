"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DojoProfileSnapshotProps {
  displayName: string | null;
  avatarUrl: string | null;
  email: string | null;
  xpTotal: number;
  level: number;
  handle?: string | null;
}

export function DojoProfileSnapshot({
  displayName,
  avatarUrl,
  email,
  xpTotal,
  level,
  handle,
}: DojoProfileSnapshotProps) {
  const initials =
    displayName
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || email?.slice(0, 2).toUpperCase() || "?";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={avatarUrl ?? undefined} alt="" />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="font-medium truncate">
              {displayName || email?.split("@")[0] || "Member"}
            </p>
            {handle && (
              <p className="text-muted-foreground text-xs truncate">@{handle}</p>
            )}
          </div>
          <Badge variant="secondary" className="shrink-0">
            Lvl {level}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">XP</span>
          <span className="font-medium tabular-nums">{xpTotal.toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}
