"use client";

import Link from "next/link";
import {
  Agent,
  AgentContent,
  AgentHeader,
  AgentInstructions,
} from "@/components/ai-elements/agent";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Store, User } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface DojoCharacterCardProps {
  displayName: string | null;
  avatarUrl: string | null;
  email: string | null;
  xpTotal: number;
  level: number;
  handle?: string | null;
  shopifyLinked?: boolean;
}

export function DojoCharacterCard({
  displayName,
  avatarUrl,
  email,
  xpTotal,
  level,
  handle,
  shopifyLinked = false,
}: DojoCharacterCardProps) {
  const name = displayName || email?.split("@")[0] || "Member";
  const initials =
    displayName
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || email?.slice(0, 2).toUpperCase() || "?";

  return (
    <Agent className="flex flex-col">
      <AgentHeader
        name={name}
        model={`Lvl ${level}`}
        icon={
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={avatarUrl ?? undefined} alt="" />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
        }
      >
        {handle && (
          <span className="text-muted-foreground w-full truncate text-xs sm:w-auto">
            @{handle}
          </span>
        )}
        {shopifyLinked && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="inline-flex shrink-0 items-center rounded-md bg-primary/10 px-1.5 py-0.5"
                  aria-label="Shop linked"
                >
                  <Store className="h-3.5 w-3.5 text-primary" />
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Shop linked</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </AgentHeader>
      <AgentContent className="space-y-3">
        <AgentInstructions label="Summary">
          {xpTotal.toLocaleString()} XP total
        </AgentInstructions>
        <Link
          href="/dojo/profile"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <User className="h-3.5 w-3.5" />
          Profile & account
        </Link>
      </AgentContent>
    </Agent>
  );
}
