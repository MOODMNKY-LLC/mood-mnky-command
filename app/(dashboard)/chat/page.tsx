"use client"

import { useCallback, useMemo, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@/components/ai-elements/attachments"
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import {
  BlurFadeBlock,
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message"
import {
  Reasoning,
  ReasoningContent,
  ReasoningText,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning"
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool"
import { SavedBlendCard } from "@/components/ai-elements/saved-blend-card"
import {
  BlendSuggestionsCard,
  type BlendSuggestionsInput,
} from "@/components/ai-elements/blend-suggestions-card"
import {
  ProductPickerCard,
  type ProductPickerInput,
} from "@/components/ai-elements/product-picker-card"
import { PersonalizationFormCard } from "@/components/ai-elements/personalization-form-card"
import {
  InlineIntakeForm,
  type InlineIntakeFormInput,
} from "@/components/ai-elements/inline-intake-form"
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputSelect,
  PromptInputSelectContent,
  PromptInputSelectItem,
  PromptInputSelectTrigger,
  PromptInputSelectValue,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input"
import { Persona, type PersonaState } from "@/components/ai-elements/persona"
import { SpeechInput } from "@/components/ai-elements/speech-input"
import { BlurFade } from "@/components/ui/blur-fade"
import { DotPattern } from "@/components/ui/dot-pattern"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Spinner } from "@/components/ui/spinner"
import { FlaskConical, GlobeIcon, MessageSquareIcon, RotateCcw, ThumbsDown, ThumbsUp } from "lucide-react"

const models = [
  { id: "gpt-5", name: "GPT-5" },
  { id: "gpt-5-mini", name: "GPT-5 Mini" },
  { id: "gpt-5-nano", name: "GPT-5 Nano" },
  { id: "o3-mini", name: "o3 Mini (Deep reasoning)" },
  { id: "gpt-4o", name: "GPT-4o" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini" },
]

const SUGGESTED_PROMPTS = [
  {
    label: "Blend a custom fragrance",
    text: "I want to blend a custom fragrance. Guide me through selecting oils, proportions, and making a candle.",
    blending: true,
  },
  {
    label: "Find fragrances for a cozy fall candle",
    text: "Find fragrances for a cozy fall candle",
    blending: false,
  },
  {
    label: "Help me blend a custom scent",
    text: "Help me blend a custom scent",
    blending: true,
  },
  {
    label: "Show my saved blends",
    text: "Show my saved fragrance blends",
    blending: true,
  },
  {
    label: "Search formulas for vanilla",
    text: "Search formulas for vanilla",
    blending: false,
  },
]

const PromptInputAttachmentsDisplay = () => {
  const attachments = usePromptInputAttachments()
  const handleRemove = useCallback((id: string) => attachments.remove(id), [attachments])
  if (attachments.files.length === 0) return null
  return (
    <Attachments variant="inline">
      {attachments.files.map((attachment) => (
        <Attachment key={attachment.id} data={attachment} onRemove={handleRemove}>
          <AttachmentPreview />
          <AttachmentRemove />
        </Attachment>
      ))}
    </Attachments>
  )
}

export default function ChatPage() {
  const [model, setModel] = useState(models[1].id) // gpt-5-mini default (cost-efficient)
  const [webSearch, setWebSearch] = useState(false)
  const [text, setText] = useState("")
  const [blendingMode, setBlendingMode] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        fetch: async (url, init) => {
          const res = await fetch(url, init)
          const sid = res.headers.get("x-chat-session-id")
          if (sid) setSessionId(sid)
          return res
        },
      }),
    []
  )
  const { messages, sendMessage, status, setMessages } = useChat({
    transport,
    body: {
      model,
      webSearch,
      ...(blendingMode ? { mode: "blending" as const } : {}),
      sessionId: sessionId ?? undefined,
    },
  })

  const handleSubmit = useCallback(
    (message: { text: string; files?: Array<{ url: string; type?: string; filename?: string }> }) => {
      const hasText = Boolean(message.text?.trim())
      const hasAttachments = Boolean(message.files?.length)
      if (!hasText && !hasAttachments) return

      sendMessage({
        text: message.text?.trim() || "Sent with attachments",
        files: message.files,
      })
      setText("")
    },
    [sendMessage]
  )

  const isStreaming = status === "streaming" || status === "submitted"
  const personaState: PersonaState = isStreaming ? "thinking" : "idle"

  return (
    <div className="flex flex-col size-full min-h-0">
      <div className="border-b px-4 py-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="font-semibold text-lg flex items-center gap-2 flex-wrap">
            <MessageSquareIcon className="size-5" />
            AI Chat
            <Persona state={personaState} variant="halo" className="size-10 shrink-0" />
            {blendingMode && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <FlaskConical className="size-3" />
                Blending
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Ask about formulas, fragrances, products, or generate images.
          </p>
        </div>
        {messages.length > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0 gap-1.5"
                  onClick={() => {
                    setSessionId(null)
                    setMessages([])
                  }}
                  disabled={isStreaming}
                  aria-label="Start new chat"
                >
                  <RotateCcw className="size-4" />
                  New chat
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Clear messages and start a new conversation</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <div className="flex flex-1 flex-col min-h-0 p-4">
        <div className="flex flex-col flex-1 min-h-0 rounded-lg border">
          <Conversation className="flex-1 min-h-0">
            <ConversationContent>
              {messages.length === 0 && (
                <div className="relative flex flex-1 flex-col items-center justify-center min-h-[200px]">
                  <DotPattern className="opacity-40" />
                  <BlurFade className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center relative z-10" delay={0.1}>
                  <MessageSquareIcon className="size-8 text-muted-foreground" />
                  <h3 className="font-medium text-sm">No messages yet</h3>
                  <p className="text-muted-foreground text-sm max-w-sm">
                    Start a conversation. Ask about fragrance oils, formulas, or product creation.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {SUGGESTED_PROMPTS.map((prompt, i) => (
                      <BlurFade key={prompt.text} delay={0.15 + i * 0.05}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            if (prompt.blending) setBlendingMode(true)
                            handleSubmit({ text: prompt.text })
                          }}
                        >
                          {prompt.label}
                        </Button>
                      </BlurFade>
                    ))}
                  </div>
                </BlurFade>
                </div>
              )}
              {messages.map((message, msgIndex) => (
                <Message key={message.id} from={message.role}>
                  <MessageContent>
                    {message.parts.map((part, i) => {
                      if (part.type === "reasoning") {
                        const reasoningPart = part as {
                          type: "reasoning"
                          text: string
                          state?: "streaming" | "done"
                        }
                        if (!reasoningPart.text?.trim()) return null
                        return (
                          <Reasoning key={`${message.id}-${i}`}>
                            <ReasoningTrigger label="View reasoning" />
                            <ReasoningContent>
                              <ReasoningText text={reasoningPart.text} />
                            </ReasoningContent>
                          </Reasoning>
                        )
                      }
                      if (part.type === "source-url") {
                        const sourcePart = part as {
                          type: "source-url"
                          url?: string
                          sourceId?: string
                        }
                        if (!sourcePart.url) return null
                        return (
                          <a
                            key={`${message.id}-${i}`}
                            href={sourcePart.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground text-xs block truncate max-w-md"
                          >
                            {sourcePart.url}
                          </a>
                        )
                      }
                      if (part.type === "text") {
                        const isLastAssistantMessage =
                          msgIndex === messages.length - 1 &&
                          message.role === "assistant"
                        return (
                          <MessageResponse
                            key={`${message.id}-${i}`}
                            {...(isStreaming &&
                              isLastAssistantMessage && {
                                mode: "streaming" as const,
                                parseIncompleteMarkdown: true,
                                BlockComponent: BlurFadeBlock,
                              })}
                          >
                            {part.text}
                          </MessageResponse>
                        )
                      }
                      if (
                        part.type === "tool-search_formulas" ||
                        part.type === "tool-search_fragrance_oils" ||
                        part.type === "tool-generate_image" ||
                        part.type === "tool-web_search" ||
                        part.type === "dynamic-tool"
                      ) {
                        const toolPart = part as {
                          type: string
                          state: string
                          input: unknown
                          output?: unknown
                          errorText?: string
                          toolName?: string
                        }
                        const toolName =
                          toolPart.type === "dynamic-tool"
                            ? toolPart.toolName ?? "tool"
                            : undefined
                        const isSaveBlend =
                          toolPart.type === "dynamic-tool" &&
                          toolName === "save_custom_blend"
                        const saveBlendSuccess =
                          isSaveBlend &&
                          toolPart.state === "output-available" &&
                          typeof toolPart.output === "object" &&
                          toolPart.output !== null &&
                          "success" in toolPart.output &&
                          (toolPart.output as { success?: boolean }).success === true
                        const isBlendSuggestions =
                          toolPart.type === "dynamic-tool" &&
                          toolName === "show_blend_suggestions" &&
                          toolPart.state === "output-available"
                        const isProductPicker =
                          toolPart.type === "dynamic-tool" &&
                          toolName === "show_product_picker" &&
                          toolPart.state === "output-available"
                        const isPersonalizationForm =
                          toolPart.type === "dynamic-tool" &&
                          toolName === "show_personalization_form" &&
                          toolPart.state === "output-available" &&
                          (toolPart.output as { needsInput?: boolean })?.needsInput === true
                        const isIntakeForm =
                          toolPart.type === "dynamic-tool" &&
                          toolName === "show_intake_form" &&
                          toolPart.state === "output-available" &&
                          ((toolPart.output as { needsForm?: boolean })?.needsForm === true ||
                            ((toolPart.output as { formSchema?: unknown[] })?.formSchema?.length ?? 0) > 0)
                        return (
                          <div key={`${message.id}-${i}`} className="space-y-3">
                            {isBlendSuggestions && (
                              <BlendSuggestionsCard
                                input={(toolPart.input || {}) as BlendSuggestionsInput}
                                output={(toolPart.output || {}) as BlendSuggestionsInput}
                              />
                            )}
                            {isProductPicker && (
                              <ProductPickerCard
                                input={(toolPart.input || {}) as ProductPickerInput}
                                output={(toolPart.output || {}) as ProductPickerInput}
                              />
                            )}
                            {isPersonalizationForm && (
                              <PersonalizationFormCard
                                input={(toolPart.input || {}) as import("@/components/ai-elements/personalization-form-card").PersonalizationFormInput}
                                output={(toolPart.output || {}) as import("@/components/ai-elements/personalization-form-card").PersonalizationFormInput}
                              />
                            )}
                            {isIntakeForm && (
                              <InlineIntakeForm
                                input={(toolPart.input || {}) as InlineIntakeFormInput}
                                output={(toolPart.output || {}) as InlineIntakeFormInput}
                              />
                            )}
                            {saveBlendSuccess && (
                              <SavedBlendCard
                                input={(toolPart.input || {}) as { name?: string; productType?: string; fragrances?: Array<{ oilId?: string; oilName?: string; proportionPct?: number }>; notes?: string }}
                                output={(toolPart.output || {}) as { success?: boolean; blendId?: string; error?: string }}
                              />
                            )}
                            <Tool
                              defaultOpen={
                                toolPart.state === "output-available" ||
                                toolPart.state === "output-error"
                              }
                            >
                              <ToolHeader
                                type={toolPart.type as "tool-search_formulas" | "tool-search_fragrance_oils" | "tool-generate_image" | "tool-web_search" | "dynamic-tool"}
                                state={toolPart.state as "output-available" | "output-error" | "input-available" | "input-streaming" | "approval-requested" | "approval-responded" | "output-denied"}
                                {...(toolPart.type === "dynamic-tool" && toolName ? { toolName } : {})}
                              />
                              <ToolContent>
                                <ToolInput input={toolPart.input} />
                                <ToolOutput
                                  output={toolPart.output}
                                  errorText={toolPart.errorText}
                                />
                              </ToolContent>
                            </Tool>
                          </div>
                        )
                      }
                      return null
                    })}
                    {message.role === "assistant" && (
                      <MessageActions className="mt-2">
                        <MessageAction
                          tooltip="Helpful"
                          onClick={() => {}}
                          aria-label="Helpful"
                        >
                          <ThumbsUp className="size-3.5" />
                        </MessageAction>
                        <MessageAction
                          tooltip="Not helpful"
                          onClick={() => {}}
                          aria-label="Not helpful"
                        >
                          <ThumbsDown className="size-3.5" />
                        </MessageAction>
                      </MessageActions>
                    )}
                  </MessageContent>
                </Message>
              ))}
              {status === "submitted" && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Spinner className="size-4" />
                  <span className="text-sm">Thinking...</span>
                </div>
              )}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>

          <PromptInput
            onSubmit={handleSubmit}
            className="mt-auto border-t p-2"
            globalDrop
            multiple
          >
            <PromptInputHeader>
              <PromptInputAttachmentsDisplay />
            </PromptInputHeader>
            <PromptInputBody>
              <PromptInputTextarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ask about formulas, fragrances, or products..."
              />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                <SpeechInput
                  onTranscriptionChange={(t) =>
                    setText((prev) => (prev ? `${prev} ${t}` : t))
                  }
                  onAudioRecorded={async (blob) => {
                    const fd = new FormData()
                    fd.append("file", blob, "recording.webm")
                    const res = await fetch("/api/audio/transcribe", {
                      method: "POST",
                      body: fd,
                    })
                    if (!res.ok) {
                      const err = await res.json().catch(() => ({}))
                      throw new Error((err as { error?: string })?.error ?? "Transcription failed")
                    }
                    const { transcript } = await res.json()
                    return transcript?.text ?? ""
                  }}
                />
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger />
                  <PromptInputActionMenuContent>
                    <PromptInputActionAddAttachments />
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant={blendingMode ? "secondary" : "ghost"}
                        size="icon-sm"
                        onClick={() => setBlendingMode((v) => !v)}
                        aria-pressed={blendingMode}
                      >
                        <FlaskConical className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {blendingMode
                        ? "Blending mode on – step-by-step fragrance blend guided flow"
                        : "Blending mode off – enable for lab-style blend guidance"}
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant={webSearch ? "secondary" : "ghost"}
                        size="icon-sm"
                        onClick={() => setWebSearch((v) => !v)}
                        aria-pressed={webSearch}
                      >
                        <GlobeIcon className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {webSearch
                        ? "Web search on – model can search the web"
                        : "Web search off – enable for real-time info"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <PromptInputSelect value={model} onValueChange={setModel}>
                  <PromptInputSelectTrigger>
                    <PromptInputSelectValue />
                  </PromptInputSelectTrigger>
                  <PromptInputSelectContent>
                    {models.map((m) => (
                      <PromptInputSelectItem key={m.id} value={m.id}>
                        {m.name}
                      </PromptInputSelectItem>
                    ))}
                  </PromptInputSelectContent>
                </PromptInputSelect>
              </PromptInputTools>
              <PromptInputSubmit
                disabled={!text.trim() && status !== "submitted"}
                status={isStreaming ? "streaming" : "ready"}
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  )
}
