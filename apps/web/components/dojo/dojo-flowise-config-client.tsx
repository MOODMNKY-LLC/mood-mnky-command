"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useVerseUser } from "@/components/verse/verse-user-context";
import {
  Agent,
  AgentHeader,
  AgentContent,
  AgentInstructions,
  AgentOutput,
} from "@/components/ai-elements/agent";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageSquare, FileUp } from "lucide-react";

export type FlowiseAssignment = {
  id: string;
  profile_id: string;
  chatflow_id: string;
  display_name: string | null;
  override_config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export function DojoFlowiseConfigClient() {
  const user = useVerseUser();
  const [assignments, setAssignments] = useState<FlowiseAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editOverrides, setEditOverrides] = useState<Record<string, string>>({});
  const [docStores, setDocStores] = useState<Array<{ id: string; name?: string }>>([]);
  const [docStoresLoading, setDocStoresLoading] = useState(false);
  const [uploadStoreId, setUploadStoreId] = useState("");
  const [uploading, setUploading] = useState(false);

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
    setDocStoresLoading(true);
    fetch("/api/flowise/document-store/stores", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : (data as { stores?: Array<{ id: string; name?: string }> })?.stores ?? [];
        setDocStores(list.map((s: { id: string; name?: string }) => ({ id: s.id, name: s.name })));
      })
      .catch(() => setDocStores([]))
      .finally(() => setDocStoresLoading(false));
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
          a.id === assignment.id ? { ...a, override_config: parsed, updated_at: new Date().toISOString() } : a,
        ),
      );
    }
  };

  const handleDocStoreUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!uploadStoreId) return;
    const form = e.currentTarget;
    const formData = new FormData(form);
    const files = formData.getAll("files") as File[];
    if (!files.length || !files[0]?.size) return;
    setUploading(true);
    try {
      const uploadFormData = new FormData();
      files.forEach((f) => uploadFormData.append("files", f));
      const res = await fetch(`/api/flowise/document-store/upsert/${uploadStoreId}`, {
        method: "POST",
        credentials: "same-origin",
        body: uploadFormData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string })?.error ?? "Upload failed");
      }
      form.reset();
    } finally {
      setUploading(false);
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
        <Agent key={a.id} className="flex flex-col">
          <AgentHeader
            name={a.display_name || a.chatflow_id}
            model={a.chatflow_id.length > 20 ? `${a.chatflow_id.slice(0, 20)}…` : a.chatflow_id}
          />
          <AgentContent>
            <AgentInstructions>
              {typeof a.override_config?.systemMessage === "string"
                ? String(a.override_config.systemMessage).slice(0, 200) + (String(a.override_config.systemMessage).length > 200 ? "…" : "")
                : "Override config for this chatflow. Edit below and save."}
            </AgentInstructions>
            <div className="space-y-2">
              <Label className="text-xs">Override config (JSON)</Label>
              <Textarea
                className="min-h-[120px] font-mono text-xs"
                value={editOverrides[a.id] ?? "{}"}
                onChange={(e) =>
                  setEditOverrides((prev) => ({ ...prev, [a.id]: e.target.value }))
                }
                placeholder="{}"
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  disabled={savingId === a.id}
                  onClick={() => handleSaveOverride(a)}
                >
                  {savingId === a.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Save overrides"
                  )}
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/dojo/chat?chatflowId=${encodeURIComponent(a.chatflow_id)}`}>
                    <MessageSquare className="mr-1 h-4 w-4" />
                    Open in chat
                  </Link>
                </Button>
              </div>
            </div>
            {Object.keys(a.override_config).length > 0 && (
              <AgentOutput
                schema={`Override keys: ${Object.keys(a.override_config).join(", ") || "none"}`}
              />
            )}
          </AgentContent>
        </Agent>
      ))}
      </div>

      <div className="rounded-lg border bg-card p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-medium">
          <FileUp className="h-4 w-4" />
          Document store
        </h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Upload files to a Flowise document store (RAG). Requires a Flowise API key in your profile.
        </p>
        {docStoresLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : docStores.length === 0 ? (
          <p className="text-sm text-muted-foreground">No document stores available or no API key set.</p>
        ) : (
          <form onSubmit={handleDocStoreUpload} className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Store</Label>
              <select
                className="flex h-9 w-[200px] rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                value={uploadStoreId}
                onChange={(e) => setUploadStoreId(e.target.value)}
              >
                <option value="">Select store</option>
                {docStores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name ?? s.id}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Files</Label>
              <input type="file" name="files" multiple className="text-sm" />
            </div>
            <Button type="submit" size="sm" disabled={!uploadStoreId || uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
