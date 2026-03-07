"use client";

import * as React from "react";

export type TenantItem = { id: string; slug: string; name: string };

export type ActiveTeam =
  | { type: "org"; tenant: TenantItem }
  | { type: "platform" }
  | { type: "proxmox" };

export type AppInstancesByTenant = Record<
  string,
  { flowise?: string; n8n?: string }
>;

export type DashboardInitialData = {
  user: { id: string; email?: string; fullName?: string; avatarUrl?: string };
  profile: { displayName: string; avatarUrl: string | null };
  tenants: TenantItem[];
  isPlatformAdmin: boolean;
  appInstancesByTenant: AppInstancesByTenant;
};

export type DashboardContextValue = DashboardInitialData & {
  activeTeam: ActiveTeam | null;
  setActiveTeam: (team: ActiveTeam) => void;
};

const DashboardContext = React.createContext<DashboardContextValue | null>(null);

const STORAGE_KEY = "portal-dashboard-active-team";

export function useDashboardContext(): DashboardContextValue {
  const ctx = React.useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboardContext must be used within DashboardProvider");
  return ctx;
}

export function useDashboardContextOptional(): DashboardContextValue | null {
  return React.useContext(DashboardContext);
}

type DashboardProviderProps = {
  initialData: DashboardInitialData;
  children: React.ReactNode;
};

function getDefaultActiveTeam(
  tenants: TenantItem[],
  isPlatformAdmin: boolean
): ActiveTeam | null {
  if (tenants.length > 0) return { type: "org", tenant: tenants[0] };
  if (isPlatformAdmin) return { type: "platform" };
  return null;
}

export function DashboardProvider({ initialData, children }: DashboardProviderProps) {
  const { tenants, isPlatformAdmin } = initialData;

  const [activeTeam, setActiveTeamState] = React.useState<ActiveTeam | null>(() =>
    getDefaultActiveTeam(tenants, isPlatformAdmin)
  );

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { type: string; slug?: string };
      if (parsed.type === "platform" && isPlatformAdmin) {
        setActiveTeamState({ type: "platform" });
        return;
      }
      if (parsed.type === "org" && parsed.slug) {
        const tenant = tenants.find((t) => t.slug === parsed.slug);
        if (tenant) setActiveTeamState({ type: "org", tenant });
      }
    } catch {
      // ignore
    }
  }, [tenants, isPlatformAdmin]);

  const setActiveTeam = React.useCallback((team: ActiveTeam) => {
    setActiveTeamState(team);
    try {
      if (team.type === "platform") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ type: "platform" }));
      } else if (team.type === "proxmox") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ type: "proxmox" }));
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ type: "org", slug: team.tenant.slug }));
      }
    } catch {
      // ignore
    }
  }, []);

  const resolvedActiveTeam = React.useMemo(() => {
    if (activeTeam) return activeTeam;
    if (tenants.length > 0) return { type: "org" as const, tenant: tenants[0] };
    if (isPlatformAdmin) return { type: "platform" as const };
    return null;
  }, [activeTeam, tenants, isPlatformAdmin]);

  const value: DashboardContextValue = React.useMemo(
    () => ({
      ...initialData,
      activeTeam: resolvedActiveTeam,
      setActiveTeam,
    }),
    [initialData, resolvedActiveTeam, setActiveTeam]
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}
