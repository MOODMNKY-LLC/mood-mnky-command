import type { LucideIcon } from "lucide-react";
import {
  BarChart3Icon,
  LayoutDashboardIcon,
  RadioIcon,
  SettingsIcon,
  TvIcon,
  SwordsIcon,
  ListIcon,
  DatabaseIcon,
  UsersIcon,
  ShieldIcon,
  GaugeIcon,
  Swords,
  Skull,
  Crosshair,
  Castle,
  DoorOpen,
} from "lucide-react";

export type DashboardContext = "fflogs" | "live" | "act" | null;

export const CONTEXT_SEGMENTS: Record<Exclude<DashboardContext, null>, string> = {
  fflogs: "fflogs",
  live: "live",
  act: "act",
};

export const CONTEXT_LABELS: Record<Exclude<DashboardContext, null>, string> = {
  fflogs: "FFLogs",
  live: "Live / Overlay",
  act: "ACT / Raid Data",
};

export type NavItem = { title: string; url: string; icon: LucideIcon };
export type DocItem = { name: string; url: string; icon: LucideIcon };

const accountSecondary: NavItem[] = [
  { title: "Account", url: "/auth/update-password", icon: SettingsIcon },
];

export type DutyCategory = "savage" | "ultimates" | "trials" | "raids" | "dungeons";

export const CONTEXT_NAV: Record<
  Exclude<DashboardContext, null>,
  {
    navMain: NavItem[];
    documents: DocItem[];
    navSecondary: NavItem[];
    duties?: NavItem[];
  }
> = {
  fflogs: {
    navMain: [
      { title: "Overview", url: "/dashboard/fflogs", icon: LayoutDashboardIcon },
      { title: "Reports", url: "/dashboard/fflogs#reports", icon: BarChart3Icon },
      { title: "Characters", url: "/dashboard/fflogs/characters", icon: UsersIcon },
      { title: "Guilds", url: "/dashboard/fflogs/guilds", icon: ShieldIcon },
      { title: "API usage", url: "/dashboard/fflogs#api-usage", icon: GaugeIcon },
    ],
    documents: [
      { name: "My reports", url: "/dashboard/fflogs#reports", icon: BarChart3Icon },
      { name: "Character lookup", url: "/dashboard/fflogs/characters", icon: UsersIcon },
      { name: "Guild lookup", url: "/dashboard/fflogs/guilds", icon: ShieldIcon },
    ],
    duties: [
      { title: "Savage", url: "/dashboard/fflogs?duty=savage", icon: Swords },
      { title: "Ultimates", url: "/dashboard/fflogs?duty=ultimates", icon: Skull },
      { title: "Trials", url: "/dashboard/fflogs?duty=trials", icon: Crosshair },
      { title: "Raids", url: "/dashboard/fflogs?duty=raids", icon: Castle },
      { title: "Dungeons", url: "/dashboard/fflogs?duty=dungeons", icon: DoorOpen },
    ],
    navSecondary: accountSecondary,
  },
  live: {
    navMain: [
      { title: "Overview", url: "/dashboard/live", icon: LayoutDashboardIcon },
      { title: "Stream sessions", url: "/dashboard/live#sessions", icon: RadioIcon },
      { title: "Overlay", url: "/overlay/stream", icon: TvIcon },
    ],
    documents: [
      { name: "Sessions", url: "/dashboard/live#sessions", icon: RadioIcon },
    ],
    navSecondary: accountSecondary,
  },
  act: {
    navMain: [
      { title: "Overview", url: "/dashboard/act", icon: LayoutDashboardIcon },
      { title: "Encounters", url: "/dashboard/act#encounters", icon: SwordsIcon },
      { title: "Combatants", url: "/dashboard/act#combatants", icon: ListIcon },
      { title: "Current", url: "/dashboard/act#current", icon: DatabaseIcon },
    ],
    documents: [
      { name: "Data explorer", url: "/dashboard/act#encounters", icon: DatabaseIcon },
    ],
    navSecondary: accountSecondary,
  },
};

export function getContextFromPathname(pathname: string | null): DashboardContext {
  if (!pathname) return null;
  if (pathname.startsWith("/dashboard/fflogs")) return "fflogs";
  if (pathname.startsWith("/dashboard/live")) return "live";
  if (pathname.startsWith("/dashboard/act")) return "act";
  return null;
}
