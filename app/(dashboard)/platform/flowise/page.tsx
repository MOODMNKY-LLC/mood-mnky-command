"use client";

import { useCallback, useEffect, useState } from "react";
import useSWR from "swr";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FlowiseHowToCards } from "@/components/flowise/flowise-how-to-cards";
import { MoreHorizontal, Plus } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ChatflowItem {
  id: string;
  name: string;
  type?: string;
  flowData?: string;
  deployed?: boolean;
  isPublic?: boolean;
  createdDate?: string;
  updatedDate?: string;
}

interface VariableItem {
  id: string;
  name: string;
  value?: string | null;
  type?: string;
  createdDate?: string;
  updatedDate?: string;
}

interface ToolItem {
  id: string;
  name: string;
  description?: string;
  color?: string;
  iconSrc?: string | null;
  schema?: string | null;
  func?: string | null;
  createdDate?: string;
  updatedDate?: string;
}

const FLOWISE_INSTANCE_URL = "https://flowise-dev.moodmnky.com";

function truncate(str: string, len: number) {
  if (!str) return "";
  return str.length <= len ? str : str.slice(0, len) + "…";
}

export default function FlowisePage() {
  const [pingOk, setPingOk] = useState<boolean | null>(null);
  const [testFlowId, setTestFlowId] = useState<string | null>(null);
  const [testQuestion, setTestQuestion] = useState("");
  const [testHistory, setTestHistory] = useState("");
  const [testOverrideConfig, setTestOverrideConfig] = useState("");
  const [testStreaming, setTestStreaming] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [chatflowForm, setChatflowForm] = useState<{
    open: boolean;
    id: string | null;
    name: string;
    type: string;
    deployed: boolean;
    isPublic: boolean;
    flowData: string;
  }>({
    open: false,
    id: null,
    name: "",
    type: "CHATFLOW",
    deployed: false,
    isPublic: false,
    flowData: "",
  });
  const [variableForm, setVariableForm] = useState<{
    open: boolean;
    id: string | null;
    name: string;
    value: string;
    type: string;
  }>({ open: false, id: null, name: "", value: "", type: "string" });
  const [toolForm, setToolForm] = useState<{
    open: boolean;
    id: string | null;
    name: string;
    description: string;
    color: string;
    schema: string;
    func: string;
    iconSrc: string;
  }>({
    open: false,
    id: null,
    name: "",
    description: "",
    color: "",
    schema: "",
    func: "",
    iconSrc: "",
  });
  const [viewChatflow, setViewChatflow] = useState<ChatflowItem | null>(null);
  const [viewTool, setViewTool] = useState<ToolItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "chatflow" | "variable" | "tool";
    id: string;
    name: string;
  } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [embedForm, setEmbedForm] = useState<{
    scope: string;
    chatflowId: string;
    apiHost: string;
    themeJson: string;
    chatflowConfigJson: string;
    customCSS: string;
  }>({
    scope: "dojo",
    chatflowId: "",
    apiHost: "",
    themeJson: "{}",
    chatflowConfigJson: "{}",
    customCSS: "",
  });
  const [embedSaveLoading, setEmbedSaveLoading] = useState(false);
  const [embedSaveError, setEmbedSaveError] = useState<string | null>(null);

  const { data: pingData } = useSWR<{ ok?: boolean }>("/api/flowise/ping", fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  });
  useEffect(() => {
    setPingOk(pingData?.ok ?? null);
  }, [pingData]);

  const { data: chatflowsData, error: chatflowsError, isLoading: chatflowsLoading, mutate: mutateChatflows } = useSWR<
    ChatflowItem[] | { error?: string }
  >("/api/flowise/chatflows", fetcher, { revalidateOnFocus: false });
  const { data: variablesData, error: variablesError, isLoading: variablesLoading, mutate: mutateVariables } = useSWR<
    VariableItem[] | { error?: string }
  >("/api/flowise/variables", fetcher, { revalidateOnFocus: false });
  const { data: toolsData, error: toolsError, isLoading: toolsLoading, mutate: mutateTools } = useSWR<
    ToolItem[] | { error?: string }
  >("/api/flowise/tools", fetcher, { revalidateOnFocus: false });

  const { data: embedConfigData } = useSWR<{
    chatflowId?: string;
    apiHost?: string;
    theme?: Record<string, unknown>;
    chatflowConfig?: Record<string, unknown>;
  }>("/api/flowise/embed-config?scope=dojo", fetcher, { revalidateOnFocus: false });

  useEffect(() => {
    if (embedConfigData) {
      const theme = embedConfigData.theme ?? {};
      const customCSS =
        typeof theme.customCSS === "string" ? theme.customCSS : "";
      const themeWithoutCSS = { ...theme };
      delete themeWithoutCSS.customCSS;
      setEmbedForm((prev) => ({
        ...prev,
        chatflowId: embedConfigData.chatflowId ?? process.env.NEXT_PUBLIC_FLOWISE_CHATFLOW_ID ?? "",
        apiHost: embedConfigData.apiHost ?? process.env.NEXT_PUBLIC_FLOWISE_HOST ?? "",
        themeJson:
          Object.keys(themeWithoutCSS).length > 0
            ? JSON.stringify(themeWithoutCSS, null, 2)
            : "{}",
        chatflowConfigJson:
          Object.keys(embedConfigData.chatflowConfig ?? {}).length > 0
            ? JSON.stringify(embedConfigData.chatflowConfig, null, 2)
            : "{}",
        customCSS,
      }));
    }
  }, [embedConfigData]);

  const chatflowsList = Array.isArray(chatflowsData) ? chatflowsData : [];
  const variablesList = Array.isArray(variablesData) ? variablesData : [];
  const toolsList = Array.isArray(toolsData) ? toolsData : [];
  const chatflowsHasError = Boolean(chatflowsError || (chatflowsData && !Array.isArray(chatflowsData)));
  const variablesHasError = Boolean(variablesError || (variablesData && !Array.isArray(variablesData)));
  const toolsHasError = Boolean(toolsError || (toolsData && !Array.isArray(toolsData)));

  const runTest = useCallback(() => {
    if (!testFlowId || !testQuestion.trim()) return;
    setTestLoading(true);
    setTestResult(null);
    const body: Record<string, unknown> = {
      chatflowId: testFlowId,
      question: testQuestion.trim(),
      streaming: testStreaming,
    };
    try {
      const historyStr = testHistory.trim();
      if (historyStr) body.history = JSON.parse(historyStr) as unknown;
    } catch {
      setTestResult("Invalid JSON in history");
      setTestLoading(false);
      return;
    }
    try {
      const overrideStr = testOverrideConfig.trim();
      if (overrideStr) body.overrideConfig = JSON.parse(overrideStr) as unknown;
    } catch {
      setTestResult("Invalid JSON in override config");
      setTestLoading(false);
      return;
    }
    fetch("/api/flowise/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(async (r) => {
        if (testStreaming && r.body) {
          const reader = r.body.getReader();
          const decoder = new TextDecoder();
          let acc = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            acc += decoder.decode(value, { stream: true });
          }
          setTestResult(acc || "(no data)");
        } else {
          const data = await r.json().catch(() => ({}));
          setTestResult(typeof data === "string" ? data : JSON.stringify(data, null, 2));
        }
      })
      .catch((e) => setTestResult(`Error: ${e.message}`))
      .finally(() => setTestLoading(false));
  }, [testFlowId, testQuestion, testHistory, testOverrideConfig, testStreaming]);

  const openChatflowCreate = () => {
    setChatflowForm({
      open: true,
      id: null,
      name: "",
      type: "CHATFLOW",
      deployed: false,
      isPublic: false,
      flowData: "",
    });
    setSaveError(null);
  };
  const openChatflowEdit = async (f: ChatflowItem) => {
    setChatflowForm({
      open: true,
      id: f.id,
      name: f.name ?? "",
      type: f.type ?? "CHATFLOW",
      deployed: f.deployed ?? false,
      isPublic: f.isPublic ?? false,
      flowData: "",
    });
    setSaveError(null);
    try {
      const res = await fetch(`/api/flowise/chatflows/${f.id}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok && data && typeof (data as { flowData?: string }).flowData === "string") {
        setChatflowForm((prev) => ({ ...prev, flowData: (data as { flowData: string }).flowData }));
      } else if (res.ok && data && (data as { flowData?: unknown }).flowData) {
        setChatflowForm((prev) => ({
          ...prev,
          flowData: JSON.stringify((data as { flowData: unknown }).flowData, null, 2),
        }));
      }
    } catch {
      // keep form open with empty flowData
    }
  };
  const saveChatflow = async () => {
    setSaveError(null);
    const payload: Record<string, unknown> = {
      name: chatflowForm.name.trim() || "Unnamed",
      type: chatflowForm.type,
      deployed: chatflowForm.deployed,
      isPublic: chatflowForm.isPublic,
    };
    if (chatflowForm.flowData.trim()) {
      try {
        payload.flowData = JSON.stringify(JSON.parse(chatflowForm.flowData));
      } catch {
        setSaveError("flowData must be valid JSON");
        return;
      }
    }
    const url = chatflowForm.id
      ? `/api/flowise/chatflows/${chatflowForm.id}`
      : "/api/flowise/chatflows";
    const method = chatflowForm.id ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chatflowForm.id ? { ...payload, id: chatflowForm.id } : payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setSaveError((data as { error?: string }).error ?? "Failed to save");
      return;
    }
    setChatflowForm((prev) => ({ ...prev, open: false }));
    mutateChatflows();
  };

  const openVariableCreate = () => {
    setVariableForm({ open: true, id: null, name: "", value: "", type: "string" });
    setSaveError(null);
  };
  const openVariableEdit = (v: VariableItem) => {
    setVariableForm({
      open: true,
      id: v.id,
      name: v.name ?? "",
      value: v.value ?? "",
      type: v.type ?? "string",
    });
    setSaveError(null);
  };
  const saveVariable = async () => {
    setSaveError(null);
    const payload = {
      name: variableForm.name.trim(),
      value: variableForm.value,
      type: variableForm.type,
      ...(variableForm.id ? { id: variableForm.id } : {}),
    };
    const url = variableForm.id
      ? `/api/flowise/variables/${variableForm.id}`
      : "/api/flowise/variables";
    const method = variableForm.id ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setSaveError((data as { error?: string }).error ?? "Failed to save");
      return;
    }
    setVariableForm((prev) => ({ ...prev, open: false }));
    mutateVariables();
  };

  const openToolCreate = () => {
    setToolForm({
      open: true,
      id: null,
      name: "",
      description: "",
      color: "",
      schema: "",
      func: "",
      iconSrc: "",
    });
    setSaveError(null);
  };
  const openToolEdit = (t: ToolItem) => {
    setToolForm({
      open: true,
      id: t.id,
      name: t.name ?? "",
      description: t.description ?? "",
      color: t.color ?? "",
      schema: t.schema ?? "",
      func: t.func ?? "",
      iconSrc: t.iconSrc ?? "",
    });
    setSaveError(null);
  };
  const saveTool = async () => {
    setSaveError(null);
    const payload: Record<string, unknown> = {
      name: toolForm.name.trim(),
      description: toolForm.description,
      color: toolForm.color || undefined,
      schema: toolForm.schema.trim() || undefined,
      func: toolForm.func.trim() || undefined,
      iconSrc: toolForm.iconSrc.trim() || undefined,
      ...(toolForm.id ? { id: toolForm.id } : {}),
    };
    const url = toolForm.id ? `/api/flowise/tools/${toolForm.id}` : "/api/flowise/tools";
    const method = toolForm.id ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setSaveError((data as { error?: string }).error ?? "Failed to save");
      return;
    }
    setToolForm((prev) => ({ ...prev, open: false }));
    mutateTools();
  };

  const saveEmbedConfig = async () => {
    setEmbedSaveError(null);
    setEmbedSaveLoading(true);
    try {
      let theme: Record<string, unknown> = {};
      try {
        theme = JSON.parse(embedForm.themeJson);
      } catch {
        setEmbedSaveError("Theme must be valid JSON");
        setEmbedSaveLoading(false);
        return;
      }
      let chatflowConfig: Record<string, unknown> = {};
      try {
        chatflowConfig = JSON.parse(embedForm.chatflowConfigJson);
      } catch {
        setEmbedSaveError("Chatflow config must be valid JSON");
        setEmbedSaveLoading(false);
        return;
      }
      if (embedForm.customCSS.trim()) {
        theme.customCSS = embedForm.customCSS.trim();
      }
      const res = await fetch("/api/flowise/embed-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: embedForm.scope,
          chatflowId: embedForm.chatflowId.trim(),
          apiHost: embedForm.apiHost.trim(),
          theme,
          chatflowConfig,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEmbedSaveError((data as { error?: string }).error ?? "Failed to save");
        return;
      }
    } finally {
      setEmbedSaveLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { type, id } = deleteTarget;
    const path = type === "chatflow" ? "chatflows" : type === "variable" ? "variables" : "tools";
    const res = await fetch(`/api/flowise/${path}/${id}`, { method: "DELETE" });
    if (res.ok) {
      if (type === "chatflow") mutateChatflows();
      else if (type === "variable") mutateVariables();
      else mutateTools();
    }
    setDeleteTarget(null);
  };

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Flowise</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Orchestration runtime at {FLOWISE_INSTANCE_URL}. All requests are proxied through the
            backend; the app never calls Flowise from the browser.
          </p>
        </div>
        {pingOk !== null && (
          <Badge variant={pingOk ? "default" : "destructive"} className="shrink-0">
            {pingOk ? "Live" : "Offline"}
          </Badge>
        )}
      </div>

      {(chatflowsHasError || variablesHasError || toolsHasError) && (
        <Alert variant="destructive">
          <AlertDescription>
            {chatflowsHasError &&
              (typeof (chatflowsData as { error?: string })?.error === "string"
                ? (chatflowsData as { error: string }).error
                : "Failed to load chatflows.")}
            {variablesHasError &&
              (typeof (variablesData as { error?: string })?.error === "string"
                ? (variablesData as { error: string }).error
                : " Failed to load variables.")}
            {toolsHasError &&
              (typeof (toolsData as { error?: string })?.error === "string"
                ? (toolsData as { error: string }).error
                : " Failed to load tools.")}
            {!chatflowsHasError && !variablesHasError && !toolsHasError && "Check FLOWISE_API_KEY and instance URL."}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="chatflows" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="chatflows">Chatflows</TabsTrigger>
          <TabsTrigger value="variables">Variables</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="embed">Embed Config</TabsTrigger>
          <TabsTrigger value="test">Test Run</TabsTrigger>
          <TabsTrigger value="howto">How to</TabsTrigger>
        </TabsList>

        <TabsContent value="chatflows" className="mt-4">
          <Card className="bg-background/75 backdrop-blur border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-base">Chatflows</CardTitle>
                <CardDescription>Create, edit, and run flows on the instance.</CardDescription>
              </div>
              <Button size="sm" onClick={openChatflowCreate}>
                <Plus className="h-4 w-4 mr-1" />
                Create
              </Button>
            </CardHeader>
            <CardContent>
              {chatflowsLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : chatflowsList.length === 0 && !chatflowsHasError ? (
                <p className="text-sm text-muted-foreground">No chatflows. Create one or check instance access.</p>
              ) : (
                <ScrollArea className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {chatflowsList.map((flow) => (
                        <TableRow key={flow.id}>
                          <TableCell className="font-medium">{flow.name || flow.id}</TableCell>
                          <TableCell className="font-mono text-xs">{truncate(flow.id, 12)}</TableCell>
                          <TableCell>
                            {flow.type && (
                              <Badge variant="secondary" className="text-xs">
                                {flow.type}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {flow.deployed != null && (
                              <Badge variant={flow.deployed ? "default" : "outline"}>
                                {flow.deployed ? "Deployed" : "Draft"}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setViewChatflow(flow)}>
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openChatflowEdit(flow)}>
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setTestFlowId(flow.id);
                                    setTestQuestion("");
                                    setTestResult(null);
                                  }}
                                >
                                  Test
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setDeleteTarget({ type: "chatflow", id: flow.id, name: flow.name || flow.id })}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="variables" className="mt-4">
          <Card className="bg-background/75 backdrop-blur border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-base">Variables</CardTitle>
                <CardDescription>Instance-level variables for flows.</CardDescription>
              </div>
              <Button size="sm" onClick={openVariableCreate}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </CardHeader>
            <CardContent>
              {variablesLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : variablesList.length === 0 && !variablesHasError ? (
                <p className="text-sm text-muted-foreground">No variables.</p>
              ) : (
                <ScrollArea className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {variablesList.map((v) => (
                        <TableRow key={v.id}>
                          <TableCell className="font-medium">{v.name}</TableCell>
                          <TableCell className="font-mono text-xs max-w-[200px] truncate">
                            {v.value != null ? truncate(String(v.value), 40) : "—"}
                          </TableCell>
                          <TableCell>{v.type ?? "—"}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openVariableEdit(v)}>Edit</DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setDeleteTarget({ type: "variable", id: v.id, name: v.name })}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="mt-4">
          <Card className="bg-background/75 backdrop-blur border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-base">Tools</CardTitle>
                <CardDescription>Custom tools available to flows.</CardDescription>
              </div>
              <Button size="sm" onClick={openToolCreate}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </CardHeader>
            <CardContent>
              {toolsLoading ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : toolsList.length === 0 && !toolsHasError ? (
                <p className="text-sm text-muted-foreground">No tools.</p>
              ) : (
                <ScrollArea className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {toolsList.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium">{t.name}</TableCell>
                          <TableCell className="max-w-[300px] truncate text-muted-foreground">
                            {truncate(t.description ?? "", 50)}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setViewTool(t)}>View</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openToolEdit(t)}>Edit</DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setDeleteTarget({ type: "tool", id: t.id, name: t.name })}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="embed" className="mt-4">
          <Card className="bg-background/75 backdrop-blur border-border">
            <CardHeader>
              <CardTitle className="text-base">Embed Config</CardTitle>
              <CardDescription>
                Configure the Flowise bubble embed (Dojo Blending Lab). Stored in Supabase; used by{" "}
                <code className="text-xs">DojoFlowiseBubble</code>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {embedSaveError && (
                <Alert variant="destructive">
                  <AlertDescription>{embedSaveError}</AlertDescription>
                </Alert>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="embed-scope">Scope</Label>
                  <Input
                    id="embed-scope"
                    value={embedForm.scope}
                    onChange={(e) =>
                      setEmbedForm((p) => ({ ...p, scope: e.target.value }))
                    }
                    placeholder="dojo"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="embed-chatflow">Chatflow ID</Label>
                  <Input
                    id="embed-chatflow"
                    value={embedForm.chatflowId}
                    onChange={(e) =>
                      setEmbedForm((p) => ({ ...p, chatflowId: e.target.value }))
                    }
                    placeholder="From Flowise UI or env"
                  />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="embed-api-host">API Host</Label>
                  <Input
                    id="embed-api-host"
                    value={embedForm.apiHost}
                    onChange={(e) =>
                      setEmbedForm((p) => ({ ...p, apiHost: e.target.value }))
                    }
                    placeholder="https://flowise-dev.moodmnky.com"
                  />
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="embed-theme">Theme (JSON)</Label>
                  <textarea
                    id="embed-theme"
                    className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                    placeholder='{ "button": { "backgroundColor": "..." }, "chatWindow": { ... } }'
                    value={embedForm.themeJson}
                    onChange={(e) =>
                      setEmbedForm((p) => ({ ...p, themeJson: e.target.value }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    FlowiseChatEmbed theme: button, chatWindow, customCSS, etc. See Flowise docs.
                  </p>
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="embed-chatflow-config">Chatflow Override Config (JSON)</Label>
                  <textarea
                    id="embed-chatflow-config"
                    className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                    placeholder='{ "topK": 4, "systemMessage": "..." }'
                    value={embedForm.chatflowConfigJson}
                    onChange={(e) =>
                      setEmbedForm((p) => ({
                        ...p,
                        chatflowConfigJson: e.target.value,
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    overrideConfig passed to Predict API: topK, systemMessage, vars, etc.
                  </p>
                </div>
                <div className="grid gap-2 sm:col-span-2">
                  <Label htmlFor="embed-custom-css">Custom CSS</Label>
                  <textarea
                    id="embed-custom-css"
                    className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                    placeholder=".dark flowise-chatbot { --flowise-primary: hsl(...); }"
                    value={embedForm.customCSS}
                    onChange={(e) =>
                      setEmbedForm((p) => ({ ...p, customCSS: e.target.value }))
                    }
                  />
                </div>
              </div>
              <Button
                onClick={saveEmbedConfig}
                disabled={
                  embedSaveLoading ||
                  !embedForm.chatflowId.trim() ||
                  !embedForm.apiHost.trim()
                }
              >
                {embedSaveLoading ? "Saving…" : "Save Embed Config"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="mt-4">
          <Card className="bg-background/75 backdrop-blur border-border">
            <CardHeader>
              <CardTitle className="text-base">Test Run</CardTitle>
              <CardDescription>
                Run a prediction against a chatflow. Optionally pass history and override config.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Chatflow</Label>
                <select
                  className="flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={testFlowId ?? ""}
                  onChange={(e) => setTestFlowId(e.target.value || null)}
                >
                  <option value="">Select a flow</option>
                  {chatflowsList.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name || f.id}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="test-question">Question</Label>
                <Input
                  id="test-question"
                  placeholder="Enter a message…"
                  value={testQuestion}
                  onChange={(e) => setTestQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && runTest()}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="test-history">History (JSON, optional)</Label>
                <textarea
                  id="test-history"
                  className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                  placeholder='[{"role":"userMessage","content":"..."}]'
                  value={testHistory}
                  onChange={(e) => setTestHistory(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="test-override">Override config (JSON, optional)</Label>
                <textarea
                  id="test-override"
                  className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                  placeholder="{}"
                  value={testOverrideConfig}
                  onChange={(e) => setTestOverrideConfig(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="test-streaming"
                  checked={testStreaming}
                  onChange={(e) => setTestStreaming(e.target.checked)}
                />
                <Label htmlFor="test-streaming">Streaming</Label>
              </div>
              <Button onClick={runTest} disabled={testLoading || !testFlowId || !testQuestion.trim()}>
                {testLoading ? "Running…" : "Run"}
              </Button>
              {testResult != null && (
                <ScrollArea className="max-h-[320px] w-full rounded-md border border-border bg-muted/30 p-3">
                  <pre className="text-xs font-mono whitespace-pre-wrap break-words">{testResult}</pre>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="howto" className="mt-4">
          <FlowiseHowToCards />
        </TabsContent>
      </Tabs>

      {/* Chatflow create/edit dialog */}
      <Dialog open={chatflowForm.open} onOpenChange={(o) => setChatflowForm((p) => ({ ...p, open: o }))}>
        <DialogContent className="bg-background/95 backdrop-blur border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{chatflowForm.id ? "Edit chatflow" : "Create chatflow"}</DialogTitle>
          </DialogHeader>
          {saveError && (
            <Alert variant="destructive">
              <AlertDescription>{saveError}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="cf-name">Name</Label>
              <Input
                id="cf-name"
                value={chatflowForm.name}
                onChange={(e) => setChatflowForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="My flow"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cf-type">Type</Label>
              <select
                id="cf-type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={chatflowForm.type}
                onChange={(e) => setChatflowForm((p) => ({ ...p, type: e.target.value }))}
              >
                <option value="CHATFLOW">CHATFLOW</option>
                <option value="MULTIAGENT">MULTIAGENT</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="cf-deployed"
                  checked={chatflowForm.deployed}
                  onChange={(e) => setChatflowForm((p) => ({ ...p, deployed: e.target.checked }))}
                />
                <Label htmlFor="cf-deployed">Deployed</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="cf-public"
                  checked={chatflowForm.isPublic}
                  onChange={(e) => setChatflowForm((p) => ({ ...p, isPublic: e.target.checked }))}
                />
                <Label htmlFor="cf-public">Public</Label>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cf-flowdata">Flow data (JSON, optional)</Label>
              <textarea
                id="cf-flowdata"
                className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                placeholder="Paste flowData from Flowise GUI or leave empty"
                value={chatflowForm.flowData}
                onChange={(e) => setChatflowForm((p) => ({ ...p, flowData: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChatflowForm((p) => ({ ...p, open: false }))}>
              Cancel
            </Button>
            <Button onClick={saveChatflow}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Variable create/edit dialog */}
      <Dialog open={variableForm.open} onOpenChange={(o) => setVariableForm((p) => ({ ...p, open: o }))}>
        <DialogContent className="bg-background/95 backdrop-blur border-border max-w-md">
          <DialogHeader>
            <DialogTitle>{variableForm.id ? "Edit variable" : "Add variable"}</DialogTitle>
          </DialogHeader>
          {saveError && (
            <Alert variant="destructive">
              <AlertDescription>{saveError}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="var-name">Name</Label>
              <Input
                id="var-name"
                value={variableForm.name}
                onChange={(e) => setVariableForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="VAR_NAME"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="var-value">Value</Label>
              <Input
                id="var-value"
                value={variableForm.value}
                onChange={(e) => setVariableForm((p) => ({ ...p, value: e.target.value }))}
                placeholder="value"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="var-type">Type</Label>
              <select
                id="var-type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={variableForm.type}
                onChange={(e) => setVariableForm((p) => ({ ...p, type: e.target.value }))}
              >
                <option value="string">string</option>
                <option value="number">number</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVariableForm((p) => ({ ...p, open: false }))}>
              Cancel
            </Button>
            <Button onClick={saveVariable}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tool create/edit dialog */}
      <Dialog open={toolForm.open} onOpenChange={(o) => setToolForm((p) => ({ ...p, open: o }))}>
        <DialogContent className="bg-background/95 backdrop-blur border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{toolForm.id ? "Edit tool" : "Add tool"}</DialogTitle>
          </DialogHeader>
          {saveError && (
            <Alert variant="destructive">
              <AlertDescription>{saveError}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="tool-name">Name</Label>
              <Input
                id="tool-name"
                value={toolForm.name}
                onChange={(e) => setToolForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="tool_name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tool-desc">Description</Label>
              <Input
                id="tool-desc"
                value={toolForm.description}
                onChange={(e) => setToolForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="What this tool does"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tool-color">Color</Label>
              <Input
                id="tool-color"
                value={toolForm.color}
                onChange={(e) => setToolForm((p) => ({ ...p, color: e.target.value }))}
                placeholder="#hex or name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tool-schema">Schema (JSON, optional)</Label>
              <textarea
                id="tool-schema"
                className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                value={toolForm.schema}
                onChange={(e) => setToolForm((p) => ({ ...p, schema: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tool-func">Function (optional)</Label>
              <textarea
                id="tool-func"
                className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                value={toolForm.func}
                onChange={(e) => setToolForm((p) => ({ ...p, func: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="tool-icon">Icon URL (optional)</Label>
              <Input
                id="tool-icon"
                value={toolForm.iconSrc}
                onChange={(e) => setToolForm((p) => ({ ...p, iconSrc: e.target.value }))}
                placeholder="https://…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToolForm((p) => ({ ...p, open: false }))}>
              Cancel
            </Button>
            <Button onClick={saveTool}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View chatflow dialog */}
      <Dialog open={!!viewChatflow} onOpenChange={(o) => !o && setViewChatflow(null)}>
        <DialogContent className="bg-background/95 backdrop-blur border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewChatflow?.name ?? viewChatflow?.id}</DialogTitle>
            <p className="text-sm text-muted-foreground font-mono">{viewChatflow?.id}</p>
          </DialogHeader>
          {viewChatflow && (
            <ScrollArea className="max-h-[60vh] rounded-md border border-border p-3">
              <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                {JSON.stringify(
                  {
                    type: viewChatflow.type,
                    deployed: viewChatflow.deployed,
                    isPublic: viewChatflow.isPublic,
                    createdDate: viewChatflow.createdDate,
                    updatedDate: viewChatflow.updatedDate,
                    flowData: viewChatflow.flowData
                      ? (() => {
                          try {
                            return JSON.parse(viewChatflow.flowData as string);
                          } catch {
                            return viewChatflow.flowData;
                          }
                        })()
                      : undefined,
                  },
                  null,
                  2,
                )}
              </pre>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* View tool dialog */}
      <Dialog open={!!viewTool} onOpenChange={(o) => !o && setViewTool(null)}>
        <DialogContent className="bg-background/95 backdrop-blur border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewTool?.name}</DialogTitle>
            <p className="text-sm text-muted-foreground font-mono">{viewTool?.id}</p>
          </DialogHeader>
          {viewTool && (
            <ScrollArea className="max-h-[60vh] rounded-md border border-border p-3">
              <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                {JSON.stringify(
                  {
                    description: viewTool.description,
                    color: viewTool.color,
                    schema: viewTool.schema,
                    func: viewTool.func,
                    iconSrc: viewTool.iconSrc,
                    createdDate: viewTool.createdDate,
                    updatedDate: viewTool.updatedDate,
                  },
                  null,
                  2,
                )}
              </pre>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.type}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.name}&quot;? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Test flow dialog (optional quick open from Chatflows tab) */}
      <Dialog
        open={!!testFlowId}
        onOpenChange={(o) => {
          if (!o) setTestFlowId(null);
        }}
      >
        <DialogContent className="bg-background/95 backdrop-blur border-border max-w-lg">
          <DialogHeader>
            <DialogTitle>Test flow</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="quick-test-question">Question</Label>
              <Input
                id="quick-test-question"
                placeholder="Enter a message…"
                value={testQuestion}
                onChange={(e) => setTestQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runTest()}
              />
            </div>
            <Button onClick={runTest} disabled={testLoading || !testQuestion.trim()}>
              {testLoading ? "Running…" : "Run"}
            </Button>
            {testResult != null && (
              <ScrollArea className="max-h-[240px] w-full rounded-md border border-border bg-muted/30 p-3">
                <pre className="text-xs font-mono whitespace-pre-wrap break-words">{testResult}</pre>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
