/**
 * Dojo sidebar navigation configuration.
 * Members' private hub nav: Home, Chat, Profile, Preferences, Crafting (dashboard-only).
 * Context switching: Home, Crafting, Chat (no Verse context; community links in switcher).
 */

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import {
  Home,
  Settings,
  MessageSquare,
  User,
  BookMarked,
  FlaskConical,
  Bot,
  FolderOpen,
  Sliders,
  MessageCircle,
  Newspaper,
  Trophy,
  Users,
  Globe,
} from "lucide-react";

/** Logo component for The Dojo team */
function DojoLogo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/mood-mnky-icon.svg"
      alt="MOOD MNKY"
      width={16}
      height={16}
      className={className}
    />
  );
}

/** Context IDs for Dojo workspace switcher (Verse removed; use Community section for Verse links) */
export const DOJO_CONTEXT_IDS = ["home", "crafting", "chat"] as const;
export type DojoContextId = (typeof DOJO_CONTEXT_IDS)[number];

/** Default context when none persisted */
export const DEFAULT_DOJO_CONTEXT: DojoContextId = "home";

/** Persistence key for active context */
export const DOJO_CONTEXT_STORAGE_KEY = "dojo-active-context";

/** Teams/contexts for TeamSwitcher */
export const dojoContexts: {
  id: DojoContextId;
  name: string;
  logo: React.ComponentType<{ className?: string }>;
  plan: string;
  href: string;
}[] = [
  { id: "home", name: "Home", logo: DojoLogo, plan: "Your space", href: "/dojo" },
  {
    id: "crafting",
    name: "Crafting",
    logo: FlaskConical,
    plan: "Fragrance & blends",
    href: "/dojo/crafting",
  },
  {
    id: "chat",
    name: "Chat",
    logo: Bot,
    plan: "MNKY Chat",
    href: "/dojo/chat",
  },
];

/** @deprecated Use dojoContexts for context switching */
export const dojoTeams = dojoContexts.map((c) => ({
  name: c.name,
  logo: c.logo,
  plan: c.plan,
}));

export interface DojoNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  isAction?: boolean;
}

/** Dojo section: dashboard-only */
export const dojoItems: DojoNavItem[] = [
  { title: "Home", href: "/dojo", icon: Home },
  { title: "Preferences", href: "/dojo/preferences", icon: Settings },
];

/** @deprecated Verse links moved to Community section in team switcher; do not use in sidebar nav */
export const verseLinkItems: DojoNavItem[] = [
  { title: "Community hub", href: "/dojo/community", icon: Users },
];

/** Nav group item shape */
export type DojoNavGroupItem = {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: { title: string; url: string }[];
};

export type DojoNavGroup = {
  label: string;
  items: DojoNavGroupItem[];
};

/** Nav groups for sidebar (dashboard-only) */
export const dojoNavGroups: DojoNavGroup[] = [
  {
    label: "Dojo",
    items: [
      { title: "MOOD MNKY (Home)", url: "/main", icon: Globe },
      { title: "Back to VERSE", url: "/verse", icon: Globe },
      { title: "Home", url: "/dojo", icon: Home, isActive: true },
      { title: "MNKY CHAT", url: "/dojo/chat", icon: MessageSquare },
      { title: "Profile", url: "/dojo/profile", icon: User },
      { title: "Preferences", url: "/dojo/preferences", icon: Settings },
    ],
  },
];

/** Crafting-specific nav groups (dashboard-only) */
export const dojoCraftingNavGroups: DojoNavGroup[] = [
  {
    label: "Crafting",
    items: [
      { title: "Blending Lab", url: "/dojo/crafting", icon: FlaskConical, isActive: true },
      { title: "Saved Blends", url: "/dojo/crafting/saved", icon: BookMarked },
      { title: "MNKY CHAT", url: "/dojo/chat", icon: MessageSquare },
      { title: "Preferences", url: "/dojo/preferences", icon: Settings },
    ],
  },
  {
    label: "Dojo",
    items: [
      { title: "MOOD MNKY (Home)", url: "/main", icon: Globe },
      { title: "Home", url: "/dojo", icon: Home },
      { title: "Profile", url: "/dojo/profile", icon: User },
    ],
  },
];

