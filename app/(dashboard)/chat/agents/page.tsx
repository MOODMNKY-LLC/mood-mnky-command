"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Loader2, Bot, ChevronDown, ChevronUp, Save, Volume2 } from "lucide-react";
import type { AgentProfile } from "@/lib/agents";
import { OPENAI_VOICES, VOICE_PREVIEW_PHRASE } from "@/lib/voice-preview";

interface AgentFormState {
  display_name: string;
  blurb: string;
  image_path: string;
  openai_model: string;
  openai_voice: string;
  system_instructions: string;
  eleven_labs_agent_id: string;
  sort_order: number;
  is_active: boolean;
}

function agentToFormState(a: AgentProfile): AgentFormState {
  return {
    display_name: a.display_name ?? "",
    blurb: a.blurb ?? "",
    image_path: a.image_path ?? "",
    openai_model: a.openai_model ?? "gpt-realtime",
    openai_voice: a.openai_voice ?? "marin",
    system_instructions: a.system_instructions ?? "",
    eleven_labs_agent_id: a.eleven_labs_agent_id ?? "",
    sort_order: a.sort_order ?? 0,
    is_active: a.is_active ?? true,
  };
}

export default function AgentsAdminPage() {
  const [agents, setAgents] = useState<AgentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [successSlug, setSuccessSlug] = useState<string | null>(null);
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [previewingSlug, setPreviewingSlug] = useState<string | null>(null);
  const [formState, setFormState] = useState<Record<string, AgentFormState>>({});

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/labz/agents");
      if (!res.ok) throw new Error("Failed to load agents");
      const data = await res.json();
      const list = data.agents ?? [];
      setAgents(list);
      const state: Record<string, AgentFormState> = {};
      list.forEach((a: AgentProfile) => {
        state[a.slug] = agentToFormState(a);
      });
      setFormState(state);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load agents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleSave = async (slug: string) => {
    const state = formState[slug];
    if (!state) return;
    setSavingSlug(slug);
    setError(null);
    setSuccessSlug(null);
    try {
      const res = await fetch("/api/labz/agents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          display_name: state.display_name.trim() || undefined,
          blurb: state.blurb.trim() || undefined,
          image_path: state.image_path.trim() || undefined,
          openai_model: state.openai_model || undefined,
          openai_voice: state.openai_voice || undefined,
          system_instructions: state.system_instructions.trim() || undefined,
          eleven_labs_agent_id: state.eleven_labs_agent_id.trim() || null,
          sort_order: state.sort_order,
          is_active: state.is_active,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Failed to save");
      }
      setSuccessSlug(slug);
      fetchAgents();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save agent");
    } finally {
      setSavingSlug(null);
    }
  };

  const updateForm = (slug: string, updates: Partial<AgentFormState>) => {
    setFormState((prev) => ({
      ...prev,
      [slug]: { ...(prev[slug] ?? agentToFormState(agents.find((a) => a.slug === slug)!)), ...updates },
    }));
  };

  const handleVoicePreview = async (slug: string, voice: string) => {
    setPreviewingSlug(slug);
    setError(null);
    try {
      const res = await fetch("/api/audio/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: VOICE_PREVIEW_PHRASE.replace("{voice}", voice),
          voice,
          model: "gpt-4o-mini-tts",
          saveToLibrary: false,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Preview failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      await audio.play();
      audio.onended = () => URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Voice preview error:", e);
      setError(e instanceof Error ? e.message : "Voice preview failed");
    } finally {
      setPreviewingSlug(null);
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
    <div className="container max-w-3xl space-y-6 py-8">
      <div className="flex items-center gap-2">
        <Bot className="h-8 w-8 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agent Profiles</h1>
          <p className="text-sm text-muted-foreground">
            Configure MOOD MNKY, SAGE MNKY, and CODE MNKY for Verse and Realtime voice.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {agents.map((agent) => {
          const state = formState[agent.slug] ?? agentToFormState(agent);
          const isOpen = openSlug === agent.slug;
          return (
            <Collapsible
              key={agent.slug}
              open={isOpen}
              onOpenChange={(o) => setOpenSlug(o ? agent.slug : null)}
            >
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{agent.display_name}</CardTitle>
                        <CardDescription>{agent.slug}</CardDescription>
                      </div>
                      {isOpen ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4 pt-0">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`${agent.slug}-display_name`}>Display name</Label>
                        <Input
                          id={`${agent.slug}-display_name`}
                          value={state.display_name}
                          onChange={(e) =>
                            updateForm(agent.slug, { display_name: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`${agent.slug}-image_path`}>Image path</Label>
                        <Input
                          id={`${agent.slug}-image_path`}
                          value={state.image_path}
                          onChange={(e) =>
                            updateForm(agent.slug, { image_path: e.target.value })
                          }
                          placeholder="/verse/mood-mnky-3d.png"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${agent.slug}-blurb`}>Blurb</Label>
                      <Input
                        id={`${agent.slug}-blurb`}
                        value={state.blurb}
                        onChange={(e) =>
                          updateForm(agent.slug, { blurb: e.target.value })
                        }
                        placeholder="Short description for cards"
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>OpenAI model</Label>
                        <Input
                          value={state.openai_model}
                          onChange={(e) =>
                            updateForm(agent.slug, { openai_model: e.target.value })
                          }
                          placeholder="gpt-realtime"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Voice</Label>
                        <div className="flex gap-2">
                          <Select
                            value={state.openai_voice}
                            onValueChange={(v) =>
                              updateForm(agent.slug, { openai_voice: v })
                            }
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {OPENAI_VOICES.map((v) => (
                                <SelectItem key={v} value={v}>
                                  {v}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => handleVoicePreview(agent.slug, state.openai_voice)}
                            disabled={previewingSlug !== null}
                            title="Preview voice"
                          >
                            {previewingSlug === agent.slug ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Volume2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${agent.slug}-system_instructions`}>
                        System instructions
                      </Label>
                      <Textarea
                        id={`${agent.slug}-system_instructions`}
                        value={state.system_instructions}
                        onChange={(e) =>
                          updateForm(agent.slug, {
                            system_instructions: e.target.value,
                          })
                        }
                        rows={8}
                        className="font-mono text-sm"
                        placeholder="System prompt for this agent..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`${agent.slug}-eleven_labs`}>
                        ElevenLabs agent ID (optional fallback)
                      </Label>
                      <Input
                        id={`${agent.slug}-eleven_labs`}
                        value={state.eleven_labs_agent_id}
                        onChange={(e) =>
                          updateForm(agent.slug, {
                            eleven_labs_agent_id: e.target.value,
                          })
                        }
                        placeholder="Leave blank for OpenAI Realtime only"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`${agent.slug}-is_active`}
                          checked={state.is_active}
                          onCheckedChange={(v) =>
                            updateForm(agent.slug, { is_active: v })
                          }
                        />
                        <Label htmlFor={`${agent.slug}-is_active`}>Active</Label>
                      </div>
                      <Button
                        onClick={() => handleSave(agent.slug)}
                        disabled={savingSlug === agent.slug}
                      >
                        {savingSlug === agent.slug ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        Save
                      </Button>
                    </div>
                    {successSlug === agent.slug && (
                      <p className="text-sm text-green-600 dark:text-green-400">
                        Saved successfully.
                      </p>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
