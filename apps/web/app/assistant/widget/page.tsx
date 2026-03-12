"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { VerseMessage, VerseMessageContent, VerseMessageResponse } from "@/components/verse/chat"
import {
  VersePromptInputBody,
  VersePromptInputSubmit,
  VersePromptInputTextarea,
} from "@/components/verse/chat"
import {
  VerseConversation,
  VerseConversationContent,
  VerseConversationScrollButton,
} from "@/components/verse/chat"
import { VerseLogoHairIcon } from "@/components/verse/verse-logo-hair-icon"
import { VerseButton } from "@/components/verse/ui/button"
import { X as XIcon } from "lucide-react"
import { PromptInput, PromptInputFooter } from "@/components/ai-elements/prompt-input"

const MNKY_ANONYMOUS_ID_KEY = "mnky_anonymous_id"

function getOrCreateAnonymousId(): string {
  if (typeof window === "undefined") return crypto.randomUUID()
  let id = localStorage.getItem(MNKY_ANONYMOUS_ID_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(MNKY_ANONYMOUS_ID_KEY, id)
  }
  return id
}

export default function AssistantWidgetPage() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [anonymousId] = useState(() => getOrCreateAnonymousId())

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/storefront-assistant",
        fetch: async (url, init) => {
          const headers = new Headers(init?.headers)
          headers.set("x-mnky-anonymous-id", anonymousId)
          const res = await fetch(url, { ...init, headers })
          const sid = res.headers.get("x-mnky-session-id")
          if (sid) setSessionId(sid)
          return res
        },
      }),
    [anonymousId]
  )

  const { messages, sendMessage, status, error } = useChat({
    transport,
    body: { sessionId: sessionId ?? undefined },
  })

  useEffect(() => {
    if (typeof window === "undefined" || !window.parent) return
    const themeStatus =
      status === "streaming" || status === "submitted"
        ? "streaming"
        : status === "ready"
          ? "idle"
          : "idle"
    window.parent.postMessage(
      { type: "mnky-assistant-status", status: themeStatus },
      "*"
    )
  }, [status])

  const handleSubmit = useCallback(
    (message: { text: string }) => {
      const text = message.text?.trim()
      if (!text) return
      sendMessage({ text })
    },
    [sendMessage]
  )

  const isStreaming = status === "streaming" || status === "submitted"

  const handleClose = useCallback(() => {
    if (typeof window !== "undefined" && window.parent) {
      window.parent.postMessage({ type: "mnky-assistant-close" }, "*")
    }
  }, [])

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_1fr_auto] overflow-hidden rounded-lg border border-border bg-background">
      {/* Fixed header */}
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <VerseLogoHairIcon size="sm" className="shrink-0" />
            <span className="truncate text-sm font-semibold">MNKY CHAT</span>
          </div>
          <span className="text-xs text-muted-foreground">
            Ask about fragrances, products & the MNKY VERSE
          </span>
        </div>
        <VerseButton
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Close chat"
          onClick={handleClose}
          className="shrink-0"
        >
          <XIcon className="size-4" />
        </VerseButton>
      </header>

      {/* Fixed scrollable message area */}
      <div className="min-h-0 overflow-y-auto overflow-x-hidden">
        <VerseConversation className="h-full min-h-0">
          <VerseConversationContent className="min-h-full">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-4 px-4 py-8 text-center">
                <VerseLogoHairIcon size="lg" className="text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Hi! Ask about fragrances, products, shipping, or explore the MNKY VERSE.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {["What candles do you have?", "Shipping & returns", "Tell me about MOOD MNKY"].map(
                    (s) => (
                      <VerseButton
                        key={s}
                        variant="outline"
                        size="sm"
                        onClick={() => sendMessage({ text: s })}
                      >
                        {s}
                      </VerseButton>
                    )
                  )}
                </div>
              </div>
            )}
            {messages.map((message, msgIndex) => (
              <VerseMessage key={message.id} from={message.role}>
                <VerseMessageContent>
                  {message.parts.map((part, i) => {
                    if (part.type === "text") {
                      const isLastAssistant =
                        msgIndex === messages.length - 1 && message.role === "assistant"
                      return (
                        <VerseMessageResponse
                          key={`${message.id}-${i}`}
                          isStreaming={isStreaming}
                          isLastAssistantMessage={isLastAssistant}
                        >
                          {(part as { type: "text"; text: string }).text}
                        </VerseMessageResponse>
                      )
                    }
                    return null
                  })}
                </VerseMessageContent>
              </VerseMessage>
            ))}
          </VerseConversationContent>
          <VerseConversationScrollButton />
        </VerseConversation>
        {error && (
          <p className="px-3 py-1 text-sm text-destructive">{error.message}</p>
        )}
      </div>

      {/* Fixed input bar */}
      <div className="shrink-0 border-t border-border p-2">
        <PromptInput onSubmit={handleSubmit} className="w-full">
          <VersePromptInputBody>
            <VersePromptInputTextarea
              placeholder="Ask about fragrances, products, shipping..."
              className="min-h-[44px] resize-none"
            />
          </VersePromptInputBody>
          <PromptInputFooter>
            <VersePromptInputSubmit
              disabled={isStreaming}
              status={isStreaming ? "streaming" : "ready"}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  )
}