/** Chat context: sidebar shows Chat group + minimal Dojo */
export const dojoChatNavGroups: DojoNavGroup[] = [
  {
    label: "Chat",
    items: [
      { title: "New chat", url: "/dojo/chat", icon: MessageSquare },
      { title: "Saved chats", url: "/dojo/chat#saved", icon: BookMarked },
      { title: "Folders", url: "/dojo/chat#folders", icon: FolderOpen },
      { title: "Flowise config", url: "/dojo/chat#flowise", icon: Sliders },
      { title: "Settings", url: "/dojo/chat#settings", icon: Settings },
    ],
  },
  {
    label: "Dojo",
    items: [
      { title: "MOOD MNKY (Home)", url: "/main", icon: Globe },
      { title: "Back to VERSE", url: "/verse", icon: Globe },
      { title: "Home", url: "/dojo", icon: Home },
      { title: "Preferences", url: "/dojo/preferences", icon: Settings },
    ],
  },
];

/** Get nav groups for the active context */
export function getDojoNavGroupsForContext(contextId: DojoContextId): DojoNavGroup[] {
  switch (contextId) {
    case "crafting":
      return dojoCraftingNavGroups;
    case "chat":
      return dojoChatNavGroups;
    default:
      return dojoNavGroups;
  }
}

/** Quick access (dashboard-only) */
export const dojoQuickAccessItems: { name: string; url: string; icon: LucideIcon }[] = [
  { name: "MNKY CHAT", url: "/dojo/chat", icon: MessageSquare },
  { name: "Profile", url: "/dojo/profile", icon: User },
  { name: "Community hub", url: "/dojo/community", icon: Users },
];

/** Crafting quick access (dashboard-only) */
export const dojoCraftingQuickAccessItems: { name: string; url: string; icon: LucideIcon }[] = [
  { name: "Blending Lab", url: "/dojo/crafting", icon: FlaskConical },
  { name: "Saved Blends", url: "/dojo/crafting/saved", icon: BookMarked },
  { name: "MNKY CHAT", url: "/dojo/chat", icon: MessageSquare },
  { name: "Community hub", url: "/dojo/community", icon: Users },
];

/** Chat quick access */
export const dojoChatQuickAccessItems: { name: string; url: string; icon: LucideIcon }[] = [
  { name: "New chat", url: "/dojo/chat", icon: MessageSquare },
  { name: "Flowise config", url: "/dojo/flowise", icon: Sliders },
];

/** Get quick access items for the active context */
export function getDojoQuickAccessForContext(
  contextId: DojoContextId
): { name: string; url: string; icon: LucideIcon }[] {
  if (contextId === "crafting") return dojoCraftingQuickAccessItems;
  if (contextId === "chat") return dojoChatQuickAccessItems;
  return dojoQuickAccessItems;
}

/** Community section links for team switcher dropdown (external = open in new tab) */
export const dojoCommunityLinks: {
  label: string;
  href: string;
  external: boolean;
  icon: LucideIcon;
}[] = [
  { label: "MOOD MNKY (Home)", href: "/main", external: false, icon: Home },
  { label: "Community hub", href: "/dojo/community", external: false, icon: Users },
  { label: "MNKY VERSE Blog", href: "/verse/blog", external: true, icon: Newspaper },
  { label: "Quests & XP", href: "/verse/quests", external: true, icon: Trophy },
  { label: "Manga & Issues", href: "/verse/issues", external: true, icon: BookMarked },
  { label: "Link Discord account", href: "/verse/auth/discord/link", external: false, icon: MessageCircle },
];

/** Discord invite URL (build-time); when set, "Join Discord" is shown in Community section */
export const DISCORD_INVITE_URL = typeof process.env.NEXT_PUBLIC_DISCORD_INVITE_URL === "string"
  ? process.env.NEXT_PUBLIC_DISCORD_INVITE_URL
  : "";
