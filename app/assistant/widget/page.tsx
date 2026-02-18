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
import { VerseConversation, VerseConversationContent } from "@/components/verse/chat"
import { VerseLogoHairIcon } from "@/components/verse/verse-logo-hair-icon"
import { VerseButton } from "@/components/verse/ui/button"
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

  return (
    <div className="flex h-full min-h-[400px] flex-col overflow-hidden rounded-lg border border-border bg-background">
      <header className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
        <VerseLogoHairIcon size="sm" />
        <span className="text-sm font-medium">MNKY Assistant</span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <VerseConversation className="min-h-0 flex-1">
          <VerseConversationContent>
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-4 px-4 py-8 text-center">
                <VerseLogoHairIcon size="lg" className="text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Hi! I&apos;m the MNKY Assistant. Ask about fragrances, products, shipping, or explore the MNKY VERSE.
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
        </VerseConversation>

        {error && (
          <p className="px-3 py-1 text-sm text-destructive">{error.message}</p>
        )}

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
    </div>
  )
}
