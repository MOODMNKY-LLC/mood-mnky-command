"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import Image from "next/image";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { FileUIPart, ToolUIPart, DynamicToolUIPart } from "ai";
import {
  Conversation,
  ConversationContent,
  ConversationDownload,
  ConversationEmptyState,
  ConversationScrollButton,
  type ConversationMessage,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
  MessageAction,
  MessageActions,
} from "@/components/ai-elements/message";
import {
  PromptInputProvider,
  PromptInputHeader,
  PromptInput,
  PromptInputTextarea,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionAddAttachments,
  PromptInputSubmit,
  PromptInputBody,
  PromptInputButton,
  PromptInputHoverCard,
  PromptInputHoverCardContent,
  PromptInputHoverCardTrigger,
  usePromptInputAttachments,
  usePromptInputController,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import {
  Attachments,
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
} from "@/components/ai-elements/attachments";
import { SpeechInput } from "@/components/ai-elements/speech-input";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
  ReasoningText,
} from "@/components/ai-elements/reasoning";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { Shimmer } from "@/components/ai-elements/shimmer";
import {
  Agent,
  AgentContent,
  AgentHeader,
  AgentInstructions,
} from "@/components/ai-elements/agent";
import { FlowisePlan, FlowisePreview } from "@/components/flowise-mnky";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { filePartsToFlowiseUploads } from "@/lib/flowise-uploads";
import { useMounted } from "@/lib/use-mounted";
import { cn } from "@/lib/utils";
import { CopyIcon, FilesIcon, MessageSquare, PlusIcon } from "lucide-react";

/** Max file size for inline uploads (10MB). Larger files would need backend upload + URL. */
const DOJO_CHAT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const DOJO_MNKY_AVATAR = "/verse/mood-mnky-3d.png";
const DOJO_OPENAI_MODEL = "gpt-5-mini";
const STARTER_PROMPTS = [
  "Cozy fall blend ideas",
  "Citrus + woody combinations",
  "What blends well with vanilla?",
];

const CHAT_SUGGESTIONS = [
  "Explain this in simple terms",
  "Summarize the main points",
  "What blends well with vanilla?",
  "Cozy fall blend ideas",
];

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sourceDocuments?: unknown[];
  usedTools?: unknown[];
  /** Preview URL from tools or previewUrl stream event (WebPreview). */
  previewUrl?: string;
  /** Plan steps from tools or plan stream event (FlowisePlan). */
  planSteps?: Array<{ title: string; description?: string; content?: string }>;
}

/** Extract first previewable URL from usedTools output. */
function extractPreviewUrl(usedTools: unknown[] | undefined): string | null {
  if (!Array.isArray(usedTools)) return null;
  const urlLike = /^https?:\/\/[^\s]+$/i;
  for (const t of usedTools) {
    if (typeof t === "object" && t !== null) {
      const obj = t as Record<string, unknown>;
      if (typeof obj.output === "string" && urlLike.test(obj.output.trim())) return obj.output.trim();
      if (typeof obj.url === "string" && urlLike.test(obj.url.trim())) return obj.url.trim();
      if (typeof obj.result === "string" && urlLike.test(obj.result.trim())) return obj.result.trim();
    }
  }
  return null;
}

function normalizePlanStep(s: unknown): { title: string; description?: string; content?: string } | null {
  if (typeof s !== "object" || s === null) return null;
  const step = s as Record<string, unknown>;
  const title = typeof step.title === "string" ? step.title : typeof step.name === "string" ? step.name : String(step.step ?? step ?? "");
  if (!title?.trim()) return null;
  return {
    title: title.trim(),
    description: typeof step.description === "string" ? step.description : undefined,
    content: typeof step.content === "string" ? step.content : undefined,
  };
}

/** Extract plan steps from usedTools output (Flowise agent plan tools). */
function extractPlanSteps(usedTools: unknown[] | undefined): Array<{ title: string; description?: string; content?: string }> | null {
  if (!Array.isArray(usedTools)) return null;
  for (const t of usedTools) {
    if (typeof t !== "object" || t === null) continue;
    const obj = t as Record<string, unknown>;
    const raw = obj.output ?? obj.plan ?? obj.steps ?? obj.result;
    if (raw === undefined) continue;
    let steps: unknown[];
    if (Array.isArray(raw)) {
      steps = raw;
    } else if (typeof raw === "object" && raw !== null && "steps" in raw) {
      steps = Array.isArray((raw as { steps: unknown }).steps) ? (raw as { steps: unknown[] }).steps : [];
    } else if (typeof raw === "object" && raw !== null && (typeof (raw as Record<string, unknown>).title === "string" || typeof (raw as Record<string, unknown>).name === "string")) {
      steps = [raw];
    } else if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw) as unknown;
        steps = Array.isArray(parsed) ? parsed : Array.isArray((parsed as { steps?: unknown[] })?.steps) ? (parsed as { steps: unknown[] }).steps : [];
      } catch {
        continue;
      }
    } else {
      continue;
    }
    const result = steps.map(normalizePlanStep).filter((s): s is { title: string; description?: string; content?: string } => s !== null);
    if (result.length > 0) return result;
  }
  return null;
}

const embedConfigFetcher = async (url: string) => {
  try {
    const r = await fetch(url, { credentials: "same-origin" });
    if (!r.ok) return {};
    const data = await r.json().catch(() => ({}));
    return typeof data === "object" && data !== null ? data : {};
  } catch {
    return {};
  }
};

function messagesToHistory(messages: ChatMessage[]): { message: string; type: "userMessage" | "apiMessage" }[] {
  return messages.map((m) => ({
    message: m.content,
    type: m.role === "user" ? "userMessage" : "apiMessage",
  }));
}

