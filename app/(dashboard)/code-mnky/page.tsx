"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Agent,
  AgentContent,
  AgentHeader,
  AgentInstructions,
  AgentTool,
  AgentTools,
} from "@/components/ai-elements/agent";
import { LABZ_SYSTEM_PROMPT } from "@/lib/chat/labz-system-prompt";
import { labzTools } from "@/lib/chat/labz-tools";
import type { Tool } from "ai";
import type { LabzConfig } from "@/lib/chat/labz-config";
import { ChevronDown } from "lucide-react";

const MODELS_FALLBACK: { id: string; displayName: string }[] = [
  { id: "gpt-5", displayName: "GPT-5" },
  { id: "gpt-5-mini", displayName: "GPT-5 Mini" },
  { id: "gpt-4o", displayName: "GPT-4o" },
  { id: "gpt-4o-mini", displayName: "GPT-4o Mini" },
  { id: "gpt-4o-nano", displayName: "GPT-4o Nano" },
];

function firstParagraph(text: string): string {
  const end = text.indexOf("\n\n");
  return end === -1 ? text : text.slice(0, end);
}

const ROADMAP_ITEMS: { id: string; title: string; body: string; status: string }[] = [
  {
    id: "labz",
    title: "MNKY LABZ",
    body: "Dashboard, Formulas, Fragrance Oils, Glossary, Blending Lab, Wicks & Wax, Product Builder, LABZ Pages. Tools already exist for formulas, oils, glossary, labz_pages, and open_labz_section. Deeper Product Builder integration is planned.",
    status: "Integrated (tools); Product Builder: Planned",
  },
  {
    id: "integrations",
    title: "Integrations",
    body: "Notion Sync is already used (notion_sync_status, oils from Notion). Planned extensions may add more sync or status tools.",
    status: "Integrated; extensions Planned",
  },
  {
    id: "create-chat",
    title: "Create & Chat",
    body: "AI Chat, Agents, Studios, Media. Planned: use CODE MNKY from the main chat page; voice/TTS and deeper studio integration are future.",
    status: "Planned",
  },
  {
    id: "verse",
    title: "Verse",
    body: "Storefront. Planned or read-only: e.g. LABZ pages summary for storefront context.",
    status: "Planned / read-only",
  },
  {
    id: "store",
    title: "Store",
    body: "Catalog, Sales, Growth, Content, LABZ Pages, Finance. LABZ Pages is already integrated; other areas are planned.",
    status: "LABZ Pages Integrated; others Planned",
  },
  {
    id: "platform",
    title: "Platform",
    body: "Overview, Funnels, Table Editor, SQL Editor, Storefront Assistant, Members. All planned or future.",
    status: "Future",
  },
];

