/**
 * Dojo sidebar navigation configuration.
 * Members' private hub nav: Home, Preferences, and links to Verse.
 */

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import {
  Home,
  Settings,
  ShoppingBag,
  MessageSquare,
  User,
  LogOut,
  Globe,
  BookMarked,
  Image,
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

/** Teams for TeamSwitcher – single team for MVP */
export const dojoTeams: {
  name: string;
  logo: React.ComponentType<{ className?: string }>;
  plan: string;
}[] = [
  { name: "The Dojo", logo: DojoLogo, plan: "Your space" },
];

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

/** Verse section: links to public-facing parts */
export const verseLinkItems: DojoNavItem[] = [
  { title: "Verse Home", href: "/verse", icon: Globe },
  { title: "Verse Shop", href: "/verse/shop", icon: ShoppingBag },
  { title: "Chat", href: "/verse/chat", icon: MessageSquare },
  { title: "Profile", href: "/verse/profile", icon: User },
];

/** Nav groups for sidebar-07 NavMain (collapsible) */
export const dojoNavGroups: {
  label: string;
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: { title: string; url: string }[];
  }[];
}[] = [
  {
    label: "Dojo",
    items: [
      { title: "Home", url: "/dojo", icon: Home, isActive: true },
      { title: "Preferences", url: "/dojo/preferences", icon: Settings },
    ],
  },
  {
    label: "MNKY VERSE",
    items: [
      { title: "Verse Home", url: "/verse", icon: Globe },
      { title: "Verse Shop", url: "/verse/shop", icon: ShoppingBag },
      { title: "Chat", url: "/verse/chat", icon: MessageSquare },
      { title: "Profile", url: "/verse/profile", icon: User },
    ],
  },
];

/** Quick access / projects for sidebar-07 NavProjects */
export const dojoQuickAccessItems: { name: string; url: string; icon: LucideIcon }[] = [
  { name: "Verse Shop", url: "/verse/shop", icon: ShoppingBag },
  { name: "Chat", url: "/verse/chat", icon: MessageSquare },
  { name: "Profile", url: "/verse/profile", icon: User },
  { name: "Issues", url: "/verse/issues", icon: BookMarked },
  { name: "UGC", url: "/verse/ugc", icon: Image },
];