/** Extract assistant reply from Flowise non-streaming response (various shapes). */
function extractReplyText(body: Record<string, unknown>): string {
  if (typeof body.text === "string" && body.text.trim()) return body.text;
  if (typeof body.data === "string" && body.data.trim()) return body.data;
  if (body.message && typeof (body.message as Record<string, unknown>).text === "string") {
    const t = (body.message as Record<string, unknown>).text as string;
    if (t.trim()) return t;
  }
  if (typeof body.result === "string" && body.result.trim()) return body.result;
  if (typeof body.answer === "string" && body.answer.trim()) return body.answer;
  if (typeof body.output === "string" && body.output.trim()) return body.output;
  if (typeof body.response === "string" && body.response.trim()) return body.response;
  return "";
}

/** Extract streaming token text from Flowise payload.data (string or object with text/content/chunk). */
function tokenDataToText(data: string | unknown): string {
  if (typeof data === "string") return data;
  if (data != null && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (typeof o.text === "string") return o.text;
    if (typeof o.content === "string") return o.content;
    if (typeof o.chunk === "string") return o.chunk;
  }
  return "";
}

function isToolPart(part: { type: string }): part is ToolUIPart | DynamicToolUIPart {
  return part.type.startsWith("tool-") || part.type === "dynamic-tool";
}

function messagePartsToContent(parts: Array<{ type: string; text?: string; [k: string]: unknown }>): string {
  return parts
    .map((p) => {
      if (p.type === "text" && typeof p.text === "string") return p.text;
      if (p.type === "reasoning" && typeof p.text === "string") return `[Reasoning]\n${p.text}`;
      if (isToolPart(p)) {
        const name =
          p.type === "dynamic-tool"
            ? (p as DynamicToolUIPart).toolName ?? "tool"
            : (p as ToolUIPart).type.replace(/^tool-/, "");
        return `[Tool: ${name}]`;
      }
      return "";
    })
    .filter(Boolean)
    .join("\n\n");
}

function DojoAttachmentsDisplay() {
  const attachments = usePromptInputAttachments();
  const handleRemove = useCallback((id: string) => attachments.remove(id), [attachments]);
  if (attachments.files.length === 0) return null;
  return (
    <Attachments variant="inline" className="flex flex-wrap gap-1">
      {attachments.files.map((attachment) => (
        <Attachment key={attachment.id} data={attachment} onRemove={handleRemove}>
          <AttachmentPreview />
          <AttachmentRemove />
        </Attachment>
      ))}
    </Attachments>
  );
}

function DojoAttachmentTrigger() {
  const attachments = usePromptInputAttachments();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-9 shrink-0 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
      onClick={() => attachments.openFileDialog()}
      aria-label="Add attachments"
    >
      <PlusIcon className="size-5" />
    </Button>
  );
}

function DojoSpeechInput({
  isStreaming = false,
  onListeningChange,
}: {
  isStreaming?: boolean;
  onListeningChange?: (listening: boolean) => void;
}) {
  const controller = usePromptInputController();
  const valueRef = useRef(controller.textInput.value);
  valueRef.current = controller.textInput.value;
  return (
    <SpeechInput
      disabled={isStreaming}
      onTranscriptionChange={(t) => {
        const prev = valueRef.current ?? "";
        controller.textInput.setInput(prev ? `${prev} ${t}` : t);
      }}
      onAudioRecorded={async (blob) => {
        const fd = new FormData();
        fd.append("file", blob, "recording.webm");
        const res = await fetch("/api/audio/transcribe", { method: "POST", body: fd });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string })?.error ?? "Transcription failed");
        }
        const { transcript } = await res.json();
        return (transcript as { text?: string })?.text ?? "";
      }}
      onListeningChange={onListeningChange}
      className="size-9 shrink-0 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
    />
  );
}

export interface DojoFlowiseChatbotProps {
  chatflowId?: string;
  overrideConfig?: Record<string, unknown>;
  className?: string;
}

type AssignmentItem = {
  id: string;
  chatflow_id: string;
  display_name: string | null;
  override_config?: Record<string, unknown>;
};

