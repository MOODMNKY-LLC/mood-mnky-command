"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useVerseUser } from "@/components/verse/verse-user-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { FlowiseAgentCard } from "./flowise-agent-card";
import { FlowiseOverrideConfigEditor } from "./flowise-override-config-editor";
import { FlowiseDocumentUpload } from "./flowise-document-upload";

export type FlowiseAssignment = {
  id: string;
  profile_id: string;
  chatflow_id: string;
  display_name: string | null;
  override_config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export function FlowiseChatflowControlPanel() {
  const user = useVerseUser();
  const [assignments, setAssignments] = useState<FlowiseAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editOverrides, setEditOverrides] = useState<Record<string, string>>({});
  const [userStoreId, setUserStoreId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const supabase = createClient();
    supabase
      .from("flowise_chatflow_assignments")
      .select("id, profile_id, chatflow_id, display_name, override_config, created_at, updated_at")
      .eq("profile_id", user.id)
      .order("updated_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setAssignments([]);
          return;
        }
        setAssignments((data ?? []) as FlowiseAssignment[]);
        const initial: Record<string, string> = {};
        (data ?? []).forEach((row: FlowiseAssignment) => {
          initial[row.id] =
            typeof row.override_config === "object" && row.override_config !== null
              ? JSON.stringify(row.override_config, null, 2)
              : "{}";
        });
        setEditOverrides(initial);
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    fetch("/api/flowise/user-document-store?scope=dojo", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data: { storeId?: string | null }) => {
        setUserStoreId(data.storeId ?? null);
      })
      .catch(() => setUserStoreId(null));
  }, [user?.id]);

  const handleSaveOverride = async (assignment: FlowiseAssignment) => {
    const raw = editOverrides[assignment.id] ?? "{}";
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return;
    }
    setSavingId(assignment.id);
    const supabase = createClient();
    const { error } = await supabase
      .from("flowise_chatflow_assignments")
      .update({
        override_config: parsed,
        updated_at: new Date().toISOString(),
      })
      .eq("id", assignment.id)
      .eq("profile_id", user?.id);
    setSavingId(null);
    if (!error) {
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === assignment.id
            ? { ...a, override_config: parsed, updated_at: new Date().toISOString() }
            : a,
        ),
      );
      setEditOverrides((prev) => ({ ...prev, [assignment.id]: JSON.stringify(parsed, null, 2) }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        <p>No chatflows assigned yet. An admin can assign chatflows to your account.</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/dojo/chat">Open Dojo chat</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2">
        {assignments.map((a) => (
          <FlowiseAgentCard
            key={a.id}
            id={a.id}
            chatflowId={a.chatflow_id}
            displayName={a.display_name}
            overrideConfig={a.override_config}
            chatHref={`/dojo/chat?chatflowId=${encodeURIComponent(a.chatflow_id)}`}
          >
            <FlowiseOverrideConfigEditor
              value={
                (() => {
                  try {
                    return (JSON.parse(editOverrides[a.id] ?? "{}") ||
                      {}) as Record<string, unknown>;
                  } catch {
                    return {};
                  }
                })()
              }
              onChange={(v) =>
                setEditOverrides((prev) => ({ ...prev, [a.id]: JSON.stringify(v, null, 2) }))
              }
              onSave={() => handleSaveOverride(a)}
              saving={savingId === a.id}
              profileId={user?.id}
              userStoreId={userStoreId}
            />
          </FlowiseAgentCard>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Document store</CardTitle>
        </CardHeader>
        <CardContent>
          <FlowiseDocumentUpload />
        </CardContent>
      </Card>
    </div>
  );
}
