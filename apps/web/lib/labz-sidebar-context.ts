/**
 * LABZ sidebar context (workspace) switcher.
 * Persists active context so the sidebar shows only relevant groups.
 */

import type { LucideIcon } from "lucide-react";
import { FlaskConical, Store, Globe, Server, Bot } from "lucide-react";

export const LABZ_CONTEXT_IDS = ["lab", "store", "verse", "platform", "ai-tools"] as const;
export type LabzContextId = (typeof LABZ_CONTEXT_IDS)[number];

export const DEFAULT_LABZ_CONTEXT: LabzContextId = "lab";
export const LABZ_CONTEXT_STORAGE_KEY = "labz-active-context";

export interface LabzContextConfig {
  id: LabzContextId;
  name: string;
  icon: LucideIcon;
  plan: string;
  href: string;
}

export const labzContexts: LabzContextConfig[] = [
  { id: "lab", name: "Lab", icon: FlaskConical, plan: "Product data & builder", href: "/" },
  { id: "store", name: "Store", icon: Store, plan: "Shopify admin", href: "/store" },
  { id: "verse", name: "Dojo", icon: Globe, plan: "Storefront & community", href: "/dojo" },
  { id: "platform", name: "Platform", icon: Server, plan: "Data & automation", href: "/platform" },
  { id: "ai-tools", name: "AI Tools", icon: Bot, plan: "Chat & studio", href: "/chat" },
];

/** Ecosystem links shown in context switcher dropdown (cross-context). */
export const labzEcosystemLinks: { label: string; href: string; external: boolean }[] = [
  { label: "Home (MOOD MNKY)", href: "/main", external: false },
  { label: "Documentation", href: "/docs", external: false },
  { label: "MNKY DOJO", href: "/dojo", external: false },
];