export default function CodeMnkyPage() {
  const [config, setConfig] = useState<LabzConfig | null>(null);
  const [models, setModels] = useState<{ id: string; displayName?: string }[]>(MODELS_FALLBACK);
  const [instructionsDraft, setInstructionsDraft] = useState<string>("");
  const [instructionsSaving, setInstructionsSaving] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [modelSaveError, setModelSaveError] = useState<string | null>(null);

  const loadConfig = useCallback(() => {
    setConfigLoading(true);
    fetch("/api/labz/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: LabzConfig | null) => {
        if (data) {
          setConfig(data);
          setInstructionsDraft(data.system_prompt_override ?? LABZ_SYSTEM_PROMPT);
        }
      })
      .catch(() => {})
      .finally(() => setConfigLoading(false));
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    fetch("/api/labz/models")
      .then((r) => r.json())
      .then((data: { models?: { id: string; displayName?: string }[] }) => {
        if (data.models?.length) setModels(data.models);
      })
      .catch(() => {});
  }, []);

  const defaultModel = config?.default_model ?? "gpt-4o-mini";
  const currentInstructions = config?.system_prompt_override ?? LABZ_SYSTEM_PROMPT;

  const handleDefaultModelChange = (value: string) => {
    setModelSaveError(null);
    fetch("/api/labz/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ default_model: value }),
    })
      .then(async (r) => {
        const data = await r.json().catch(() => null) as LabzConfig | { error?: string } | null;
        if (r.ok && data && "default_model" in data) {
          setConfig(data as LabzConfig);
        } else if (!r.ok && data && typeof (data as { error?: string }).error === "string") {
          setModelSaveError((data as { error: string }).error);
        } else if (!r.ok) {
          setModelSaveError("Failed to save default model");
        }
      })
      .catch(() => setModelSaveError("Failed to save default model"));
  };

  const handleSaveInstructions = () => {
    setInstructionsSaving(true);
    const value = instructionsDraft.trim() || null;
    fetch("/api/labz/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_prompt_override: value === LABZ_SYSTEM_PROMPT ? null : value,
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: LabzConfig | null) => {
        if (data) {
          setConfig(data);
          setInstructionsDraft(data.system_prompt_override ?? LABZ_SYSTEM_PROMPT);
        }
      })
      .catch(() => {})
      .finally(() => setInstructionsSaving(false));
  };

  const handleResetInstructions = () => {
    setInstructionsDraft(LABZ_SYSTEM_PROMPT);
  };

  const toolList = Object.values(labzTools) as Tool[];

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">CODE MNKY</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Configure the model, system instructions, tools, and integrations for the CODE MNKY
          assistant that appears in the LABZ dock. This is the programmable backend for the MNKY
          LABZ virtual assistant.
        </p>
      </div>

      <Tabs defaultValue="model" className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="model">Model</TabsTrigger>
          <TabsTrigger value="instructions">Instructions</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
        </TabsList>

        <TabsContent value="model" className="mt-4">
          <p className="text-sm text-muted-foreground mb-3">
            Default chat model and the list of models available in the chat selector. The dock chat
            sends the selected model in the request body; the API allows only models in the server
            allowlist.
          </p>
          <Card className="bg-background/75 backdrop-blur border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Default model</CardTitle>
              <CardDescription>
                Saved to the database; used when the user does not pick a model in the chat.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select
                value={configLoading ? "" : defaultModel}
                onValueChange={handleDefaultModelChange}
                disabled={configLoading}
              >
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue placeholder="Select default model" />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.displayName ?? m.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {modelSaveError && (
                <p className="text-sm text-destructive">{modelSaveError}</p>
              )}
              <p className="text-xs text-muted-foreground">Available models (from API):</p>
              <ScrollArea className="h-[200px] w-full rounded-md border border-border p-2">
                <ul className="text-sm text-muted-foreground space-y-0.5">
                  {models.map((m) => (
                    <li key={m.id}>
                      <code className="text-xs bg-muted px-1 rounded">{m.id}</code>
                      {m.displayName && m.displayName !== m.id && ` — ${m.displayName}`}
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="instructions" className="mt-4">
          <p className="text-sm text-muted-foreground mb-3">
            The system prompt that defines CODE MNKY&apos;s role, style, and constraints. Edit below
            and save; reset restores the built-in default.
          </p>
          <Card className="bg-background/75 backdrop-blur border-border">
            <CardContent className="pt-6 space-y-3">
              <ScrollArea className="max-h-[40vh] w-full rounded-md border border-border">
                <textarea
                  className="min-h-[200px] w-full resize-y rounded-md bg-muted/30 p-4 text-sm font-mono whitespace-pre-wrap border-0 focus:ring-2 focus:ring-ring"
                  value={instructionsDraft}
                  onChange={(e) => setInstructionsDraft(e.target.value)}
                  placeholder={LABZ_SYSTEM_PROMPT}
                  spellCheck={false}
                />
              </ScrollArea>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveInstructions}
                  disabled={instructionsSaving || instructionsDraft === currentInstructions}
                >
                  {instructionsSaving ? "Saving…" : "Save"}
                </Button>
                <Button size="sm" variant="outline" onClick={handleResetInstructions}>
                  Reset to default
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="mt-4">
          <p className="text-sm text-muted-foreground mb-3">
            These tools are called automatically when the user asks about formulas, oils, glossary,
            sync status, LABZ pages, or navigation.
          </p>
          <ScrollArea className="max-h-[50vh] w-full">
            <Agent className="border-border bg-card">
              <AgentHeader name="CODE MNKY" model={defaultModel} />
              <AgentContent>
                <AgentInstructions>{firstParagraph(currentInstructions)}</AgentInstructions>
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Tools</h4>
                  <AgentTools>
                    {toolList.map((tool, i) => (
                      <AgentTool key={i} tool={tool} />
                    ))}
                  </AgentTools>
                </div>
              </AgentContent>
            </Agent>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="integrations" className="mt-4">
          <p className="text-sm text-muted-foreground mb-3">
            Status of Notion, Supabase, and Shopify as data sources for CODE MNKY.
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="bg-background/75 backdrop-blur border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Notion</CardTitle>
                <CardDescription>
                  Used for fragrance oils sync and database IDs. Sync status is available via the
                  notion_sync_status tool.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-background/75 backdrop-blur border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Supabase</CardTitle>
                <CardDescription>
                  Formulas, fragrance_oils, and fragrance_notes. The assistant queries these for
                  list_formulas, list_fragrance_oils, and search_glossary.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="bg-background/75 backdrop-blur border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Shopify</CardTitle>
                <CardDescription>
                  LABZ pages and store content. get_labz_pages_summary and LABZ page management use
                  Shopify.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="roadmap" className="mt-4">
          <p className="text-sm text-muted-foreground mb-3">
            How CODE MNKY will be built out and integrated across the app, by sidebar area.
          </p>
          <div className="space-y-2">
            {ROADMAP_ITEMS.map((item) => (
              <Collapsible key={item.id} defaultOpen={false}>
                <Card className="bg-background/75 backdrop-blur border-border">
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors rounded-t-md">
                      <span className="font-medium text-foreground">{item.title}</span>
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground data-[state=open]:rotate-180 transition-transform" />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 pb-4 px-4">
                      <p className="text-sm text-muted-foreground">{item.body}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Status: <strong>{item.status}</strong>
                      </p>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
