"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DojoProfileSnapshotProps {
  displayName: string | null;
  avatarUrl: string | null;
  email: string | null;
  xpTotal: number;
  level: number;
  handle?: string | null;
  shopifyLinked?: boolean;
}

export function DojoProfileSnapshot({
  displayName,
  avatarUrl,
  email,
  xpTotal,
  level,
  handle,
  shopifyLinked = false,
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
          <div className="flex shrink-0 items-center gap-2">
            {shopifyLinked && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5" aria-label="Shop linked">
                      <Store className="h-3.5 w-3.5 text-primary" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Shop linked</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <Badge variant="secondary">
              Lvl {level}
            </Badge>
          </div>
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
