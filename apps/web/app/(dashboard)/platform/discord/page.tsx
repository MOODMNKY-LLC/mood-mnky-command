"use client"

import React from "react"
import useSWR from "swr"
import Link from "next/link"
import {
  ArrowLeft,
  AlertCircle,
  Send,
  MessageSquarePlus,
  Webhook,
  Code,
  Users,
  Shield,
  ShieldAlert,
  FileText,
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DiscordMessagesTab } from "./discord-messages-tab"
import { DiscordForumsTab } from "./discord-forums-tab"
import { DiscordWebhooksTab } from "./discord-webhooks-tab"
import { DiscordEmbedBuilderTab } from "./discord-embed-builder-tab"
import { DiscordMembersTab } from "./discord-members-tab"
import { DiscordRolesTab } from "./discord-roles-tab"
import { DiscordModerationTab } from "./discord-moderation-tab"
import { DiscordAuditLogsTab } from "./discord-audit-logs-tab"
import type { Guild, Channel } from "./discord-types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())
const CHANNEL_TYPE_FORUM = 15

export default function DiscordPage() {
  const [guildId, setGuildId] = React.useState<string>("")

  const { data: guildsData, isLoading: guildsLoading } = useSWR<{
    guilds?: Guild[]
    error?: string
  }>("/api/discord/guilds", fetcher, { revalidateOnFocus: false })

  const { data: channelsData } = useSWR<{
    channels?: Channel[]
    error?: string
  }>(guildId ? `/api/discord/channels?guildId=${guildId}` : null, fetcher, {
    revalidateOnFocus: false,
  })

  const { data: primaryData } = useSWR<{ isPrimary?: boolean }>(
    guildId ? `/api/discord/primary-guild?guildId=${guildId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  const guilds = guildsData?.guilds ?? []
  const channels = channelsData?.channels ?? []
  const guildsError = guildsData?.error
  const isPrimaryServer = primaryData?.isPrimary === true

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/platform">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            Platform
          </Button>
        </Link>
        <Separator orientation="vertical" className="h-5" />
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Discord Server
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Full control panel: messages, forums, webhooks, embed builder, members, roles, moderation, audit logs. Roles and onboarding follow the canonical set below.
          </p>
        </div>
      </div>

      {guildsError && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6 flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{guildsError}</span>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <Label className="text-sm font-medium">Server</Label>
          <p className="text-sm text-muted-foreground font-normal">
            Select a server the bot is in. Then use the tabs below.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={guildId}
              onValueChange={setGuildId}
            >
              <SelectTrigger className="w-full max-w-sm">
                <SelectValue placeholder={guildsLoading ? "Loading..." : "Select a server"} />
              </SelectTrigger>
              <SelectContent>
                {guilds.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isPrimaryServer && (
              <Badge variant="secondary" className="text-xs">
                Primary server
              </Badge>
            )}
          </div>
          {guildId && (
            <div className="mt-2 flex flex-wrap gap-2">
              {channels.map((c) => (
                <span
                  key={c.id}
                  className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
                >
                  {c.name}
                  {c.type === CHANNEL_TYPE_FORUM ? " (forum)" : ""}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <Label className="text-sm font-medium">Roles & onboarding</Label>
          <p className="text-sm text-muted-foreground font-normal">
            Canonical role set and tiered subscribers. Create these in Server Settings → Roles; use the Roles tab below to create or manage via API. Onboarding prompt &quot;What brings you here?&quot; maps options to roles (Verse, Blender, Shop, Member). See project docs: <code className="text-xs rounded bg-muted px-1 py-0.5">docs/DISCORD-ROLES-AND-ONBOARDING.md</code>.
          </p>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="text-xs font-normal">Member (default)</Badge>
            <Badge variant="secondary" className="text-xs font-normal">Verse</Badge>
            <Badge variant="secondary" className="text-xs font-normal">Blender</Badge>
            <Badge variant="secondary" className="text-xs font-normal">Shop</Badge>
            <Badge variant="outline" className="text-xs font-normal">DevOps</Badge>
            <Badge variant="secondary" className="text-xs font-normal">Subscriber</Badge>
            <Badge variant="secondary" className="text-xs font-normal">Dojo Member</Badge>
            <Badge variant="secondary" className="text-xs font-normal">MOOD Insider</Badge>
            <Badge variant="outline" className="text-xs font-normal">Moderator</Badge>
            <Badge variant="outline" className="text-xs font-normal">Admin/Builder</Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="messages" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="messages" className="gap-1">
            <Send className="h-3.5 w-3.5" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="forums" className="gap-1">
            <MessageSquarePlus className="h-3.5 w-3.5" />
            Forums
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-1">
            <Webhook className="h-3.5 w-3.5" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="embed" className="gap-1">
            <Code className="h-3.5 w-3.5" />
            Embed Builder
          </TabsTrigger>
          <TabsTrigger value="members" className="gap-1">
            <Users className="h-3.5 w-3.5" />
            Members
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-1">
            <Shield className="h-3.5 w-3.5" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="moderation" className="gap-1">
            <ShieldAlert className="h-3.5 w-3.5" />
            Moderation
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-1">
            <FileText className="h-3.5 w-3.5" />
            Audit logs
          </TabsTrigger>
        </TabsList>
        <TabsContent value="messages" className="mt-4">
          <DiscordMessagesTab channels={channels} guildId={guildId} />
        </TabsContent>
        <TabsContent value="forums" className="mt-4">
          <DiscordForumsTab channels={channels} guildId={guildId} />
        </TabsContent>
        <TabsContent value="webhooks" className="mt-4">
          <DiscordWebhooksTab channels={channels} guildId={guildId} />
        </TabsContent>
        <TabsContent value="embed" className="mt-4">
          <DiscordEmbedBuilderTab guildId={guildId} />
        </TabsContent>
        <TabsContent value="members" className="mt-4">
          <DiscordMembersTab guildId={guildId} />
        </TabsContent>
        <TabsContent value="roles" className="mt-4">
          <DiscordRolesTab guildId={guildId} />
        </TabsContent>
        <TabsContent value="moderation" className="mt-4">
          <DiscordModerationTab guildId={guildId} />
        </TabsContent>
        <TabsContent value="audit" className="mt-4">
          <DiscordAuditLogsTab guildId={guildId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
