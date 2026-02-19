/**
 * Dojo sidebar navigation configuration.
 * Members' private hub nav: Home, Preferences, and links to Verse.
 */

import type { LucideIcon } from "lucide-react";
import {
  Home,
  Settings,
  ShoppingBag,
  MessageSquare,
  User,
  LogOut,
  Globe,
} from "lucide-react";

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
