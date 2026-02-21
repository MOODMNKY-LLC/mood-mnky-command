"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronsUpDown, MessageCircle } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useDojoContext } from "@/components/dojo/dojo-context-provider";
import {
  dojoContexts,
  dojoCommunityLinks,
  DISCORD_INVITE_URL,
} from "@/lib/dojo-sidebar-config";

export function DojoTeamSwitcher() {
  const { isMobile } = useSidebar();
  const { contextId, setContextId } = useDojoContext();
  const activeContext = dojoContexts.find((c) => c.id === contextId) ?? dojoContexts[0];

  const Logo = activeContext.logo;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center overflow-hidden rounded-lg">
                <Logo className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeContext.name}</span>
                <span className="truncate text-xs">{activeContext.plan}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Context
            </DropdownMenuLabel>
            {dojoContexts.map((ctx) => {
              const CtxLogo = ctx.logo;
              return (
                <DropdownMenuItem
                  key={ctx.id}
                  onClick={() => setContextId(ctx.id)}
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-md border">
                    <CtxLogo className="size-3.5 shrink-0" />
                  </div>
                  <div className="flex flex-col items-start">
                    <span>{ctx.name}</span>
                    <span className="text-muted-foreground text-xs">{ctx.plan}</span>
                  </div>
                </DropdownMenuItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Community
            </DropdownMenuLabel>
            {DISCORD_INVITE_URL ? (
              <DropdownMenuItem asChild>
                <a
                  href={DISCORD_INVITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex cursor-pointer items-center gap-2 p-2"
                >
                  <MessageCircle className="size-4 shrink-0" />
                  <span>Join Discord</span>
                </a>
              </DropdownMenuItem>
            ) : null}
            {dojoCommunityLinks.map((item) => {
              const Icon = item.icon;
              if (item.external) {
                return (
                  <DropdownMenuItem key={item.href + item.label} asChild>
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex cursor-pointer items-center gap-2 p-2"
                    >
                      <Icon className="size-4 shrink-0" />
                      <span>{item.label}</span>
                    </a>
                  </DropdownMenuItem>
                );
              }
              return (
                <DropdownMenuItem key={item.href + item.label} asChild>
                  <Link href={item.href} className="flex items-center gap-2 p-2">
                    <Icon className="size-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
