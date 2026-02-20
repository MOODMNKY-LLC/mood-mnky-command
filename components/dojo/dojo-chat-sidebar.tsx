"use client";

import * as React from "react";
import Link from "next/link";
import {
  MessageSquarePlus,
  Pin,
  PinOff,
  Download,
  Sliders,
  Search,
  Image,
  Plug,
  FlaskConical,
  Code2,
  FolderOpen,
  Users,
  MoreHorizontal,
  Plus,
  Archive,
} from "lucide-react";
import { useDojoChat } from "@/components/dojo/dojo-chat-context";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DojoChatCommandPalette } from "@/components/dojo/dojo-chat-command";
import { ThemeToggle } from "@/components/theme-toggle";
import { DojoTeamSwitcher } from "@/components/dojo/dojo-team-switcher";
import { DojoSidebarFooter } from "@/components/dojo/dojo-sidebar-footer";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DojoChatSidebarChat {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  pinned?: boolean;
  archived?: boolean;
  folderId?: string | null;
}

export interface DojoChatProject {
  id: string;
  name: string;
}

export interface DojoChatSidebarProps {
  chats: DojoChatSidebarChat[];
  activeChatId: string | null;
  projects?: DojoChatProject[];
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onPin?: (id: string, pinned: boolean) => void;
  onDownload?: (id: string) => void;
  onAddProject?: () => void;
}

