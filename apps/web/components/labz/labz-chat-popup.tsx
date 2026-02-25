"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import Image from "next/image";
import { CopyIcon } from "lucide-react";
import { useLabzPersonaState } from "@/components/labz/labz-persona-state-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  LabzConversation,
  LabzConversationContent,
  LabzConversationEmptyState,
  LabzConversationScrollButton,
} from "@/components/labz/labz-conversation";
import {
  LabzMessage,
  LabzMessageContent,
  LabzMessageResponse,
} from "@/components/labz/labz-message";
import {
  LabzPromptInputBody,
  LabzPromptInputSubmit,
  LabzPromptInputTextarea,
} from "@/components/labz/labz-prompt-input";
import { LabzVoiceInput } from "@/components/labz/labz-voice-input";
import {
  ConversationDownload,
  type ConversationMessage,
} from "@/components/ai-elements/conversation";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputProvider,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputActionAddAttachments,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input";
import {
  Attachments,
  Attachment,
  AttachmentPreview,
  AttachmentInfo,
  AttachmentRemove,
} from "@/components/ai-elements/attachments";
import {
  MessageAction,
  MessageActions,
} from "@/components/ai-elements/message";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
  ReasoningText,
} from "@/components/ai-elements/reasoning";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ToolUIPart, DynamicToolUIPart } from "ai";

const LABZ_API = "/api/labz/chat";
const LABZ_MODELS_ENDPOINT = "/api/labz/models";

/** Static fallback when GET /api/labz/models fails; includes five series. */
const LABZ_MODEL_OPTIONS_FALLBACK: { value: string; label: string }[] = [
  { value: "gpt-5", label: "GPT-5" },
  { value: "gpt-5-mini", label: "GPT-5 Mini" },
  { value: "gpt-5-nano", label: "GPT-5 Nano" },
  { value: "o3-mini", label: "o3 Mini" },
  { value: "o3", label: "o3" },
  { value: "o1", label: "o1" },
  { value: "o1-mini", label: "o1 Mini" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "gpt-4o-nano", label: "GPT-4o Nano" },
];

function LabzAttachmentsDisplay() {
  const attachments = usePromptInputAttachments();
  if (attachments.files.length === 0) return null;
  return (
    <Attachments variant="inline" className="flex flex-wrap gap-1">
      {attachments.files.map((file) => (
        <Attachment
          key={file.id}
          data={file}
          onRemove={() => attachments.remove(file.id)}
        >
          <AttachmentPreview />
          <AttachmentInfo />
          <AttachmentRemove />
        </Attachment>
      ))}
    </Attachments>
  );
}

function isToolPart(
  part: { type: string }
): part is ToolUIPart | DynamicToolUIPart {
  return part.type.startsWith("tool-") || part.type === "dynamic-tool";
}

function messagePartsToContent(parts: Array<{ type: string; text?: string; [k: string]: unknown }>): string {
  return parts
    .map((p) => {
      if (p.type === "text" && typeof p.text === "string") return p.text;
      if (p.type === "reasoning" && typeof p.text === "string") return `[Reasoning]\n${p.text}`;
      if (isToolPart(p)) {
        const name = p.type === "dynamic-tool" ? (p as DynamicToolUIPart).toolName ?? "tool" : (p as ToolUIPart).type.replace(/^tool-/, "");
        return `[Tool: ${name}]`;
      }
      return "";
    })
    .filter(Boolean)
    .join("\n\n");
}

const LABZ_SUGGESTIONS = [
  "Ask about formulas",
  "Search fragrance oils",
  "MNKY LABZ Pages summary",
] as const;

