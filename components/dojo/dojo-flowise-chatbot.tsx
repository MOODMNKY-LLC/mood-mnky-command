"use client";

import type { FormEvent } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import useSWR from "swr";
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
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputHeader,
  PromptInputBody,
  PromptInputFooter,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionAddAttachments,
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
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { CopyIcon, MessageSquare } from "lucide-react";

const DOJO_MNKY_AVATAR = "/verse/mood-mnky-3d.png";
const DOJO_OPENAI_MODEL = "gpt-5-mini";
const STARTER_PROMPTS = [
  "Cozy fall blend ideas",
  "Citrus + woody combinations",
  "What blends well with vanilla?",
];

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sourceDocuments?: unknown[];
  usedTools?: unknown[];
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

function extractReplyText(body: Record<string, unknown>): string {
  if (typeof body.text === "string") return body.text;
  if (typeof body.data === "string") return body.data;
  if (body.message && typeof (body.message as Record<string, unknown>).text === "string") {
    return (body.message as Record<string, unknown>).text as string;
  }
  if (typeof body.result === "string") return body.result;
  return JSON.stringify(body);
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

type FlowiseUpload = { data?: string; type: string; name: string; mime: string };

function filePartsToFlowiseUploads(files: FileUIPart[]): FlowiseUpload[] {
  return files.map((part) => {
    const url = part.url ?? "";
    const data = url.startsWith("data:") ? url : undefined;
    return {
      data,
      type: "file",
      name: part.filename ?? "file",
      mime: part.mediaType ?? "application/octet-stream",
    };
  });
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

function DojoSpeechInput() {
  const controller = usePromptInputController();
  const valueRef = useRef(controller.textInput.value);
  valueRef.current = controller.textInput.value;
  return (
    <SpeechInput
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
      className="shrink-0"
    />
  );
}

export interface DojoFlowiseChatbotProps {
  chatflowId?: string;
  overrideConfig?: Record<string, unknown>;
  className?: string;
}

export function DojoFlowiseChatbot({
  chatflowId: propChatflowId,
  overrideConfig: propOverrideConfig,
  className,
}: DojoFlowiseChatbotProps) {
  const [provider, setProvider] = useState<"flowise" | "openai">("flowise");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const chatflowId =
    propChatflowId ??
    config?.chatflowId ??
    (typeof process.env.NEXT_PUBLIC_FLOWISE_CHATFLOW_ID === "string"
      ? process.env.NEXT_PUBLIC_FLOWISE_CHATFLOW_ID
      : "");

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
                if (ev === "token" && typeof payload.data === "string") {
                  assistantContent += payload.data;
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
                } else if (ev === "error" && typeof payload.data === "string") {
                  setError(payload.data);
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
                  setMessages((prev) => {
                    const next = [...prev];
                    const last = next[next.length - 1];
                    if (last?.role === "assistant") {
                      next[next.length - 1] = { ...last, usedTools };
                    }
                    return next;
                  });
                }
              } catch {
                // skip malformed line
              }
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
            alt="MNKY CHAT"
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-foreground">MNKY CHAT</h2>
          <p className="text-muted-foreground text-xs">Ask about fragrance blending</p>
        </div>
        <Tabs
          value={provider}
          onValueChange={(v) => setProvider(v as "flowise" | "openai")}
          className="shrink-0"
        >
          <TabsList className="h-8">
            <TabsTrigger value="flowise" className="text-xs">
              Flowise
            </TabsTrigger>
            <TabsTrigger value="openai" className="text-xs">
              OpenAI
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

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
                          onClick={() => sendMessageFlowise(prompt)}
                        >
                          {prompt}
                        </Button>
                      ))}
                    </div>
                  </ConversationEmptyState>
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
                                    {typeof t === "object" && t !== null && "name" in (t as object)
                                      ? String((t as { name?: string }).name ?? "Tool")
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
                        </MessageContent>
                      </Message>
                    ))}
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

          <div className="shrink-0 border-t border-border/50 p-3">
            <PromptInputProvider>
              <PromptInput
                onSubmit={handleSubmit}
                className="w-full"
                multiple
                globalDrop
                maxFiles={10}
              >
                <PromptInputHeader>
                  <DojoAttachmentsDisplay />
                </PromptInputHeader>
                <PromptInputBody className="flex gap-2 rounded-lg border border-input bg-background px-3 py-2">
                  <PromptInputTextarea
                    name="message"
                    placeholder="Ask about fragrance blending..."
                    className="min-h-[44px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
                    disabled={isStreaming}
                  />
                </PromptInputBody>
                <PromptInputFooter className="flex items-center justify-between gap-1 pt-2">
                  <DojoSpeechInput />
                  <PromptInputActionMenu>
                    <PromptInputActionMenuTrigger />
                    <PromptInputActionMenuContent>
                      <PromptInputActionAddAttachments label="Add photos or files" />
                    </PromptInputActionMenuContent>
                  </PromptInputActionMenu>
                  <PromptInputSubmit
                    status={isStreaming ? "streaming" : "ready"}
                    disabled={isStreaming}
                    className="shrink-0"
                  />
                </PromptInputFooter>
              </PromptInput>
            </PromptInputProvider>
          </div>
        </>
      )}
    </div>
  );
}