export function DojoChatSidebar({
  chats,
  activeChatId,
  projects = [],
  onNewChat,
  onSelectChat,
  onPin,
  onDownload,
  onAddProject,
  ...props
}: DojoChatSidebarProps & React.ComponentProps<typeof Sidebar>) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const searchLower = searchQuery.trim().toLowerCase();
  const filterBySearch = (list: DojoChatSidebarChat[]) =>
    searchLower
      ? list.filter((c) => (c.title || "").toLowerCase().includes(searchLower))
      : list;
  const activeChats = chats.filter((c) => !c.archived);
  const archivedChats = chats.filter((c) => c.archived);
  const activeFiltered = filterBySearch(activeChats);
  const archivedFiltered = filterBySearch(archivedChats);
  const pinnedChats = activeFiltered.filter((c) => c.pinned);
  const unpinnedChats = activeFiltered.filter((c) => !c.pinned);
  const sortedUnpinned = [...unpinnedChats].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex flex-row items-center justify-between gap-2 border-b border-sidebar-border px-2 py-3">
        <DojoTeamSwitcher />
        <ThemeToggle
          className="flex size-8 shrink-0 items-center justify-center rounded-md hover:bg-sidebar-accent"
          aria-label="Toggle theme"
        />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="sr-only">New chat</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={onNewChat} className="gap-2" tooltip="New chat">
                <MessageSquarePlus className="h-4 w-4 shrink-0" />
                <span>New chat</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <div className="relative px-2">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-8 pr-2"
              aria-label="Search chats"
            />
          </div>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <Collapsible defaultOpen={false} className="group/collapsible">
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip="Images">
                <Image className="h-4 w-4" />
                <span>Images</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-2 py-1.5 text-xs text-muted-foreground">Your chat images (coming soon)</div>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        <SidebarGroup>
          <Collapsible defaultOpen={false} className="group/collapsible">
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip="Integrations">
                <Plug className="h-4 w-4" />
                <span>Integrations</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-2 py-1.5 text-xs text-muted-foreground">API keys &amp; connections (coming soon)</div>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        <SidebarGroup>
          <Collapsible defaultOpen={false} className="group/collapsible">
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip="Deep Research">
                <FlaskConical className="h-4 w-4" />
                <span>Deep Research</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-2 py-1.5 text-xs text-muted-foreground">Research mode (coming soon)</div>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        <SidebarGroup>
          <Collapsible defaultOpen={false} className="group/collapsible">
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip="Codex">
                <Code2 className="h-4 w-4" />
                <span>Codex</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-2 py-1.5 text-xs text-muted-foreground">Code mode (coming soon)</div>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        <SidebarGroup>
          <Collapsible defaultOpen className="group/collapsible">
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip="Projects">
                <FolderOpen className="h-4 w-4" />
                <span>Projects</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {onAddProject && (
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton onClick={onAddProject}>
                      <Plus className="h-4 w-4" />
                      <span>New project</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                )}
                {projects.map((p) => (
                  <SidebarMenuSubItem key={p.id}>
                    <SidebarMenuSubButton disabled className="cursor-default">
                      <span className="truncate">{p.name}</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
                {projects.length === 0 && !onAddProject && (
                  <SidebarMenuSubItem>
                    <span className="px-2 text-xs text-muted-foreground">No projects</span>
                  </SidebarMenuSubItem>
                )}
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        <SidebarGroup>
          <Collapsible defaultOpen={false} className="group/collapsible">
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip="Group chats">
                <Users className="h-4 w-4" />
                <span>Group chats</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-2 py-1.5 text-xs text-muted-foreground">Shared chats (coming soon)</div>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Chats</SidebarGroupLabel>
          <ScrollArea className="h-[200px] md:h-[260px]">
            <SidebarMenu>
              {pinnedChats.map((chat) => (
                <ChatRow
                  key={chat.id}
                  chat={chat}
                  isActive={activeChatId === chat.id}
                  onSelect={() => onSelectChat(chat.id)}
                  onPin={onPin}
                  onDownload={onDownload}
                />
              ))}
              {sortedUnpinned.map((chat) => (
                <ChatRow
                  key={chat.id}
                  chat={chat}
                  isActive={activeChatId === chat.id}
                  onSelect={() => onSelectChat(chat.id)}
                  onPin={onPin}
                  onDownload={onDownload}
                />
              ))}
              {activeFiltered.length === 0 && (
                <SidebarMenuItem>
                  <span className="px-2 py-4 text-sm text-muted-foreground">
                    {activeChats.length === 0 ? "No chats yet" : "No matching chats"}
                  </span>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </ScrollArea>
        </SidebarGroup>

        {archivedFiltered.length > 0 && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <Collapsible defaultOpen={false} className="group/collapsible">
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip="Archived">
                    <Archive className="h-4 w-4" />
                    <span>Archived</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenu>
                    {archivedFiltered.map((chat) => (
                      <ChatRow
                        key={chat.id}
                        chat={chat}
                        isActive={activeChatId === chat.id}
                        onSelect={() => onSelectChat(chat.id)}
                        onPin={onPin}
                        onDownload={onDownload}
                      />
                    ))}
                  </SidebarMenu>
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>
          </>
        )}

        <SidebarSeparator />

        <SidebarGroup>
          <Collapsible defaultOpen={false} className="group/collapsible">
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip="Flowise &amp; settings">
                <Sliders className="h-4 w-4" />
                <span>Flowise config</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton asChild>
                    <Link href="/dojo/flowise">Flowise config</Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
                <SidebarMenuSubItem>
                  <SidebarMenuSubButton asChild>
                    <Link href="/dojo/preferences">Settings</Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              </SidebarMenuSub>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <DojoSidebarFooter />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

/** Wrapper that supplies DojoChatSidebar with context; use inside DojoChatProvider. */
export function DojoChatSidebarWithContext(
  props: Omit<
    DojoChatSidebarProps,
    "chats" | "activeChatId" | "projects" | "onNewChat" | "onSelectChat" | "onPin" | "onDownload" | "onAddProject"
  >
) {
  const chat = useDojoChat();
  return (
    <DojoChatSidebar
      {...props}
      chats={chat.chats}
      activeChatId={chat.activeChatId}
      projects={chat.projects}
      onNewChat={() => chat.newChat()}
      onSelectChat={chat.selectChat}
      onPin={chat.pinChat}
      onDownload={chat.downloadChat}
      onAddProject={() => chat.addProject("New project")}
    />
  );
}

function ChatRow({
  chat,
  isActive,
  onSelect,
  onPin,
  onDownload,
}: {
  chat: DojoChatSidebarChat;
  isActive: boolean;
  onSelect: () => void;
  onPin?: (id: string, pinned: boolean) => void;
  onDownload?: (id: string) => void;
}) {
  const [showActions, setShowActions] = React.useState(false);
  const title = chat.title || "Untitled";

  return (
    <SidebarMenuItem
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex w-full items-center gap-1 rounded-md group/row">
        <SidebarMenuButton
          onClick={onSelect}
          isActive={isActive}
          tooltip={title}
          className="flex-1 min-w-0 justify-start truncate"
        >
          <span className="truncate">{title}</span>
        </SidebarMenuButton>
        <div
          className={cn(
            "flex shrink-0 items-center gap-0.5 pr-1",
            showActions ? "opacity-100" : "opacity-0 group-hover/row:opacity-100"
          )}
        >
          {onPin && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onPin(chat.id, !chat.pinned);
              }}
              aria-label={chat.pinned ? "Unpin" : "Pin"}
            >
              {chat.pinned ? (
                <PinOff className="h-3.5 w-3.5" />
              ) : (
                <Pin className="h-3.5 w-3.5" />
              )}
            </Button>
          )}
          {onDownload && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onDownload(chat.id);
              }}
              aria-label="Download"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
          )}
          <DojoChatCommandPalette
            chat={chat}
            trigger={
              <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Chat actions">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            }
          />
        </div>
      </div>
    </SidebarMenuItem>
  );
}