export function LabzChatPopup({ trigger }: { trigger?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [modelOptions, setModelOptions] = useState<{ value: string; label: string }[]>(LABZ_MODEL_OPTIONS_FALLBACK);
  const [model, setModel] = useState<string>(LABZ_MODEL_OPTIONS_FALLBACK[0]?.value ?? "gpt-4o-mini");

  const transport = useMemo(
    () => new DefaultChatTransport({ api: LABZ_API }),
    []
  );
  const { messages, sendMessage, status, error, stop } = useChat({ transport });
  const { setPersonaState, setStatusOverride } = useLabzPersonaState();
  const [isListening, setIsListening] = useState(false);

  const personaState =
    isListening ? "listening" : status === "streaming" || status === "submitted" ? "thinking" : "idle";
  useEffect(() => {
    setPersonaState(personaState);
  }, [personaState, setPersonaState]);

  useEffect(() => {
    if (!open) return;
    fetch(LABZ_MODELS_ENDPOINT)
      .then((r) => r.json())
      .then((data: { models?: { id: string; displayName?: string }[] }) => {
        const list = data.models ?? [];
        if (list.length > 0) {
          setModelOptions(
            list.map((m) => ({ value: m.id, label: m.displayName ?? m.id }))
          );
        }
      })
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    setStatusOverride(error ? "error" : null);
    return () => setStatusOverride(null);
  }, [error, setStatusOverride]);

  const handleSubmit = useCallback(
    async (message: { text: string; files?: Array<{ url: string; type?: string; filename?: string }> }) => {
      const hasText = Boolean(message.text?.trim());
      const hasFiles = Boolean(message.files?.length);
      if (!hasText && !hasFiles) return;
      sendMessage(
        {
          text: message.text?.trim() || "(attachment)",
          files: message.files,
        },
        { body: { model } }
      );
    },
    [sendMessage, model]
  );

  const isStreaming = status === "streaming" || status === "submitted";

  const downloadMessages: ConversationMessage[] = useMemo(
    () =>
      messages.map((m) => ({
        role: m.role as ConversationMessage["role"],
        content: messagePartsToContent(m.parts),
      })),
    [messages]
  );

  const defaultTrigger = (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9"
      aria-label="CODE MNKY – MNKY LABZ virtual assistant"
    >
      <Image
        src="/code-mnky.png"
        alt="CODE MNKY"
        width={24}
        height={24}
        className="rounded-full object-cover"
      />
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? defaultTrigger}
      </DialogTrigger>
      <DialogContent
        className="flex h-[85vh] max-h-[800px] w-full max-w-md flex-col overflow-hidden border border-border/50 bg-background/75 p-0 text-foreground shadow-2xl backdrop-blur-2xl sm:rounded-xl dark:border-white/10 dark:bg-background/65 dark:shadow-none"
      >
        <DialogHeader className="shrink-0 border-b border-border/50 bg-background/55 px-4 py-3 backdrop-blur-xl dark:bg-background/45">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Image
                src="/code-mnky.png"
                alt=""
                width={24}
                height={24}
                className="rounded-full object-cover shrink-0"
              />
              <DialogTitle className="text-lg font-semibold">
                CODE MNKY
              </DialogTitle>
            </div>
            <Select value={model} onValueChange={setModel} disabled={isStreaming}>
              <SelectTrigger
                className="h-8 w-[130px] shrink-0 border-border/60 bg-background/60 backdrop-blur-sm dark:border-white/10 dark:bg-background/50 text-xs"
                aria-label="Chat model"
              >
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent>
                {modelOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </DialogHeader>
        <PromptInputProvider>
        <div className="flex flex-1 flex-col min-h-0">
          <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
            {downloadMessages.length > 0 && (
              <ConversationDownload
                messages={downloadMessages}
                filename="labz-conversation.md"
                className="absolute top-4 right-4 z-10 rounded-full border border-border/60 bg-background/80 backdrop-blur-md dark:border-white/10 dark:bg-background/70"
              />
            )}
            <LabzConversation className="min-h-0 flex-1">
              <LabzConversationContent>
                {messages.length === 0 && (
                  <LabzConversationEmptyState
                    icon={
                      <Image
                        src="/code-mnky.png"
                        alt=""
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                      />
                    }
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="text-muted-foreground">
                        <Image
                          src="/code-mnky.png"
                          alt=""
                          width={48}
                          height={48}
                          className="rounded-full object-cover"
                        />
                      </div>
                      <div className="space-y-1">
<h3 className="font-medium text-sm text-foreground">CODE MNKY</h3>
                      <p className="text-muted-foreground text-sm">
                        MNKY LABZ virtual assistant – ask about formulas, fragrance oils, glossary, blending, or MNKY LABZ Pages…
                      </p>
                      </div>
                      <div className="mt-2 flex flex-wrap justify-center gap-2">
                        {LABZ_SUGGESTIONS.map((label) => (
                          <Button
                            key={label}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-full border-border/60 bg-background/60 backdrop-blur-sm dark:border-white/10 dark:bg-background/50"
                            onClick={() => sendMessage({ text: label }, { body: { model } })}
                          >
                            {label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </LabzConversationEmptyState>
                )}
                {messages.map((message, msgIndex) => (
                  <LabzMessage key={message.id} from={message.role}>
                    <LabzMessageContent>
                      {message.role === "assistant" && (
                        <MessageActions className="mb-1">
                          <MessageAction
                            tooltip="Copy"
                            label="Copy"
                            onClick={() => {
                              const textParts = message.parts
                                .filter(
                                  (p): p is { type: "text"; text: string } =>
                                    p.type === "text"
                                )
                                .map((p) => p.text);
                              if (textParts.length)
                                void navigator.clipboard.writeText(
                                  textParts.join("")
                                );
                            }}
                          >
                            <CopyIcon className="size-3.5" />
                          </MessageAction>
                        </MessageActions>
                      )}
                      {message.parts.map((part, i) => {
                        if (part.type === "reasoning") {
                          const reasoningPart = part as {
                            type: "reasoning";
                            text: string;
                            state?: "streaming" | "done";
                          };
                          if (!reasoningPart.text?.trim()) return null;
                          return (
                            <Reasoning
                              key={`${message.id}-${i}`}
                              className="border-border"
                            >
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
                            <Tool
                              key={`${message.id}-${i}`}
                              className="border-border"
                            >
                              <ToolHeader
                                type={toolPart.type as ToolUIPart["type"]}
                                state={toolPart.state}
                                {...(toolPart.type === "dynamic-tool"
                                  ? { toolName }
                                  : {})}
                              />
                              <ToolContent>
                                {"input" in toolPart && toolPart.input != null && (
                                  <ToolInput input={toolPart.input} />
                                )}
                                {("output" in toolPart &&
                                  (toolPart.output != null ||
                                    (toolPart as DynamicToolUIPart).errorText != null)) && (
                                      <ToolOutput
                                        output={
                                          (toolPart as DynamicToolUIPart).output
                                        }
                                        errorText={
                                          (toolPart as DynamicToolUIPart)
                                            .errorText
                                        }
                                      />
                                    )}
                              </ToolContent>
                            </Tool>
                          );
                        }
                        // When LABZ API returns source-document or citation parts, render Sources and Inline Citation here.
                        if (part.type === "text") {
                          const isLastAssistantMessage =
                            msgIndex === messages.length - 1 &&
                            message.role === "assistant";
                          return (
                            <LabzMessageResponse
                              key={`${message.id}-${i}`}
                              isStreaming={isStreaming}
                              isLastAssistantMessage={isLastAssistantMessage}
                            >
                              {(part as { type: "text"; text: string }).text}
                            </LabzMessageResponse>
                          );
                        }
                        return null;
                      })}
                    </LabzMessageContent>
                  </LabzMessage>
                ))}
                {isStreaming &&
                  messages.length > 0 &&
                  messages[messages.length - 1].role === "user" && (
                    <div className="flex items-center gap-2 py-2 text-muted-foreground">
                      <Shimmer className="text-sm" duration={1.5}>
                        Thinking…
                      </Shimmer>
                    </div>
                  )}
              </LabzConversationContent>
              <LabzConversationScrollButton />
            </LabzConversation>
          </div>
          {error && (
            <div className="shrink-0 px-4 py-2">
              <Alert variant="destructive" role="alert">
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            </div>
          )}
          <div className="shrink-0 border-t border-border/50 bg-background/55 p-4 backdrop-blur-xl dark:bg-background/45">
            <PromptInput
              onSubmit={handleSubmit}
              className="w-full"
              globalDrop
              multiple
            >
              <PromptInputHeader>
                <LabzAttachmentsDisplay />
              </PromptInputHeader>
              <LabzPromptInputBody>
                <LabzPromptInputTextarea />
              </LabzPromptInputBody>
              <PromptInputFooter>
                <LabzVoiceInput onListeningChange={setIsListening} />
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger />
                  <PromptInputActionMenuContent>
                    <PromptInputActionAddAttachments label="Add files" />
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>
                <LabzPromptInputSubmit
                  disabled={isStreaming}
                  status={isStreaming ? "streaming" : "ready"}
                  onStop={stop}
                />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>
        </PromptInputProvider>
      </DialogContent>
    </Dialog>
  );
}
