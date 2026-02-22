"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { useChat } from "@ai-sdk/react"
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import {
  BlurFadeBlock,
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message"
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input"
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion"
import { Shimmer } from "@/components/ai-elements/shimmer"
import { ChainOfThought } from "@/components/ai-elements/chain-of-thought"
import { OpenInChat } from "@/components/ai-elements/open-in-chat"
import { MainGlassCard } from "./main-glass-card"
import { MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

type MainAgent = {
  slug: string
  displayName: string
  imagePath: string
}

const SUGGESTIONS = [
  "What is MOOD MNKY?",
  "Tell me about the MNKY VERSE",
  "What fragrances do you offer?",
]

const HANDOFF_SUGGESTIONS: { label: string; agentSlug: string; text: string }[] = [
  { label: "Ask SAGE about learning", agentSlug: "sage_mnky", text: "I'd like to learn more about fragrance and wellness. Can you guide me?" },
  { label: "Talk to CODE about tech", agentSlug: "code_mnky", text: "I'm curious about how the Blending Lab and VERSE work technically." },
]

const DEFAULT_QUERY = "Tell me about MOOD MNKY – bespoke fragrance and the MNKY VERSE."

export interface MainChatbotProps {
  className?: string
}

export function MainChatbot({ className }: MainChatbotProps) {
  const [agents, setAgents] = useState<MainAgent[]>([])
  const [selectedSlug, setSelectedSlug] = useState<string>("mood_mnky")

  const { messages, sendMessage, status, error } = useChat({
    api: "/api/main/chat-demo",
  })

  useEffect(() => {
    fetch("/api/main/agents")
      .then((res) => res.json())
      .then((data: { agents?: { slug: string; displayName: string; imagePath: string }[] }) => {
        const list = data.agents ?? []
        setAgents(list)
        if (list.length > 0 && !list.some((a) => a.slug === selectedSlug)) {
          setSelectedSlug(list[0].slug)
        }
      })
      .catch(() => setAgents([]))
  }, [])

  const handleSubmit = useCallback(
    (message: { text: string }) => {
      const text = message.text?.trim()
      if (!text) return
      sendMessage({ text }, { body: { agentSlug: selectedSlug } })
    },
    [sendMessage, selectedSlug]
  )

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      sendMessage({ text: suggestion }, { body: { agentSlug: selectedSlug } })
    },
    [sendMessage, selectedSlug]
  )

  const handleHandoffClick = useCallback(
    (item: { agentSlug: string; text: string }) => {
      setSelectedSlug(item.agentSlug)
      sendMessage({ text: item.text }, { body: { agentSlug: item.agentSlug } })
    },
    [sendMessage]
  )

  const isStreaming = status === "streaming" || status === "submitted"

  const lastUserMessage = messages.filter((m) => m.role === "user").pop()
  const lastTextPart = lastUserMessage?.parts?.find((p) => p.type === "text") as
    | { type: "text"; text: string }
    | undefined
  const openInChatQuery = lastTextPart?.text?.trim() || DEFAULT_QUERY

  const currentAgent = agents.find((a) => a.slug === selectedSlug) ?? agents[0]

  return (
    <MainGlassCard
      className={cn(
        "flex flex-col overflow-hidden p-0",
        className
      )}
    >
      <div className="border-b border-border/50">
        <div className="flex items-center gap-2 px-4 py-3">
          <MessageSquare className="h-5 w-5 shrink-0 text-muted-foreground" />
          <span className="font-semibold text-foreground">Meet the MNKYs</span>
        </div>
        {agents.length > 1 && (
          <div className="flex gap-0 border-t border-border/30">
            {agents.map((agent) => (
              <button
                key={agent.slug}
                type="button"
                onClick={() => setSelectedSlug(agent.slug)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 px-3 py-2 text-xs font-medium transition-colors",
                  selectedSlug === agent.slug
                    ? "border-b-2 border-foreground bg-muted/30 text-foreground"
                    : "text-muted-foreground hover:bg-muted/20 hover:text-foreground"
                )}
              >
                <span className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full border border-border bg-muted">
                  <Image
                    src={agent.imagePath}
                    alt=""
                    width={24}
                    height={24}
                    className="object-cover"
                  />
                </span>
                <span className="hidden truncate sm:inline">
                  {agent.displayName.replace(" MNKY", "")}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex min-h-[280px] flex-1 flex-col overflow-hidden">
        <Conversation className="min-h-0 flex-1">
          <ConversationContent className="min-h-full p-4">
            {messages.length === 0 && (
              <ConversationEmptyState
                title={`Ask ${currentAgent?.displayName ?? "MOOD MNKY"}`}
                description="Learn about our brand, the MNKY VERSE, fragrances, and more."
                icon={<MessageSquare className="h-8 w-8" />}
              >
                <Suggestions className="mt-4">
                  {SUGGESTIONS.map((s) => (
                    <Suggestion
                      key={s}
                      suggestion={s}
                      onClick={handleSuggestionClick}
                    />
                  ))}
                </Suggestions>
                {HANDOFF_SUGGESTIONS.length > 0 && agents.length > 1 && (
                  <p className="mt-4 text-xs text-muted-foreground">
                    Or hand off:
                  </p>
                )}
                {HANDOFF_SUGGESTIONS.length > 0 && agents.length > 1 && (
                  <Suggestions className="mt-2">
                    {HANDOFF_SUGGESTIONS.map((item) => (
                      <Suggestion
                        key={item.agentSlug}
                        suggestion={item.label}
                        onClick={() => handleHandoffClick(item)}
                      />
                    ))}
                  </Suggestions>
                )}
              </ConversationEmptyState>
            )}
            {isStreaming &&
              messages[messages.length - 1]?.role === "assistant" &&
              !(messages[messages.length - 1].parts?.some((p) => p.type === "text" && (p as { text: string }).text?.length > 0)) && (
                <div className="mb-4">
                  <ChainOfThought
                    steps={[
                      { id: "1", status: "complete", content: "Reading your question…" },
                      { id: "2", status: "active", content: "Generating response…" },
                    ]}
                    defaultOpen={true}
                  />
                </div>
              )}
            {messages.map((message, msgIndex) => (
              <Message key={message.id} from={message.role}>
                <MessageContent>
                  {message.parts?.map((part, i) => {
                    if (part.type === "text") {
                      const text = (part as { type: "text"; text: string }).text
                      const isLastAssistant =
                        msgIndex === messages.length - 1 &&
                        message.role === "assistant"
                      const useStreamingFade =
                        isStreaming && isLastAssistant
                      if (useStreamingFade && !text) {
                        return (
                          <div key={`${message.id}-${i}-shimmer`} className="py-1">
                            <Shimmer className="text-muted-foreground">
                              Thinking…
                            </Shimmer>
                          </div>
                        )
                      }
                      return (
                        <MessageResponse
                          key={`${message.id}-${i}`}
                          {...(useStreamingFade && {
                            mode: "streaming" as const,
                            parseIncompleteMarkdown: true,
                            BlockComponent: BlurFadeBlock,
                          })}
                        >
                          {text}
                        </MessageResponse>
                      )
                    }
                    return null
                  })}
                </MessageContent>
              </Message>
            ))}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
        {error && (
          <p className="px-4 py-2 text-sm text-destructive">{error.message}</p>
        )}
        <div className="shrink-0 border-t border-border/50 p-3">
          <PromptInput onSubmit={handleSubmit} className="w-full">
            <PromptInputTextarea
              placeholder={
                currentAgent
                  ? `Ask ${currentAgent.displayName}…`
                  : "Ask about MOOD MNKY, fragrances, MNKY VERSE..."
              }
              className="min-h-[44px] resize-none"
            />
            <PromptInputFooter>
              <PromptInputSubmit
                disabled={isStreaming}
                status={isStreaming ? "streaming" : "ready"}
              />
            </PromptInputFooter>
          </PromptInput>
          <div className="mt-2 flex items-center justify-between gap-2">
            <OpenInChat query={openInChatQuery} />
            <span className="text-xs text-muted-foreground">
              Powered by OpenAI
            </span>
          </div>
        </div>
      </div>
    </MainGlassCard>
  )
}
