"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import Link from "next/link";
import { CopyIcon } from "lucide-react";
import { VerseLogoHairIcon } from "@/components/verse/verse-logo-hair-icon";
import { Persona, type PersonaState } from "@/components/ai-elements/persona";
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
import { VerseButton } from "@/components/verse/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVersePersonaState } from "@/components/verse/verse-persona-state-context";
import { useVerseUser } from "@/components/verse/verse-user-context";
import { VerseVoiceChat } from "@/components/verse/verse-voice-chat";
import { MessageSquare, Mic } from "lucide-react";

// 5-series only; first = most cost-effective (default)
const VERSE_CHAT_MODELS = [
  { value: "gpt-5-nano", label: "GPT-5 Nano" },
  { value: "gpt-5-mini", label: "GPT-5 Mini" },
  { value: "gpt-5.2", label: "GPT-5.2" },
  { value: "gpt-5.2-pro", label: "GPT-5.2 Pro" },
] as const;

export function VerseChatPageContent() {
  const user = useVerseUser();
  const [mode, setMode] = useState<"chat" | "voice">("chat");
  const [voiceAgentId, setVoiceAgentId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [model, setModel] = useState<string>(VERSE_CHAT_MODELS[0].value);

  useEffect(() => {
    fetch("/api/chat/eleven-labs-config")
      .then((r) => r.json())
      .then((d: { agentId?: string | null }) => setVoiceAgentId(d.agentId ?? null))
      .catch(() => setVoiceAgentId(null));
  }, []);
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
    body: { sessionId: sessionId ?? undefined, model },
  });

  const handleSubmit = useCallback(
    async (message: {
      text: string;
      files?: Array<{ url: string; type?: string; filename?: string }>;
    }) => {
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

  if (!user) {
    return (
      <div className="verse-container mx-auto flex min-h-[60vh] max-w-[var(--verse-page-width)] flex-col items-center justify-center gap-6 px-4 py-12 text-center">
        <h1 className="font-verse-heading text-2xl font-semibold text-verse-text">
          MNKY VERSE Chat — Meet MOOD MNKY
        </h1>
        <p className="text-verse-text-muted max-w-md text-sm">
          Sign in to chat with MOOD MNKY and discover fragrances, products, and
          the Verse.
        </p>
        <VerseButton asChild variant="default" size="lg">
          <Link href="/auth/login">Sign in to chat</Link>
        </VerseButton>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-6rem)] max-h-[calc(100dvh-6rem)] flex-col overflow-hidden">
      <div className="verse-container mx-auto flex h-full w-full max-w-3xl flex-col px-4 py-4">
        <header className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[var(--verse-border)] pb-3">
          <div className="flex items-center gap-3">
            <h1 className="font-verse-heading text-xl font-semibold text-verse-text">
              MNKY VERSE Chat — Meet MOOD MNKY
            </h1>
            <div className="flex rounded-lg border border-[var(--verse-border)] p-0.5">
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
          </div>
          <div className="flex items-center gap-3">
            {mode === "chat" && (
            <Select
              value={model}
              onValueChange={setModel}
              disabled={isStreaming}
            >
              <SelectTrigger
                className="h-8 w-[130px] border-[var(--verse-border)] bg-[var(--verse-bg)] text-verse-text"
                aria-label="Chat model"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VERSE_CHAT_MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            )}
            <VerseChatUserPill user={user} />
            <Persona
              state={personaState}
              variant="halo"
              className="size-24 shrink-0"
              themeColorVariable="--verse-text-rgb"
            />
          </div>
        </header>

        {mode === "voice" ? (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-auto py-8">
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
              <>
                <VerseConversationEmptyState
                  icon={
                    <VerseLogoHairIcon size="lg" className="text-verse-text-muted" />
                  }
                />
                <div className="flex flex-wrap justify-center gap-2 px-4 pb-4">
                  {[
                    "What fragrances do you have?",
                    "Tell me about MOOD MNKY",
                    "Explore fresh scents",
                  ].map((suggestion) => (
                    <VerseButton
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      className="border-[var(--verse-border)] text-verse-text hover:bg-verse-button/10"
                      onClick={() =>
                        sendMessage({
                          text: suggestion,
                          files: undefined,
                        })
                      }
                    >
                      {suggestion}
                    </VerseButton>
                  ))}
                </div>
              </>
            )}
            {messages.map((message, msgIndex) => (
              <VerseMessage key={message.id} from={message.role}>
                <VerseMessageContent>
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
          <p className="mt-2 shrink-0 text-sm text-destructive">{error.message}</p>
        )}

        <div className="mt-4 shrink-0 border-t border-[var(--verse-border)] pt-4">
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
    </div>
  );
}
