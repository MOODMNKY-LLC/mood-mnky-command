"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export type OverrideConfig = Record<string, unknown>;

export interface FlowiseOverrideConfigEditorProps {
  value: OverrideConfig;
  onChange: (value: OverrideConfig) => void;
  onSave?: () => void | Promise<void>;
  saving?: boolean;
  assignmentId?: string;
  /** Optional preset: inject supabaseMetadataFilter with profile_id */
  profileId?: string | null;
  /** Optional: user's document store id for preset */
  userStoreId?: string | null;
  className?: string;
}

const PRESET_KEYS = [
  "documentStoreId",
  "supabaseMetadataFilter",
  "topK",
  "systemMessage",
  "returnSourceDocuments",
  "vars",
] as const;

export function FlowiseOverrideConfigEditor({
  value,
  onChange,
  onSave,
  saving = false,
  profileId,
  userStoreId,
  className,
}: FlowiseOverrideConfigEditorProps) {
  const [rawJson, setRawJson] = useState(() => JSON.stringify(value, null, 2));
  const [activeTab, setActiveTab] = useState<"structured" | "raw">("raw");

  const syncFromRaw = (raw: string) => {
    try {
      const parsed = JSON.parse(raw) as OverrideConfig;
      onChange(parsed);
      setRawJson(JSON.stringify(parsed, null, 2));
    } catch {
      // invalid json, keep raw
    }
  };

  const handlePreset = (preset: "my-store" | "my-profile") => {
    const next = { ...value };
    if (preset === "my-store" && userStoreId) {
      next.documentStoreId = userStoreId;
    }
    if (preset === "my-profile" && profileId) {
      next.supabaseMetadataFilter = { profile_id: profileId };
    }
    onChange(next);
    setRawJson(JSON.stringify(next, null, 2));
  };

  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "structured" | "raw")}>
        <TabsList className="mb-2">
          <TabsTrigger value="raw">Raw JSON</TabsTrigger>
          <TabsTrigger value="structured">Presets</TabsTrigger>
        </TabsList>
        <TabsContent value="structured" className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {userStoreId && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePreset("my-store")}
              >
                Use my document store
              </Button>
            )}
            {profileId && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePreset("my-profile")}
              >
                Filter by my profile (Supabase)
              </Button>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-xs">documentStoreId</Label>
            <Input
              value={(value.documentStoreId as string) ?? ""}
              onChange={(e) => onChange({ ...value, documentStoreId: e.target.value || undefined })}
              placeholder="Flowise store UUID"
              className="font-mono text-xs"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">topK (retrieval count)</Label>
            <Input
              type="number"
              value={(value.topK as number) ?? ""}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                onChange({ ...value, topK: Number.isNaN(n) ? undefined : n });
              }}
              placeholder="e.g. 4"
              className="font-mono text-xs"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">systemMessage</Label>
            <Textarea
              value={(value.systemMessage as string) ?? ""}
              onChange={(e) => onChange({ ...value, systemMessage: e.target.value || undefined })}
              placeholder="Override system prompt"
              className="min-h-[60px] font-mono text-xs"
            />
          </div>
        </TabsContent>
        <TabsContent value="raw" className="mt-0">
          <Label className="text-xs">Override config (JSON)</Label>
          <Textarea
            className="min-h-[140px] font-mono text-xs"
            value={rawJson}
            onChange={(e) => setRawJson(e.target.value)}
            onBlur={() => syncFromRaw(rawJson)}
            placeholder='{"documentStoreId": "...", "supabaseMetadataFilter": {"profile_id": "..."}}'
          />
        </TabsContent>
      </Tabs>
      {onSave && (
        <Button
          size="sm"
          disabled={saving}
          onClick={onSave}
          className="mt-3"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save overrides"}
        </Button>
      )}
    </div>
  );
}
