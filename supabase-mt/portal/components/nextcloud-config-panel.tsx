"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { toast } from "sonner";
import { Users, Server, Package, Loader2, UsersRound } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const NEXTCLOUD_PROXY = "/api/backoffice/nextcloud";

function useNextcloudApi(instanceId: string | null) {
  const get = useCallback(
    async <T,>(path: string): Promise<T> => {
      if (!instanceId) throw new Error("No instance selected");
      const url = `${NEXTCLOUD_PROXY}/${path}?instanceId=${encodeURIComponent(instanceId)}`;
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { message?: string }).message ?? res.statusText);
      }
      return res.json() as Promise<T>;
    },
    [instanceId]
  );

  return useMemo(() => ({ get }), [get]);
}

type OcsResponse<T> = { ocs?: { meta?: { status?: string; statuscode?: number }; data?: T } };

function UserDetailPopover({ instanceId, userId }: { instanceId: string; userId: string }) {
  const api = useNextcloudApi(instanceId);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get<OcsResponse<Record<string, unknown>>>(`users/${encodeURIComponent(userId)}`)
      .then((res) => setData(res?.ocs?.data ?? null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [api, userId]);

  return (
    <Popover onOpenChange={(open) => open && load()}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="font-mono text-sm h-auto py-1 px-2 -ml-2">
          {userId}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start">
        {loading ? (
          <p className="text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" /> Loading…</p>
        ) : data ? (
          <div className="space-y-2 text-xs">
            <p className="font-medium">{String(data.displayname ?? data.display_name ?? userId)}</p>
            {data.email != null && <p className="text-muted-foreground">Email: {String(data.email)}</p>}
            {data.quota != null && typeof data.quota === "object" && (
              <p className="text-muted-foreground">
                Quota: used {String((data.quota as Record<string, unknown>).used ?? "—")} / total {String((data.quota as Record<string, unknown>).total ?? "—")}
              </p>
            )}
            {data.groups != null && (
              <p className="text-muted-foreground">Groups: {Array.isArray(data.groups) ? (data.groups as unknown[]).join(", ") : String(data.groups)}</p>
            )}
            {data.enabled != null && <p>Enabled: {String(data.enabled)}</p>}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Could not load user details.</p>
        )}
      </PopoverContent>
    </Popover>
  );
}

function UsersTab({ instanceId }: { instanceId: string }) {
  const api = useNextcloudApi(instanceId);
  const [userIds, setUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(() => {
    setLoading(true);
    api
      .get<OcsResponse<{ users?: string[] }>>("users")
      .then((res) => {
        const data = res?.ocs?.data;
        const list = data?.users ?? [];
        setUserIds(Array.isArray(list) ? list : []);
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [api]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{userIds.length} user(s). Click ID for details. Admin-only.</p>
      {userIds.length === 0 ? (
        <p className="text-sm text-muted-foreground">No users or insufficient permissions.</p>
      ) : (
        <div className="max-h-[280px] overflow-auto scrollbar-hide rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userIds.map((id) => (
                <TableRow key={id}>
                  <TableCell className="font-mono text-sm">
                    <UserDetailPopover instanceId={instanceId} userId={id} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function GroupsTab({ instanceId }: { instanceId: string }) {
  const api = useNextcloudApi(instanceId);
  const [groups, setGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<OcsResponse<{ groups?: string[] | { element?: string[] } }>>("groups")
      .then((res) => {
        const data = res?.ocs?.data;
        const raw = data?.groups;
        if (Array.isArray(raw)) setGroups(raw);
        else if (raw && typeof raw === "object" && Array.isArray((raw as { element?: string[] }).element))
          setGroups((raw as { element: string[] }).element);
        else setGroups([]);
      })
      .catch((e) => {
        toast.error(e.message);
        setGroups([]);
      })
      .finally(() => setLoading(false));
  }, [instanceId, api]);

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{groups.length} group(s).</p>
      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">No groups or insufficient permissions.</p>
      ) : (
        <div className="max-h-[280px] overflow-auto scrollbar-hide rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((id) => (
                <TableRow key={id}>
                  <TableCell className="font-mono text-sm">{id}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function CapabilitySection({
  name,
  value,
  depth = 0,
}: {
  name: string;
  value: unknown;
  depth?: number;
}) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "object" || Array.isArray(value)) {
    const str = Array.isArray(value) ? value.join(", ") : String(value);
    return (
      <div className="flex gap-2 py-1.5" style={{ paddingLeft: depth * 12 }}>
        <span className="font-medium text-foreground shrink-0">{name}:</span>
        <span className="text-muted-foreground font-mono text-xs break-all">{str}</span>
      </div>
    );
  }
  const obj = value as Record<string, unknown>;
  const entries = Object.entries(obj);
  if (entries.length === 0) return null;
  return (
    <div className="space-y-1" style={{ paddingLeft: depth * 12 }}>
      <div className="font-medium text-foreground pt-2 first:pt-0">{name}</div>
      <div className="border-l border-border pl-3 space-y-0">
        {entries.map(([k, v]) =>
          typeof v === "object" && v !== null && !Array.isArray(v) ? (
            <CapabilitySection key={k} name={k} value={v} depth={0} />
          ) : (
            <CapabilitySection key={k} name={k} value={v} depth={0} />
          )
        )}
      </div>
    </div>
  );
}

function CapabilitiesTab({ instanceId }: { instanceId: string }) {
  const api = useNextcloudApi(instanceId);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<OcsResponse<Record<string, unknown>>>("capabilities")
      .then((res) => {
        const d = res?.ocs?.data;
        setData(d && typeof d === "object" ? d : null);
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [instanceId, api]);

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </p>
    );
  }

  if (!data) {
    return <p className="text-sm text-muted-foreground">No capabilities data.</p>;
  }

  const version = data.version as Record<string, unknown> | undefined;
  const versionStr =
    version && typeof version === "object"
      ? [version.major, version.minor, version.micro].filter(Boolean).join(".") ||
        (version.string as string) ||
        "—"
      : "—";
  const capabilities = (data.capabilities as Record<string, unknown>) ?? {};
  const hasCaps = Object.keys(capabilities).length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">Server version</span>
        <span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-0.5 font-mono text-sm font-medium text-primary">
          {versionStr}
        </span>
      </div>
      {hasCaps && (
        <div className="rounded-md border bg-muted/30 overflow-hidden">
          <div className="px-4 py-2 border-b bg-muted/50 text-sm font-medium text-foreground">
            Capabilities
          </div>
          <div className="max-h-[min(400px,50vh)] overflow-auto scrollbar-hide p-4">
            {Object.entries(capabilities).map(([key, value]) => (
              <CapabilitySection key={key} name={key} value={value} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AppsTab({ instanceId }: { instanceId: string }) {
  const api = useNextcloudApi(instanceId);
  const [apps, setApps] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<OcsResponse<{ apps?: string[] | Record<string, unknown> }>>("apps")
      .then((res) => {
        const raw = res?.ocs?.data?.apps;
        if (Array.isArray(raw)) setApps(Object.fromEntries(raw.map((id) => [id, {}])));
        else if (raw && typeof raw === "object" && !Array.isArray(raw)) setApps(raw as Record<string, unknown>);
        else setApps(null);
      })
      .catch((e) => {
        toast.error(e.message);
        setApps(null);
      })
      .finally(() => setLoading(false));
  }, [instanceId, api]);

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </p>
    );
  }

  const appIds = apps ? Object.keys(apps) : [];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{appIds.length} app(s) (installed).</p>
      {appIds.length === 0 ? (
        <p className="text-sm text-muted-foreground">No apps list or insufficient permissions.</p>
      ) : (
        <div className="max-h-[280px] overflow-auto scrollbar-hide rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>App ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appIds.map((id) => (
                <TableRow key={id}>
                  <TableCell className="font-mono text-sm">{id}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export function NextcloudConfigPanel() {
  const searchParams = useSearchParams();
  const instanceId = searchParams.get("instanceId");

  if (!instanceId) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <p className="text-muted-foreground">
          Select an instance from Admin → App instances, or open Configure on a Nextcloud instance.
        </p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/admin">Back to Admin</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Instance:</span>
        <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
          {instanceId.slice(0, 14)}…
        </code>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin">Change</Link>
        </Button>
      </div>
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Users
          </TabsTrigger>
          <TabsTrigger value="groups" className="flex items-center gap-2">
            <UsersRound className="h-4 w-4" /> Groups
          </TabsTrigger>
          <TabsTrigger value="capabilities" className="flex items-center gap-2">
            <Server className="h-4 w-4" /> Capabilities
          </TabsTrigger>
          <TabsTrigger value="apps" className="flex items-center gap-2">
            <Package className="h-4 w-4" /> Apps
          </TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-4">
          <UsersTab instanceId={instanceId} />
        </TabsContent>
        <TabsContent value="groups" className="mt-4">
          <GroupsTab instanceId={instanceId} />
        </TabsContent>
        <TabsContent value="capabilities" className="mt-4">
          <CapabilitiesTab instanceId={instanceId} />
        </TabsContent>
        <TabsContent value="apps" className="mt-4">
          <AppsTab instanceId={instanceId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