export function DojoFlowiseChatbot({
  chatflowId: propChatflowId,
  overrideConfig: propOverrideConfig,
  className,
}: DojoFlowiseChatbotProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [provider, setProvider] = useState<"flowise" | "openai">("flowise");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  /** User-selected chatflow (from switcher). When set, overrides propChatflowId for this session. */
  const [selectedChatflowId, setSelectedChatflowId] = useState<string | undefined>(undefined);
  /** When stream ended with no tokens, allow one-time retry with streaming: false */
  const [noTokensRetryQuestion, setNoTokensRetryQuestion] = useState<string | null>(null);
  const conversationEndRef = useRef<HTMLDivElement>(null);

  const sessionId = useMemo(() => nanoid(), []);

  const openaiTransport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
      }),
    []
  );
  const {
    messages: openaiMessages,
    sendMessage: openaiSendMessage,
    status: openaiStatus,
    error: openaiError,
  } = useChat({
    transport: openaiTransport,
    body: { model: DOJO_OPENAI_MODEL, sessionId: sessionId ?? undefined },
  });

  const { data: config } = useSWR<{
    chatflowId?: string;
    chatflowConfig?: Record<string, unknown>;
  }>("/api/flowise/embed-config?scope=dojo", embedConfigFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });

  const resolvedPropChatflowId =
    propChatflowId ??
    config?.chatflowId ??
    (typeof process.env.NEXT_PUBLIC_FLOWISE_CHATFLOW_ID === "string"
      ? process.env.NEXT_PUBLIC_FLOWISE_CHATFLOW_ID
      : "");

  const { data: assignmentsData } = useSWR<{ assignments: AssignmentItem[] }>(
    provider === "flowise" ? "/api/flowise/assignments" : null,
    async (url) => {
      const r = await fetch(url, { credentials: "same-origin" });
      const json = await r.json();
      if (!r.ok) throw new Error((json as { error?: string }).error ?? "Failed to load");
      return json as { assignments: AssignmentItem[] };
    },
    { revalidateOnFocus: false }
  );
  const assignments = assignmentsData?.assignments ?? [];
  const hasMultipleAssignments = assignments.length > 1;

  type FlowiseChatflowListItem = { id: string; name?: string };
  const { data: chatflowsList } = useSWR<FlowiseChatflowListItem[]>(
    provider === "flowise" ? "/api/flowise/chatflows" : null,
    async (url) => {
      const r = await fetch(url, { credentials: "same-origin" });
      if (!r.ok) return [];
      const json = await r.json();
      return Array.isArray(json) ? json : [];
    },
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );
  const chatflows = chatflowsList ?? [];

  /** Effective chatflow: user selection > prop/config/env. */
  const chatflowId = (selectedChatflowId ?? resolvedPropChatflowId) || "";

  const setDefaultChatflowMutation = useCallback(async () => {
    if (!chatflowId || !assignments.some((a) => a.chatflow_id === chatflowId)) return;
    try {
      const res = await fetch("/api/me/default-chatflow", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ chatflowId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? "Failed to set default");
      }
      toast({ title: "Default chatflow updated", variant: "default" });
      router.refresh();
    } catch (e) {
      toast({
        title: "Could not set default",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  }, [chatflowId, assignments, toast, router]);

  const { data: flowisePing, mutate: mutateFlowisePing } = useSWR<{ ok?: boolean }>(
    chatflowId ? "/api/flowise/ping" : null,
    async (url) => {
      const r = await fetch(url, { credentials: "same-origin" });
      const data = await r.json().catch(() => ({}));
      return data as { ok?: boolean };
    },
    { revalidateOnFocus: false, dedupingInterval: 30_000 }
  );

  const flowiseAvailable = flowisePing === undefined ? true : flowisePing?.ok === true;

  useEffect(() => {
    if (chatflowId && flowisePing !== undefined && !flowisePing?.ok && provider === "flowise") {
      setProvider("openai");
      toast({
        title: "Flowise unavailable",
        description: "Using OpenAI fallback for chat.",
        variant: "default",
      });
    }
  }, [chatflowId, flowisePing, provider, toast]);

  const mergedOverrideConfig = useMemo(() => {
    const base = { sessionId, ...(config?.chatflowConfig ?? {}), ...(propOverrideConfig ?? {}) };
    return base;
  }, [sessionId, config?.chatflowConfig, propOverrideConfig]);

  const sendMessageFlowise = useCallback(
    async (
      text: string,
      uploads?: Array<{ data?: string; type: string; name: string; mime: string }>
    ) => {
      const trimmed = text?.trim();
      const hasUploads = Boolean(uploads?.length);
      if ((!trimmed && !hasUploads) || !chatflowId) return;

      const displayText = trimmed || "Sent with attachments";
      const userMsg: ChatMessage = { id: nanoid(), role: "user", content: displayText };
      const assistantPlaceholder: ChatMessage = { id: nanoid(), role: "assistant", content: "" };

      setMessages((prev) => [...prev, userMsg, assistantPlaceholder]);
      setIsLoading(true);
      setError(null);
      setNoTokensRetryQuestion(null);

      const history = messagesToHistory([...messages, userMsg]);

      try {
        const res = await fetch("/api/flowise/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            chatflowId,
            question: displayText,
            history,
            sessionId,
            overrideConfig: mergedOverrideConfig,
            streaming: true,
            ...(uploads && uploads.length > 0 ? { uploads } : {}),
          }),
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          const detail =
            (errBody as { error?: string; detail?: string })?.detail ?? (errBody as { error?: string })?.error;
          if (res.status === 401) {
            setError("Sign in to use MNKY CHAT");
          } else {
            setError(detail ?? `Request failed (${res.status})`);
          }
          setMessages((prev) => prev.slice(0, -1));
          setIsLoading(false);
          return;
        }

        const contentType = res.headers.get("content-type") ?? "";
        const isStream = contentType.includes("text/event-stream") && res.body;

        if (isStream && res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";
          let assistantContent = "";
          let sourceDocuments: unknown[] | undefined;
          let usedTools: unknown[] | undefined;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
              const trimmedLine = line.trim();
              if (!trimmedLine || !trimmedLine.startsWith("data:")) continue;
              try {
                const payload = JSON.parse(trimmedLine.slice(5).trim()) as {
                  event?: string;
                  data?: string | unknown;
                };
                const ev = payload.event;
                if (ev === "token") {
                  const tokenText = tokenDataToText(payload.data);
                  if (tokenText) {
                    assistantContent += tokenText;
                    setMessages((prev) => {
                      const next = [...prev];
                      const last = next[next.length - 1];
                      if (last?.role === "assistant") {
                        next[next.length - 1] = {
                          ...last,
                          content: assistantContent,
                          sourceDocuments,
                          usedTools,
                        };
                      }
                      return next;
                    });
                  }
                } else if (ev === "error") {
                  const errMsg =
                    typeof payload.data === "string"
                      ? payload.data
                      : payload.data != null && typeof payload.data === "object" && "message" in (payload.data as object)
                        ? String((payload.data as { message: unknown }).message)
                        : String(payload.data);
                  setError(errMsg);
                } else if (ev === "sourceDocuments") {
                  try {
                    sourceDocuments = typeof payload.data === "string" ? JSON.parse(payload.data) : payload.data;
                    if (!Array.isArray(sourceDocuments)) sourceDocuments = [sourceDocuments];
                  } catch {
                    sourceDocuments = payload.data != null ? [payload.data] : undefined;
                  }
                  setMessages((prev) => {
                    const next = [...prev];
                    const last = next[next.length - 1];
                    if (last?.role === "assistant") {
                      next[next.length - 1] = { ...last, sourceDocuments, usedTools };
                    }
                    return next;
                  });
                } else if (ev === "usedTools") {
                  try {
                    usedTools = typeof payload.data === "string" ? JSON.parse(payload.data) : payload.data;
                    if (!Array.isArray(usedTools)) usedTools = usedTools != null ? [usedTools] : undefined;
                  } catch {
                    usedTools = payload.data != null ? [payload.data] : undefined;
                  }
                  const previewUrl = extractPreviewUrl(usedTools);
                  const planSteps = extractPlanSteps(usedTools);
                  setMessages((prev) => {
                    const next = [...prev];
                    const last = next[next.length - 1];
                    if (last?.role === "assistant") {
                      next[next.length - 1] = {
                        ...last,
                        usedTools,
                        ...(previewUrl ? { previewUrl } : {}),
                        ...(planSteps ? { planSteps } : {}),
                      };
                    }
                    return next;
                  });
                } else if (ev === "plan") {
                  try {
                    const planData = typeof payload.data === "string" ? JSON.parse(payload.data) : payload.data;
                    const rawSteps = Array.isArray(planData)
                      ? planData
                      : typeof planData === "object" && planData !== null && "steps" in planData
                        ? (planData as { steps: unknown[] }).steps
                        : typeof planData === "object" && planData !== null
                          ? [planData]
                          : [];
                    const steps = extractPlanSteps(
                      Array.isArray(rawSteps) ? rawSteps.map((s) => ({ output: s })) : []
                    );
                    if (steps && steps.length > 0) {
                      setMessages((prev) => {
                        const next = [...prev];
                        const last = next[next.length - 1];
                        if (last?.role === "assistant") {
                          next[next.length - 1] = { ...last, planSteps: steps };
                        }
                        return next;
                      });
                    }
                  } catch {
                    // skip malformed plan
                  }
                } else if (ev === "previewUrl" && typeof payload.data === "string") {
                  const previewUrl = payload.data.trim();
                  if (/^https?:\/\//i.test(previewUrl)) {
                    setMessages((prev) => {
                      const next = [...prev];
                      const last = next[next.length - 1];
                      if (last?.role === "assistant") {
                        next[next.length - 1] = { ...last, previewUrl };
                      }
                      return next;
                    });
                  }
                } else if (ev === "metadata" && payload.data != null && typeof payload.data === "object") {
                  const meta = payload.data as Record<string, unknown>;
                  const text =
                    typeof meta.text === "string"
                      ? meta.text
                      : typeof meta.response === "string"
                        ? meta.response
                        : typeof meta.content === "string"
                          ? meta.content
                          : typeof meta.message === "string"
                            ? meta.message
                            : "";
                  if (text.trim()) {
                    assistantContent += text.trim();
                    setMessages((prev) => {
                      const next = [...prev];
                      const last = next[next.length - 1];
                      if (last?.role === "assistant") {
                        next[next.length - 1] = { ...last, content: assistantContent, sourceDocuments, usedTools };
                      }
                      return next;
                    });
                  }
                } else if (ev === "end" && typeof payload.data === "string") {
                  const endData = payload.data.trim();
                  if (endData && endData !== "[DONE]") {
                    assistantContent += endData;
                    setMessages((prev) => {
                      const next = [...prev];
                      const last = next[next.length - 1];
                      if (last?.role === "assistant") {
                        next[next.length - 1] = { ...last, content: assistantContent, sourceDocuments, usedTools };
                      }
                      return next;
                    });
                  }
                }
              } catch {
                // skip malformed line
              }
            }
          }
          // Stream ended with no tokens (e.g. agent flows that don't stream): fetch full reply via non-streaming and show it
          if (!assistantContent.trim() && displayText?.trim()) {
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.role === "assistant") {
                next[next.length - 1] = {
                  ...last,
                  content: "Getting response…",
                  sourceDocuments,
                  usedTools,
                };
              }
              return next;
            });
            setNoTokensRetryQuestion(displayText);
            setTimeout(() => conversationEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
            try {
              const history = messagesToHistory(messages.slice(0, -2));
              const res = await fetch("/api/flowise/predict", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify({
                  chatflowId,
                  question: displayText.trim(),
                  history,
                  sessionId,
                  overrideConfig: mergedOverrideConfig,
                  streaming: false,
                }),
              });
              if (res.ok) {
                const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
                const replyText = extractReplyText(data);
                if (replyText?.trim()) {
                  setMessages((prev) => {
                    const next = [...prev];
                    const last = next[next.length - 1];
                    if (last?.role === "assistant") {
                      next[next.length - 1] = { ...last, content: replyText.trim(), sourceDocuments, usedTools };
                    }
                    return next;
                  });
                  setNoTokensRetryQuestion(null);
                } else {
                  setMessages((prev) => {
                    const next = [...prev];
                    const last = next[next.length - 1];
                    if (last?.role === "assistant") {
                      next[next.length - 1] = {
                        ...last,
                        content: usedTools?.length ? "Response completed (tools used)." : sourceDocuments?.length ? "Response completed (sources retrieved)." : "No text in response.",
                        sourceDocuments,
                        usedTools,
                      };
                    }
                    return next;
                  });
                }
              }
            } catch {
              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.role === "assistant") {
                  next[next.length - 1] = {
                    ...last,
                    content: "Response failed. Try “Get response (non-streaming)” below.",
                    sourceDocuments,
                    usedTools,
                  };
                }
                return next;
              });
            }
          }
        } else {
          const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
          const replyText = extractReplyText(data);
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === "assistant") {
              next[next.length - 1] = { ...last, content: replyText };
            }
            return next;
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Request failed";
        setError(message);
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setIsLoading(false);
      }
    },
    [chatflowId, messages, mergedOverrideConfig]
  );

  const handleNoTokensRetry = useCallback(async () => {
    const question = noTokensRetryQuestion;
    if (!question?.trim() || !chatflowId) return;
    setNoTokensRetryQuestion(null);
    setIsLoading(true);
    setError(null);
    try {
      const history = messagesToHistory(messages.slice(0, -2));
      const res = await fetch("/api/flowise/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          chatflowId,
          question: question.trim(),
          history,
          sessionId,
          overrideConfig: mergedOverrideConfig,
          streaming: false,
        }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        const detail = (errBody as { error?: string; detail?: string })?.detail ?? (errBody as { error?: string })?.error;
        setError(detail ?? "Retry failed");
        return;
      }
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      const replyText = extractReplyText(data);
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role === "assistant") {
          next[next.length - 1] = { ...last, content: replyText || last.content };
        }
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setIsLoading(false);
    }
  }, [noTokensRetryQuestion, chatflowId, messages, sessionId, mergedOverrideConfig]);

  const handleSubmit = useCallback(
    (message: PromptInputMessage, _event: FormEvent<HTMLFormElement>) => {
      const hasText = Boolean(message.text?.trim());
      const hasAttachments = Boolean(message.files?.length);
      if (!hasText && !hasAttachments) return;

      const text = message.text?.trim() || (hasAttachments ? "Sent with attachments" : "");

      if (provider === "flowise") {
        const uploads = message.files?.length
          ? filePartsToFlowiseUploads(message.files)
          : undefined;
        sendMessageFlowise(text, uploads);
      } else {
        openaiSendMessage({
          text,
          ...(message.files?.length ? { files: message.files } : {}),
        });
      }
    },
    [provider, sendMessageFlowise, openaiSendMessage]
  );

  const handleSuggestionClick = useCallback(
    (text: string) => {
      if (provider === "flowise") {
        sendMessageFlowise(text.trim());
      } else {
        openaiSendMessage({ text: text.trim() });
      }
    },
    [provider, sendMessageFlowise, openaiSendMessage]
  );

  const handleInputError = useCallback(
    (err: { code: "max_files" | "max_file_size" | "accept"; message: string }) => {
      toast({
        title: "Upload error",
        description: err.message,
        variant: "destructive",
      });
    },
    [toast]
  );

  const displayMessages = provider === "flowise" ? messages : openaiMessages;
  const isStreaming = provider === "flowise" ? isLoading : openaiStatus === "streaming";
  const displayError = provider === "flowise" ? error : openaiError?.message ?? null;

  const downloadMessages: ConversationMessage[] = useMemo(() => {
    if (provider === "flowise") {
      return messages.map((m) => ({ role: m.role as ConversationMessage["role"], content: m.content }));
    }
    return openaiMessages.map((m) => ({
      role: m.role as ConversationMessage["role"],
      content: messagePartsToContent(m.parts ?? []),
    }));
  }, [provider, messages, openaiMessages]);

  const noConfig = provider === "flowise" && !chatflowId;
  const isUnauth = displayError === "Sign in to use MNKY CHAT";
  const mounted = useMounted();

  const currentAssignment = useMemo(
    () => assignments.find((a) => a.chatflow_id === chatflowId),
    [assignments, chatflowId]
  );

  const { data: chatflowDetails } = useSWR<{ name?: string; nodes?: unknown[] }>(
    provider === "flowise" && chatflowId ? `/api/flowise/chatflows/${chatflowId}` : null,
    async (url) => {
      const r = await fetch(url, { credentials: "same-origin" });
      if (!r.ok) return undefined;
      return r.json();
    },
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );

  const chatflowDisplayName = useMemo(() => {
    const name =
      currentAssignment?.display_name?.trim() ||
      chatflows.find((c) => c.id === chatflowId)?.name ||
      chatflowDetails?.name ||
      chatflowId ||
      "MNKY CHAT";
    return name;
  }, [currentAssignment?.display_name, chatflows, chatflowId, chatflowDetails?.name]);

  return (
    <div
      className={cn(
        "flex h-full min-h-[400px] flex-col rounded-lg border border-border/50 bg-background/95 text-foreground backdrop-blur-sm dark:bg-background/90",
        className
      )}
    >
      <header className="flex shrink-0 items-center gap-3 border-b border-border/50 px-4 py-3">
        <div className="relative size-10 shrink-0 overflow-hidden rounded-full bg-muted">
          <Image
            src={DOJO_MNKY_AVATAR}
            alt={chatflowDisplayName}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center">
          <h2 className="flex items-center gap-2 font-semibold text-foreground">
            {provider === "flowise" && chatflowId ? (
              <>
                <span className="truncate">{chatflowDisplayName}</span>
                {flowiseAvailable && (
                  <span
                    className="size-2 shrink-0 rounded-full bg-green-500"
                    title="Chatflow active"
                    aria-hidden
                  />
                )}
              </>
            ) : (
              "MNKY CHAT"
            )}
          </h2>
          <p className="text-muted-foreground text-xs">
            {provider === "flowise" && chatflowId
              ? "Ask about fragrance blending"
              : "Ask about fragrance blending"}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {provider === "flowise" && hasMultipleAssignments && (
            <Select
              value={chatflowId || "__none__"}
              onValueChange={(v) => {
                const id = v === "__none__" ? undefined : v;
                setSelectedChatflowId(id);
                if (typeof window !== "undefined" && window.history?.replaceState) {
                  const u = new URL(window.location.href);
                  if (id) u.searchParams.set("chatflowId", id);
                  else u.searchParams.delete("chatflowId");
                  window.history.replaceState({}, "", u.pathname + u.search);
                }
              }}
            >
              <SelectTrigger className="h-8 w-[180px] text-xs">
                <SelectValue placeholder="Chatflow" />
              </SelectTrigger>
              <SelectContent>
                {assignments.map((a) => (
                  <SelectItem key={a.id} value={a.chatflow_id}>
                    {a.display_name?.trim() ||
                      chatflows.find((c) => c.id === a.chatflow_id)?.name ||
                      a.chatflow_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {provider === "flowise" && chatflowId && assignments.some((a) => a.chatflow_id === chatflowId) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground"
              onClick={() => setDefaultChatflowMutation()}
            >
              Set as default
            </Button>
          )}
          {!flowiseAvailable && provider === "openai" ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground"
              onClick={() => {
                void mutateFlowisePing();
                setProvider("flowise");
              }}
            >
              Retry Flowise
            </Button>
          ) : null}
          {mounted ? (
            <Tabs
              value={provider}
              onValueChange={(v) => setProvider(v as "flowise" | "openai")}
              className="shrink-0"
            >
              <TabsList className="h-8">
                <TabsTrigger value="flowise" className="text-xs" disabled={!flowiseAvailable}>
                  Flowise
                </TabsTrigger>
                <TabsTrigger value="openai" className="text-xs">
                  {flowiseAvailable ? "Fallback" : "OpenAI"}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          ) : (
            <div className="inline-flex h-8 items-center justify-center rounded-md bg-muted px-3 text-xs text-muted-foreground">
              {provider === "flowise" ? "Flowise" : flowiseAvailable ? "Fallback" : "OpenAI"}
            </div>
          )}
        </div>
      </header>

      {provider === "flowise" && chatflowId && currentAssignment && (
        <div className="shrink-0 overflow-hidden border-b border-border/30 bg-muted/30 px-2 py-1.5">
          <div className="flex w-max animate-marquee gap-8 whitespace-nowrap text-xs text-muted-foreground">
            <span>{chatflowDisplayName}</span>
            <span>•</span>
            <span>
              {currentAssignment.override_config?.returnSourceDocuments ? "Sources on" : "Sources off"}
            </span>
            <span>•</span>
            <span>{typeof currentAssignment.override_config?.systemMessage === "string" ? "Custom prompt" : "Default prompt"}</span>
            <span>{chatflowDisplayName}</span>
            <span>•</span>
            <span>
              {currentAssignment.override_config?.returnSourceDocuments ? "Sources on" : "Sources off"}
            </span>
            <span>•</span>
            <span>{typeof currentAssignment.override_config?.systemMessage === "string" ? "Custom prompt" : "Default prompt"}</span>
          </div>
        </div>
      )}

      {noConfig ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground text-sm">
          <p>Chat not configured. Set embed config or NEXT_PUBLIC_FLOWISE_CHATFLOW_ID.</p>
        </div>
      ) : isUnauth ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-muted-foreground text-sm">{displayError}</p>
          <Button asChild variant="default" size="sm">
            <Link href="/auth/login">Sign in</Link>
          </Button>
        </div>
      ) : (
        <>
          {provider === "openai" && !flowiseAvailable ? (
            <div className="shrink-0 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-amber-800 text-xs dark:text-amber-200 dark:bg-amber-500/20">
              Using OpenAI fallback — Flowise is unavailable.
            </div>
          ) : null}
          <Conversation className="relative flex-1 overflow-y-auto">
            {downloadMessages.length > 0 && (
              <ConversationDownload
                messages={downloadMessages}
                filename="mnky-chat-conversation.md"
                className="absolute top-4 right-4 z-10 rounded-full border border-border/60 bg-background/80 backdrop-blur-md dark:border-white/10 dark:bg-background/70"
              />
            )}
            <ConversationContent className="flex flex-col gap-6 p-4">
              {provider === "flowise" ? (
                messages.length === 0 ? (
                  <div className="flex flex-col gap-6 p-4">
                    {chatflowId && currentAssignment ? (
                      <Shimmer className="rounded-lg border border-border/60">
                        <Agent className="rounded-lg border-0 bg-transparent shadow-none">
                          <AgentHeader
                            name={chatflowDisplayName}
                            model={
                              chatflowDisplayName !== chatflowId
                                ? chatflowDisplayName
                                : chatflowId.length > 24
                                  ? `${chatflowId.slice(0, 24)}…`
                                  : chatflowId
                            }
                          />
                          <AgentContent>
                            <AgentInstructions label="About this agent">
                              {typeof currentAssignment?.override_config?.systemMessage === "string"
                                ? String(currentAssignment.override_config.systemMessage).slice(0, 300) +
                                  (String(currentAssignment.override_config.systemMessage).length > 300 ? "…" : "")
                                : chatflowDetails?.name
                                  ? `${chatflowDetails.name} is ready. Ask about fragrance blending—suggest oils, proportions, and blend ideas.`
                                  : "Ask about fragrance blending—suggest oils, proportions, and blend ideas."}
                            </AgentInstructions>
                          </AgentContent>
                        </Agent>
                      </Shimmer>
                    ) : null}
                    <ConversationEmptyState
                      title={chatflowDisplayName}
                      description="Ask about fragrance blending—suggest oils, proportions, and blend ideas."
                      icon={<MessageSquare className="size-12 text-muted-foreground" />}
                    >
                      <div className="mt-4 flex flex-wrap justify-center gap-2">
                        {STARTER_PROMPTS.map((prompt) => (
                          <Button
                            key={prompt}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => sendMessageFlowise(prompt)}
                          >
                            {prompt}
                          </Button>
                        ))}
                      </div>
                    </ConversationEmptyState>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => (
                      <Message key={msg.id} from={msg.role}>
                        <MessageContent>
                          {msg.role === "assistant" && (
                            <MessageActions className="mb-1">
                              <MessageAction
                                tooltip="Copy"
                                label="Copy"
                                onClick={() => void navigator.clipboard.writeText(msg.content)}
                              >
                                <CopyIcon className="size-3.5" />
                              </MessageAction>
                            </MessageActions>
                          )}
                          {/* Future TTS: if Flowise/backend returns audio (e.g. base64 in stream), render with AudioPlayer + AudioPlayerElement from @/components/ai-elements/audio-player */}
                          {msg.role === "assistant" && msg.content ? (
                            <MessageResponse parseIncompleteMarkdown>{msg.content}</MessageResponse>
                          ) : msg.role === "user" ? (
                            <MessageResponse>{msg.content}</MessageResponse>
                          ) : null}
                          {msg.role === "assistant" && msg.sourceDocuments && msg.sourceDocuments.length > 0 && (
                            <div className="mt-2 rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-muted-foreground text-xs">
                              <span className="font-medium">Sources</span>
                              <ul className="mt-1 list-disc pl-4">
                                {msg.sourceDocuments.slice(0, 5).map((doc, i) => (
                                  <li key={i}>
                                    {typeof doc === "object" && doc !== null && "metadata" in (doc as object)
                                      ? String((doc as { metadata?: { source?: string } }).metadata?.source ?? "Source")
                                      : String(doc)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {msg.role === "assistant" && msg.usedTools && msg.usedTools.length > 0 && (
                            <div className="mt-2 rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-muted-foreground text-xs">
                              <span className="font-medium">Tools used</span>
                              <ul className="mt-1 list-disc pl-4">
                                {msg.usedTools.slice(0, 5).map((t, i) => (
                                  <li key={i}>
                                    {typeof t === "object" && t !== null
                                      ? "name" in (t as object)
                                        ? String((t as { name?: string }).name ?? "Tool")
                                        : "Tool"
                                      : String(t)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {msg.role === "assistant" && !msg.content && isLoading ? (
                            <span className="flex items-center gap-2 text-muted-foreground text-sm">
                              <Spinner className="size-4" />
                              <span>Thinking…</span>
                            </span>
                          ) : null}
                          {msg.role === "assistant" && msg.previewUrl ? (
                            <div className="mt-3 rounded-lg border border-border/60 overflow-hidden">
                              <FlowisePreview url={msg.previewUrl} className="h-[280px]" />
                            </div>
                          ) : null}
                          {msg.role === "assistant" && msg.planSteps && msg.planSteps.length > 0 ? (
                            <div className="mt-3">
                              <FlowisePlan
                                steps={msg.planSteps}
                                isStreaming={isLoading && messages[messages.length - 1]?.id === msg.id}
                              />
                            </div>
                          ) : null}
                          {msg.role === "assistant" &&
                            messages[messages.length - 1]?.id === msg.id &&
                            noTokensRetryQuestion &&
                            !isLoading && (
                              <div className="mt-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="text-xs"
                                  onClick={() => handleNoTokensRetry()}
                                >
                                  Get response (non-streaming)
                                </Button>
                              </div>
                            )}
                        </MessageContent>
                      </Message>
                    ))}
                  {messages.length > 0 && <div ref={conversationEndRef} />}
                  </>
                )
              ) : openaiMessages.length === 0 ? (
                <ConversationEmptyState
                  title="MNKY CHAT"
                  description="Ask about fragrance blending—suggest oils, proportions, and blend ideas."
                  icon={<MessageSquare className="size-12 text-muted-foreground" />}
                >
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {STARTER_PROMPTS.map((prompt) => (
                      <Button
                        key={prompt}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => openaiSendMessage({ text: prompt })}
                      >
                        {prompt}
                      </Button>
                    ))}
                  </div>
                </ConversationEmptyState>
              ) : (
                <>
                  {openaiMessages.map((message, msgIndex) => (
                    <Message key={message.id} from={message.role}>
                      <MessageContent>
                        {message.role === "assistant" && (
                          <MessageActions className="mb-1">
                            <MessageAction
                              tooltip="Copy"
                              label="Copy"
                              onClick={() => {
                                const textParts = (message.parts ?? []).filter(
                                  (p): p is { type: "text"; text: string } => p.type === "text"
                                ).map((p) => p.text);
                                if (textParts.length)
                                  void navigator.clipboard.writeText(textParts.join(""));
                              }}
                            >
                              <CopyIcon className="size-3.5" />
                            </MessageAction>
                          </MessageActions>
                        )}
                        {(message.parts ?? []).map((part, i) => {
                          if (part.type === "reasoning") {
                            const reasoningPart = part as { type: "reasoning"; text: string; state?: string };
                            if (!reasoningPart.text?.trim()) return null;
                            return (
                              <Reasoning key={`${message.id}-${i}`} className="border-border/60">
                                <ReasoningTrigger label="View reasoning" />
                                <ReasoningContent>
                                  <ReasoningText text={reasoningPart.text} />
                                </ReasoningContent>
                              </Reasoning>
                            );
                          }
                          if (isToolPart(part)) {
                            const toolPart = part as ToolUIPart | DynamicToolUIPart;
                            const toolName =
                              toolPart.type === "dynamic-tool"
                                ? (toolPart as DynamicToolUIPart).toolName ?? "tool"
                                : toolPart.type.replace(/^tool-/, "");
                            return (
                              <Tool key={`${message.id}-${i}`} className="border-border/60">
                                <ToolHeader
                                  type={toolPart.type as ToolUIPart["type"]}
                                  state={toolPart.state}
                                  {...(toolPart.type === "dynamic-tool" ? { toolName } : {})}
                                />
                                <ToolContent>
                                  {"input" in toolPart && toolPart.input != null && (
                                    <ToolInput input={toolPart.input} />
                                  )}
                                  {("output" in toolPart &&
                                    (toolPart.output != null ||
                                      (toolPart as DynamicToolUIPart).errorText != null)) && (
                                    <ToolOutput
                                      output={(toolPart as DynamicToolUIPart).output}
                                      errorText={(toolPart as DynamicToolUIPart).errorText}
                                    />
                                  )}
                                </ToolContent>
                              </Tool>
                            );
                          }
                          if (part.type === "text") {
                            return (
                              <MessageResponse
                                key={`${message.id}-${i}`}
                                parseIncompleteMarkdown
                              >
                                {(part as { type: "text"; text: string }).text}
                              </MessageResponse>
                            );
                          }
                          return null;
                        })}
                        {message.role === "assistant" &&
                          (!message.parts?.length || message.parts.every((p) => p.type !== "text")) &&
                          isStreaming && (
                            <span className="flex items-center gap-2 text-muted-foreground text-sm">
                              <Spinner className="size-4" />
                              <span>Thinking…</span>
                            </span>
                          )}
                      </MessageContent>
                    </Message>
                  ))}
                  {isStreaming &&
                    openaiMessages.length > 0 &&
                    openaiMessages[openaiMessages.length - 1].role === "user" && (
                      <div className="flex items-center gap-2 py-2 text-muted-foreground">
                        <Shimmer className="text-sm" duration={1.5}>
                          Thinking…
                        </Shimmer>
                      </div>
                    )}
                </>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          {displayError && !isUnauth ? (
            <div className="shrink-0 px-4 py-2 text-destructive text-sm">{displayError}</div>
          ) : null}

          <div className="shrink-0 px-4 pb-3 pt-2">
            <PromptInputProvider>
              <PromptInput
                accept="image/*,.pdf,.txt,.md,audio/*,video/*"
                maxFileSize={DOJO_CHAT_MAX_FILE_SIZE_BYTES}
                onError={handleInputError}
                onSubmit={handleSubmit}
                className="w-full max-w-3xl mx-auto"
                multiple
                globalDrop
                maxFiles={10}
              >
                <PromptInputHeader className="flex-wrap gap-2">
                  <div className="flex flex-wrap gap-2">
                    {CHAT_SUGGESTIONS.map((suggestion) => (
                      <Button
                        key={suggestion}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full text-xs font-normal"
                        onClick={() => handleSuggestionClick(suggestion)}
                        disabled={isStreaming}
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                  <PromptInputHoverCard>
                    <PromptInputHoverCardTrigger>
                      <PromptInputButton
                        size="sm"
                        variant="outline"
                        className="h-8"
                        tooltip="Context & rules"
                      >
                        <FilesIcon className="text-muted-foreground size-3.5" />
                        <span className="text-muted-foreground text-xs">Context</span>
                      </PromptInputButton>
                    </PromptInputHoverCardTrigger>
                    <PromptInputHoverCardContent className="w-72 p-3 text-muted-foreground text-sm">
                      <p className="font-medium text-foreground">Project context</p>
                      <p className="mt-1">Attach rules or knowledge sources here (coming soon).</p>
                    </PromptInputHoverCardContent>
                  </PromptInputHoverCard>
                  <DojoAttachmentsDisplay />
                </PromptInputHeader>
                <PromptInputBody>
                  <div className="flex w-full flex-col gap-1">
                    {isListening && (
                      <p className="text-muted-foreground text-center text-xs">Listening…</p>
                    )}
                    <div className="flex w-full items-end gap-1 rounded-2xl border border-border/80 bg-muted/40 pl-2 pr-1.5 py-1.5 shadow-lg transition-[box-shadow,background-color,border-color] focus-within:bg-muted/60 focus-within:border-primary/40 focus-within:shadow-xl dark:bg-muted/30 dark:focus-within:bg-muted/50">
                      <PromptInputActionMenu>
                        <PromptInputActionMenuTrigger
                          tooltip="Add photos or files"
                          className="size-8 shrink-0 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                        />
                        <PromptInputActionMenuContent>
                          <PromptInputActionAddAttachments label="Add photos or files" />
                        </PromptInputActionMenuContent>
                      </PromptInputActionMenu>
                      <PromptInputTextarea
                        name="message"
                        placeholder="Ask anything…"
                        className="min-h-[44px] max-h-[200px] flex-1 resize-none border-0 bg-transparent px-1 py-2 text-base shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
                        disabled={isStreaming}
                      />
                      <DojoSpeechInput
                        isStreaming={isStreaming}
                        onListeningChange={setIsListening}
                        className="size-8 shrink-0 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                      />
                      {mounted ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex shrink-0">
                              <PromptInputSubmit
                                status={isStreaming ? "streaming" : "ready"}
                                disabled={isStreaming}
                                className="size-8 shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-opacity disabled:opacity-70"
                              />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top">Send</TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="inline-flex shrink-0">
                          <PromptInputSubmit
                            status={isStreaming ? "streaming" : "ready"}
                            disabled={isStreaming}
                            className="size-8 shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-opacity disabled:opacity-70"
                          />
                        </span>
                      )}
                    </div>
                    <p className="text-center text-muted-foreground text-xs pt-1">
                      MNKY CHAT can make mistakes. Check important info.
                    </p>
                  </div>
                </PromptInputBody>
              </PromptInput>
            </PromptInputProvider>
          </div>
        </>
      )}
    </div>
  );
}
