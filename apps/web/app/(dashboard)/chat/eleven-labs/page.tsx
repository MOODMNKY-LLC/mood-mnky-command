"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Mic, Save, TestTube } from "lucide-react";
import type { ElevenLabsConfigGet } from "@/app/api/chat/eleven-labs-config/route";

const CONNECTION_TYPES = [
  { value: "webrtc", label: "WebRTC (recommended)" },
  { value: "websocket", label: "WebSocket" },
];

export default function ElevenLabsConfigPage() {
  const [config, setConfig] = useState<ElevenLabsConfigGet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [agentId, setAgentId] = useState("");
  const [apiKeyOverride, setApiKeyOverride] = useState("");
  const [connectionType, setConnectionType] = useState("webrtc");

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/chat/eleven-labs-config");
      if (!res.ok) throw new Error("Failed to load config");
      const data: ElevenLabsConfigGet = await res.json();
      setConfig(data);
      setAgentId(data.agentId ?? "");
      setConnectionType(data.connectionType ?? "webrtc");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load config");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/chat/eleven-labs-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: agentId.trim() || undefined,
          apiKeyOverride: apiKeyOverride.trim() || null,
          connectionType,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Failed to save");
      }
      setSuccess("Config saved.");
      setApiKeyOverride(""); // Clear override field after save (don't re-display)
      fetchConfig();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save config");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setError(null);
    try {
      const res = await fetch("/api/chat/eleven-labs-config");
      if (!res.ok) throw new Error("Config not available");
      const data: ElevenLabsConfigGet = await res.json();
      if (!data.agentId) throw new Error("Set an Agent ID and save first.");
      setSuccess("Config loaded. Use Verse chat or a voice session to test the agent.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Test failed");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl space-y-6 py-8">
      <div className="flex items-center gap-2">
        <Mic className="h-8 w-8 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Eleven Labs</h1>
          <p className="text-sm text-muted-foreground">
            Configure the MOOD MNKY voice agent for Verse and LABZ.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Voice agent config</CardTitle>
          <CardDescription>
            Agent ID is required for the in-app voice agent. Get it from the ElevenLabs
            dashboard → Agents. API key is read from the server environment unless you set an override.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {config?.hasApiKeyOverride !== undefined && (
            <p className="text-xs text-muted-foreground">
              {config.hasApiKeyOverride ? "Using stored API key override." : "Using ELEVEN_LABS_API_KEY from environment."}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="agentId">Agent ID</Label>
            <Input
              id="agentId"
              placeholder="e.g. abc123..."
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              From ElevenLabs dashboard → your agent → Agent ID.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKeyOverride">API key override (optional)</Label>
            <Input
              id="apiKeyOverride"
              type="password"
              placeholder="Leave blank to use ELEVEN_LABS_API_KEY"
              value={apiKeyOverride}
              onChange={(e) => setApiKeyOverride(e.target.value)}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Override the server env key. Stored in database; leave blank to use .env.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Connection type</Label>
            <Select value={connectionType} onValueChange={setConnectionType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONNECTION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-md border border-green-500/50 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
              {success}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save
            </Button>
            <Button variant="outline" onClick={handleTest} disabled={testing}>
              {testing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="mr-2 h-4 w-4" />
              )}
              Test connection
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
