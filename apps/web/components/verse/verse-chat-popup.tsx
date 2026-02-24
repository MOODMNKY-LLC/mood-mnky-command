"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import Link from "next/link";
import { CopyIcon } from "lucide-react";
import { VerseLogoHairIcon } from "@/components/verse/verse-logo-hair-icon";
import type { PersonaState } from "@/components/ai-elements/persona";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  VerseAttachmentsDisplay,
  VerseChatUserPill,
  VerseConversation,
  VerseConversationContent,
  VerseConversationEmptyState,
  VerseConversationScrollButton,
} from "@/components/verse/chat";
import {
  VerseMessage,
  VerseMessageContent,
  VerseMessageResponse,
} from "@/components/verse/chat";
import {
  VersePromptInputBody,
  VersePromptInputSubmit,
  VersePromptInputTextarea,
} from "@/components/verse/chat";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputActionAddAttachments,
} from "@/components/ai-elements/prompt-input";
import { VerseButton } from "@/components/verse/ui/button";
import { useVersePersonaState } from "@/components/verse/verse-persona-state-context";
import { useVerseTheme } from "@/components/verse/verse-theme-provider";
import type { VerseUser } from "./verse-storefront-shell";
import {
  MessageAction,
  MessageActions,
} from "@/components/ai-elements/message";
import {
  Attachments,
  Attachment,
  AttachmentPreview,
} from "@/components/ai-elements/attachments";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
  ReasoningText,
} from "@/components/ai-elements/reasoning";
import { SpeechInput } from "@/components/ai-elements/speech-input";
import { uploadVerseAttachments } from "@/lib/verse/upload-attachments";
import type { FileUIPart } from "ai";
import { VerseVoiceChat } from "@/components/verse/verse-voice-chat";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEFAULT_AGENT_SLUG } from "@/lib/agents";
import { MessageSquare, Mic } from "lucide-react";

