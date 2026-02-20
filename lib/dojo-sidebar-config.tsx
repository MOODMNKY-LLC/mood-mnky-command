/**
 * Dojo sidebar navigation configuration.
 * Members' private hub nav: Home, Preferences, Crafting, and links to Verse.
 * Supports context switching (Home, Crafting, Verse) with persisted selection.
 */

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import {
  Home,
  Settings,
  ShoppingBag,
  MessageSquare,
  User,
  Globe,
  BookMarked,
  Image,
  FlaskConical,
  Palette,
  Bot,
  FolderOpen,
  Sliders,
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

/** Context IDs for Dojo workspace switcher */
export const DOJO_CONTEXT_IDS = ["home", "crafting", "verse", "chat"] as const;
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
    id: "verse",
    name: "MNKY VERSE",
    logo: Palette,
    plan: "MNKY VERSE",
    href: "/verse",
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

/** Dojo section: Home, Preferences */
export const dojoItems: DojoNavItem[] = [
  { title: "Home", href: "/dojo", icon: Home },
  { title: "Preferences", href: "/dojo/preferences", icon: Settings },
];

/** MNKY VERSE section: links to public-facing parts */
export const verseLinkItems: DojoNavItem[] = [
  { title: "MNKY VERSE Home", href: "/verse", icon: Globe },
  { title: "MNKY VERSE Shop", href: "/verse/shop", icon: ShoppingBag },
  { title: "Chat", href: "/verse/chat", icon: MessageSquare },
  { title: "Profile", href: "/verse/profile", icon: User },
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

/** Nav groups for sidebar-07 NavMain (collapsible) */
export const dojoNavGroups: DojoNavGroup[] = [
  {
    label: "Dojo",
    items: [
      { title: "Home", url: "/dojo", icon: Home, isActive: true },
      { title: "MNKY CHAT", url: "/dojo/chat", icon: MessageSquare },
      { title: "Preferences", url: "/dojo/preferences", icon: Settings },
    ],
  },
  {
    label: "MNKY VERSE",
    items: [
      { title: "MNKY VERSE Home", url: "/verse", icon: Globe },
      { title: "MNKY VERSE Shop", url: "/verse/shop", icon: ShoppingBag },
      { title: "Chat", url: "/verse/chat", icon: MessageSquare },
      { title: "Profile", url: "/verse/profile", icon: User },
    ],
  },
];

/** Crafting-specific nav groups */
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
    label: "MNKY VERSE",
    items: [
      { title: "MNKY VERSE Home", url: "/verse", icon: Globe },
      { title: "MNKY VERSE Shop", url: "/verse/shop", icon: ShoppingBag },
      { title: "Glossary", url: "/verse/glossary", icon: BookMarked },
    ],
  },
];

/** Chat context: sidebar shows New Chat, Saved Chats, Folders, Flowise config, Settings */
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
];

/** MNKY VERSE-focused nav groups (when context is Verse) */
export const dojoVerseNavGroups: DojoNavGroup[] = [
  {
    label: "MNKY VERSE",
    items: [
      { title: "MNKY VERSE Home", url: "/verse", icon: Globe, isActive: true },
      { title: "MNKY VERSE Shop", url: "/verse/shop", icon: ShoppingBag },
      { title: "Chat", url: "/verse/chat", icon: MessageSquare },
      { title: "Profile", url: "/verse/profile", icon: User },
      { title: "Issues", url: "/verse/issues", icon: BookMarked },
      { title: "UGC", url: "/verse/ugc", icon: Image },
    ],
  },
  {
    label: "Dojo",
    items: [
      { title: "Home", url: "/dojo", icon: Home },
      { title: "MNKY CHAT", url: "/dojo/chat", icon: MessageSquare },
      { title: "Crafting", url: "/dojo/crafting", icon: FlaskConical },
    ],
  },
];

/** Get nav groups for the active context */
export function getDojoNavGroupsForContext(contextId: DojoContextId): DojoNavGroup[] {
  switch (contextId) {
    case "crafting":
      return dojoCraftingNavGroups;
    case "verse":
      return dojoVerseNavGroups;
    case "chat":
      return dojoChatNavGroups;
    default:
      return dojoNavGroups;
  }
}

/** Quick access / projects for sidebar-07 NavProjects */
export const dojoQuickAccessItems: { name: string; url: string; icon: LucideIcon }[] = [
  { name: "MNKY VERSE Shop", url: "/verse/shop", icon: ShoppingBag },
  { name: "Chat", url: "/verse/chat", icon: MessageSquare },
  { name: "Profile", url: "/verse/profile", icon: User },
  { name: "Issues", url: "/verse/issues", icon: BookMarked },
  { name: "UGC", url: "/verse/ugc", icon: Image },
];

/** Crafting quick access */
export const dojoCraftingQuickAccessItems: { name: string; url: string; icon: LucideIcon }[] = [
  { name: "Blending Lab", url: "/dojo/crafting", icon: FlaskConical },
  { name: "Saved Blends", url: "/dojo/crafting/saved", icon: BookMarked },
  { name: "Glossary", url: "/verse/glossary", icon: BookMarked },
  { name: "MNKY VERSE Shop", url: "/verse/shop", icon: ShoppingBag },
];

/** Chat quick access (optional) */
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
