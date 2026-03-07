"use client";

import Link from "next/link";
import { Building2, ChevronsUpDown, Plus, Settings } from "lucide-react";
import { useDashboardContext } from "@/components/dashboard-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TeamSwitcher() {
  const { tenants, isPlatformAdmin, activeTeam, setActiveTeam } = useDashboardContext();

  const displayName =
    activeTeam?.type === "org"
      ? activeTeam.tenant.name
      : activeTeam?.type === "platform"
        ? "Platform"
        : "Select context";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 min-w-[180px] justify-between font-medium"
        >
          <span className="flex items-center gap-2 truncate">
            {activeTeam?.type === "org" ? (
              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : activeTeam?.type === "platform" ? (
              <Settings className="h-4 w-4 shrink-0 text-muted-foreground" />
            ) : null}
            <span className="truncate">{displayName}</span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Organizations
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          {tenants.map((tenant) => (
            <DropdownMenuItem
              key={tenant.id}
              onClick={() => setActiveTeam({ type: "org", tenant })}
              className="gap-2"
            >
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="truncate">{tenant.name}</span>
              <span className="text-xs text-muted-foreground truncate">({tenant.slug})</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        {isPlatformAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Platform
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setActiveTeam({ type: "platform" })} className="gap-2">
                <Settings className="h-4 w-4 shrink-0" />
                Backoffice
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/onboarding" className="gap-2">
            <Plus className="h-4 w-4 shrink-0" />
            Add organization
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