export function VerseChatPopup({
  user,
  trigger,
}: {
  user?: VerseUser;
  trigger?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"chat" | "voice">("chat");
  const [voiceAgentId, setVoiceAgentId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [agents, setAgents] = useState<{ slug: string; display_name: string }[]>([]);
  const [agentSlug, setAgentSlug] = useState<string>(DEFAULT_AGENT_SLUG);
  const { theme } = useVerseTheme();

  useEffect(() => {
    if (!open) return;
    fetch("/api/chat/eleven-labs-config")
      .then((r) => r.json())
      .then((d: { agentId?: string | null }) => setVoiceAgentId(d.agentId ?? null))
      .catch(() => setVoiceAgentId(null));
  }, [open]);

  useEffect(() => {
    if (!open || !user) return;
    Promise.all([
      fetch("/api/verse/agents").then((r) => r.json()),
      fetch("/api/verse/profile").then((r) => r.json()).catch(() => ({})),
    ]).then(([agentsRes, profileRes]) => {
      const agentsData = (agentsRes as { agents?: { slug: string; display_name: string }[] })?.agents ?? [];
      setAgents(agentsData);
      const prefs = (profileRes as { preferences?: Record<string, unknown> })?.preferences ?? {};
      const defaultSlug = prefs.default_agent_slug as string | undefined;
      if (defaultSlug && agentsData.some((a) => a.slug === defaultSlug)) {
        setAgentSlug(defaultSlug);
      }
    });
  }, [open, user]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/verse/chat",
        fetch: async (url, init) => {
          const res = await fetch(url, init);
          const sid = res.headers.get("x-chat-session-id");
          if (sid) setSessionId(sid);
          return res;
        },
      }),
    []
  );
  const { messages, sendMessage, status, error } = useChat({
    transport,
    body: { sessionId: sessionId ?? undefined, agentSlug: agentSlug || undefined },
  });

  const handleSubmit = useCallback(
    async (message: { text: string; files?: Array<{ url: string; type?: string; filename?: string }> }) => {
      const hasText = Boolean(message.text?.trim());
      const hasAttachments = Boolean(message.files?.length);
      if (!hasText && !hasAttachments) return;
      let filesToSend = message.files;
      if (message.files?.length) {
        const uploaded = await uploadVerseAttachments(message.files, sessionId);
        filesToSend = uploaded.map((f) => ({
          type: "file" as const,
          url: f.url,
          filename: f.filename,
          mediaType: f.mediaType,
        }));
      }
      sendMessage({
        text: message.text?.trim() || (filesToSend?.length ? "Sent with attachments" : ""),
        files: filesToSend,
      });
      setText("");
    },
    [sendMessage, sessionId]
  );

  const isStreaming = status === "streaming" || status === "submitted";
  const personaState: PersonaState = isStreaming ? "thinking" : "idle";
  const { setPersonaState } = useVersePersonaState();

  useEffect(() => {
    setPersonaState(personaState);
  }, [personaState, setPersonaState]);

  const defaultTrigger = (
    <VerseButton
      variant="ghost"
      size="icon"
      className="h-9 w-9"
      aria-label="Open chat"
    >
      <VerseLogoHairIcon size="sm" withRing />
    </VerseButton>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? defaultTrigger}
      </SheetTrigger>
      <SheetContent
        side="right"
        data-verse-theme={theme}
        className="verse-storefront verse-chat-popup-glass flex h-dvh max-h-dvh w-full flex-col overflow-hidden border border-[var(--verse-border)] p-0 text-[var(--verse-text)] sm:max-w-md"
      >
        <SheetHeader className="verse-chat-inner-panel shrink-0 border-b-0 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="font-verse-heading text-lg text-verse-text">
              MNKY VERSE Chat
            </SheetTitle>
            <div className="flex items-center gap-2">
              {user && <VerseChatUserPill user={user} />}
              <VerseLogoHairIcon
                size="md"
                withRing
                status={personaState === "thinking" ? "thinking" : "idle"}
                className="shrink-0"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {agents.length > 0 && (
              <Select value={agentSlug} onValueChange={setAgentSlug}>
                <SelectTrigger
                  className={
                    theme === "dark"
                      ? "h-8 w-[130px] border-[rgba(200,196,196,0.2)] bg-[rgba(24,22,25,0.9)] text-verse-text"
                      : "h-8 w-[130px] border-[var(--verse-border)] bg-[rgba(241,245,249,0.9)] text-verse-text"
                  }
                >
                  <SelectValue placeholder="Agent" />
                </SelectTrigger>
                <SelectContent
                  data-verse-theme={theme}
                  className={
                    theme === "dark"
                      ? "verse-storefront border-[rgba(200,196,196,0.2)] bg-[rgba(24,22,25,0.98)] text-[#c8c4c4] backdrop-blur-xl"
                      : "verse-storefront border-[rgba(15,23,42,0.12)] bg-[rgba(241,245,249,0.98)] text-[#0f172a] backdrop-blur-xl"
                  }
                >
                  {agents.map((a) => (
                    <SelectItem key={a.slug} value={a.slug}>
                      {a.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="verse-chat-inner-panel flex rounded-lg border border-[var(--verse-border)] p-0.5">
              <button
                type="button"
                onClick={() => setMode("chat")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  mode === "chat"
                    ? "bg-verse-button text-verse-button-text"
                    : "text-verse-text-muted hover:text-verse-text"
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                Chat
              </button>
              <button
                type="button"
                onClick={() => setMode("voice")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  mode === "voice"
                    ? "bg-verse-button text-verse-button-text"
                    : "text-verse-text-muted hover:text-verse-text"
                }`}
              >
                <Mic className="h-4 w-4" />
                Voice
              </button>
            </div>
            <Link
              href="/dojo/chat"
              onClick={() => setOpen(false)}
              className="text-verse-text-muted text-sm hover:text-verse-text"
            >
              Open full chat
            </Link>
          </div>
        </SheetHeader>
        <div className="flex flex-1 flex-col min-h-0">
          {!user ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
              <p className="text-verse-text-muted text-sm">
                Sign in to chat with MOOD MNKY.
              </p>
              <VerseButton asChild variant="default" size="sm">
                <Link href="/auth/login">Sign in</Link>
              </VerseButton>
            </div>
          ) : mode === "voice" ? (
            <div className="flex flex-1 flex-col items-center justify-center min-h-0 overflow-auto p-4">
              <VerseVoiceChat
                agentId={voiceAgentId ?? process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID ?? null}
                connectionType="webrtc"
              />
            </div>
          ) : (
            <>
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <VerseConversation className="min-h-0 flex-1">
                  <VerseConversationContent>
                  {messages.length === 0 && (
                    <VerseConversationEmptyState
                      icon={<VerseLogoHairIcon size="lg" className="text-verse-text-muted" />}
                    />
                  )}
                  {messages.map((message, msgIndex) => (
                    <VerseMessage key={message.id} from={message.role}>
                      <VerseMessageContent
                        className={
                          message.role === "user"
                            ? "verse-chat-message-user"
                            : "verse-chat-message-assistant"
                        }
                      >
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
                          if (part.type === "file") {
                            const fileParts = message.parts.filter(
                              (p): p is FileUIPart => p.type === "file"
                            );
                            const firstFileIndex = message.parts.findIndex(
                              (p) => p.type === "file"
                            );
                            if (i !== firstFileIndex) return null;
                            return (
                              <Attachments
                                key={`${message.id}-files`}
                                variant="grid"
                                className="mb-2 border-[var(--verse-border)]"
                              >
                                {fileParts.map((fp, fi) => (
                                  <Attachment
                                    key={`${message.id}-file-${fi}`}
                                    data={{
                                      ...fp,
                                      id: `${message.id}-file-${fi}`,
                                    }}
                                  >
                                    <AttachmentPreview />
                                  </Attachment>
                                ))}
                              </Attachments>
                            );
                          }
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
                                className="border-[var(--verse-border)]"
                              >
                                <ReasoningTrigger label="View reasoning" />
                                <ReasoningContent>
                                  <ReasoningText text={reasoningPart.text} />
                                </ReasoningContent>
                              </Reasoning>
                            );
                          }
                          if (part.type === "source-url") {
                            const sourcePart = part as {
                              type: "source-url";
                              url?: string;
                              sourceId?: string;
                            };
                            if (!sourcePart.url) return null;
                            return (
                              <a
                                key={`${message.id}-${i}`}
                                href={sourcePart.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-verse-text-muted hover:text-verse-text text-xs block truncate max-w-md"
                              >
                                {sourcePart.url}
                              </a>
                            );
                          }
                          if (part.type === "text") {
                            const isLastAssistantMessage =
                              msgIndex === messages.length - 1 &&
                              message.role === "assistant";
                            return (
                              <VerseMessageResponse
                                key={`${message.id}-${i}`}
                                isStreaming={isStreaming}
                                isLastAssistantMessage={isLastAssistantMessage}
                              >
                                {(part as { type: "text"; text: string }).text}
                              </VerseMessageResponse>
                            );
                          }
                          return null;
                        })}
                      </VerseMessageContent>
                    </VerseMessage>
                  ))}
                  </VerseConversationContent>
                  <VerseConversationScrollButton />
                </VerseConversation>
              </div>
              {error && (
                <p className="shrink-0 px-4 py-2 text-sm text-destructive">
                  {error.message}
                </p>
              )}
              <div className="verse-chat-input-panel shrink-0 border-t border-[var(--verse-border)] p-4">
                <PromptInput
                  onSubmit={handleSubmit}
                  className="w-full"
                  globalDrop
                  multiple
                >
                  <PromptInputHeader>
                    <VerseAttachmentsDisplay />
                  </PromptInputHeader>
                  <VersePromptInputBody>
                    <VersePromptInputTextarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Ask about fragrances or products..."
                    />
                  </VersePromptInputBody>
                  <PromptInputFooter>
                    <SpeechInput
                      onTranscriptionChange={(t) =>
                        setText((prev) => (prev ? `${prev} ${t}` : t))
                      }
                      onAudioRecorded={async (blob) => {
                        const fd = new FormData();
                        fd.append("file", blob, "recording.webm");
                        const res = await fetch("/api/audio/transcribe", {
                          method: "POST",
                          body: fd,
                        });
                        if (!res.ok) {
                          const err = await res.json().catch(() => ({}));
                          throw new Error(
                            (err as { error?: string })?.error ??
                              "Transcription failed"
                          );
                        }
                        const { transcript } = await res.json();
                        return transcript?.text ?? "";
                      }}
                      className="border-[var(--verse-border)] text-verse-text hover:bg-verse-button/10"
                    />
                    <PromptInputActionMenu>
                      <PromptInputActionMenuTrigger />
                      <PromptInputActionMenuContent>
                        <PromptInputActionAddAttachments />
                      </PromptInputActionMenuContent>
                    </PromptInputActionMenu>
                    <VersePromptInputSubmit
                      disabled={!text.trim() && !isStreaming}
                      status={isStreaming ? "streaming" : "ready"}
                    />
                  </PromptInputFooter>
                </PromptInput>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
