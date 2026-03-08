// Chat message component with monkey avatar and temporary chat notification
'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Copy, Check, Volume2 } from 'lucide-react'
import { AppLogo } from '@/components/app-logo'
import type { SourceDocument } from '@/lib/types'
import {
  CodeBlock,
  CodeBlockHeader,
  CodeBlockTitle,
  CodeBlockActions,
  CodeBlockCopyButton,
  CodeBlockFilename,
} from '@/components/ai-elements/code-block'
import type { BundledLanguage } from 'shiki'
import {
  Sources,
  SourcesTrigger,
  SourcesContent,
  Source,
} from '@/components/ai-elements/sources'
import { Shimmer } from '@/components/ai-elements/shimmer'
import { Suggestions, Suggestion } from '@/components/ai-elements/suggestion'
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from '@/components/ai-elements/reasoning'
import {
  Attachments,
  Attachment,
  AttachmentPreview,
} from '@/components/ai-elements/attachments'
import type { AttachmentData } from '@/components/ai-elements/attachments'

export interface ChatMessageAttachment {
  id: string
  url: string
  filename: string
  mediaType: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
  sourceDocuments?: SourceDocument[]
  isStreaming?: boolean
  attachments?: ChatMessageAttachment[]
}

const DEFAULT_SUGGESTIONS = [
  'Summarize the last message',
  'Explain step by step',
  'What are the key points?',
  'Suggest follow-up questions',
]

interface ChatMessagesProps {
  messages: ChatMessage[]
  isStreaming: boolean
  tempChat?: boolean
  onSuggestionClick?: (text: string) => void
  suggestionPrompts?: string[]
  /** Phase 3 Checkpoint: restore conversation to this message (truncate after it) */
  onRestoreToMessage?: (messageId: string) => void
}

function copyToClipboard(text: string) {
  return navigator.clipboard.writeText(text).catch(() => {})
}

const LANG_MAP: Record<string, BundledLanguage> = {
  js: 'javascript',
  ts: 'typescript',
  tsx: 'tsx',
  jsx: 'jsx',
  py: 'python',
  sh: 'shell',
  bash: 'bash',
  json: 'json',
  md: 'markdown',
  html: 'html',
  css: 'css',
  sql: 'sql',
  yaml: 'yaml',
  yml: 'yaml',
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  shell: 'shell',
  markdown: 'markdown',
  text: 'text',
}

function toShikiLanguage(lang: string): BundledLanguage {
  const lower = lang.toLowerCase()
  return (LANG_MAP[lower] ?? 'text') as BundledLanguage
}

/** Phase 2: parse optional reasoning block from assistant content (convention: ```reasoning or <think>) */
function parseReasoningBlock(content: string): { reasoning: string | null; main: string } {
  const thinkMatch = content.match(/^<think>([\s\S]*?)<\/think>\s*([\s\S]*)$/m)
  if (thinkMatch) {
    return { reasoning: thinkMatch[1].trim(), main: thinkMatch[2].trim() }
  }
  const fenceMatch = content.match(/^```reasoning\s*\n([\s\S]*?)```\s*([\s\S]*)$/m)
  if (fenceMatch) {
    return { reasoning: fenceMatch[1].trim(), main: fenceMatch[2].trim() }
  }
  return { reasoning: null, main: content }
}

function renderMarkdown(text: string) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0
  let keyIdx = 0

  while (i < lines.length) {
    const line = lines[i]

    // Fenced code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      const code = codeLines.join('\n')
      const shikiLang = toShikiLanguage(lang || 'text')
      elements.push(
        <CodeBlock key={`md-${keyIdx++}`} code={code} language={shikiLang} className="my-3">
          <CodeBlockHeader>
            <CodeBlockTitle>
              <CodeBlockFilename>{lang || 'text'}</CodeBlockFilename>
            </CodeBlockTitle>
            <CodeBlockActions>
              <CodeBlockCopyButton />
            </CodeBlockActions>
          </CodeBlockHeader>
        </CodeBlock>
      )
      i++
      continue
    }

    // Headings
    const h3 = line.match(/^### (.+)/)
    const h2 = line.match(/^## (.+)/)
    const h1 = line.match(/^# (.+)/)
    if (h3) { elements.push(<h3 key={`md-${keyIdx++}`} className="text-base font-semibold mt-4 mb-1.5 text-foreground">{h3[1]}</h3>); i++; continue }
    if (h2) { elements.push(<h2 key={`md-${keyIdx++}`} className="text-lg font-semibold mt-5 mb-2 text-foreground">{h2[1]}</h2>); i++; continue }
    if (h1) { elements.push(<h1 key={`md-${keyIdx++}`} className="text-xl font-bold mt-5 mb-2 text-foreground">{h1[1]}</h1>); i++; continue }

    // Ordered list
    if (/^\d+\. /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ''))
        i++
      }
      elements.push(
        <ol key={`md-${keyIdx++}`} className="list-decimal list-inside space-y-1 my-2 text-foreground/90">
          {items.map((item, j) => <li key={j}>{inlineFormat(item)}</li>)}
        </ol>
      )
      continue
    }

    // Bullet list
    if (/^[-*] /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(lines[i].slice(2))
        i++
      }
      elements.push(
        <ul key={`md-${keyIdx++}`} className="list-disc list-inside space-y-1 my-2 text-foreground/90">
          {items.map((item, j) => <li key={j}>{inlineFormat(item)}</li>)}
        </ul>
      )
      continue
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      elements.push(<hr key={`md-${keyIdx++}`} className="my-4 border-border/50" />)
      i++; continue
    }

    // Empty line
    if (!line.trim()) { elements.push(<div key={`md-${keyIdx++}`} className="h-2" />); i++; continue }

    // Paragraph
    elements.push(
      <p key={`md-${keyIdx++}`} className="text-foreground/90 leading-relaxed mb-1">
        {inlineFormat(line)}
      </p>
    )
    i++
  }

  return <div className="space-y-0.5">{elements}</div>
}

function inlineFormat(text: string): React.ReactNode {
  // bold, inline code, links
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g)
  return parts.map((part, i) => {
    if (/^`[^`]+`$/.test(part)) return <code key={i} className="bg-muted px-1 py-0.5 rounded text-[0.8em] font-mono">{part.slice(1, -1)}</code>
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={i}>{part.slice(2, -2)}</strong>
    if (/^\*[^*]+\*$/.test(part)) return <em key={i}>{part.slice(1, -1)}</em>
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (link) return <a key={i} href={link[2]} target="_blank" rel="noopener noreferrer" className="text-foreground underline underline-offset-2">{link[1]}</a>
    return part
  })
}

function MessageSources({ docs }: { docs: SourceDocument[] }) {
  if (!docs.length) return null
  return (
    <Sources className="mt-3">
      <SourcesTrigger count={docs.length} />
      <SourcesContent>
        {docs.map((doc, i) => {
          const href = doc.metadata?.source && /^https?:\/\//i.test(String(doc.metadata.source))
            ? String(doc.metadata.source)
            : '#'
          const title = doc.metadata?.source ? String(doc.metadata.source) : 'Source'
          return (
            <Source key={i} href={href} title={title}>
              <span className="line-clamp-2 text-muted-foreground">{doc.pageContent}</span>
            </Source>
          )
        })}
      </SourcesContent>
    </Sources>
  )
}

function toAttachmentData(a: ChatMessageAttachment): AttachmentData {
  return {
    id: a.id,
    type: 'file',
    url: a.url,
    filename: a.filename,
    mediaType: a.mediaType,
  }
}

function ChatMessageItem({
  message,
  onRestoreToMessage,
}: {
  message: ChatMessage
  onRestoreToMessage?: (messageId: string) => void
}) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'

  return (
    <div className={cn('group flex gap-2 sm:gap-3 py-3 sm:py-5 px-2 sm:px-4 animate-fade-in', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 border border-border/50 rounded-full mt-0.5 overflow-hidden flex items-center justify-center bg-background text-foreground">
          <AppLogo className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      )}

      <div className={cn('flex flex-col gap-1 max-w-[90%] sm:max-w-[88%] md:max-w-[80%]', isUser && 'items-end')}>
        <div
          className={cn(
            'rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3',
            isUser
              ? 'bg-foreground text-background rounded-br-sm text-sm leading-relaxed whitespace-pre-wrap'
              : 'glass border border-border/40 rounded-bl-sm'
          )}
        >
          {isUser ? (
            <>
              {message.content ? <span className="whitespace-pre-wrap">{message.content}</span> : null}
              {message.attachments && message.attachments.length > 0 && (
                <Attachments variant="grid" className={cn('flex-wrap gap-2 mt-2', message.content ? 'mt-3' : '')}>
                  {message.attachments.map((a) => (
                    <Attachment key={a.id} data={toAttachmentData(a)}>
                      <AttachmentPreview />
                    </Attachment>
                  ))}
                </Attachments>
              )}
            </>
          ) : (
            <>
              {message.isStreaming && !message.content ? (
                <Shimmer
                  className="text-sm text-muted-foreground"
                  duration={2.2}
                  spread={5}
                  sweepColor="rgba(255,255,255,0.7)"
                >
                  Thinking...
                </Shimmer>
              ) : (() => {
                const { reasoning, main } = parseReasoningBlock(message.content)
                const contentNode = (
                  <>
                    {reasoning != null && reasoning !== '' && (
                      <Reasoning isStreaming={false} defaultOpen={false} className="mb-3">
                        <ReasoningTrigger />
                        <ReasoningContent>{reasoning}</ReasoningContent>
                      </Reasoning>
                    )}
                    {main ? renderMarkdown(main) : reasoning == null ? renderMarkdown(message.content) : null}
                  </>
                )
                /* Blur in gently when streamed content first appears (key forces mount so animation runs once) */
                const hasContent = Boolean(message.content)
                if (message.isStreaming && hasContent) {
                  return (
                    <div
                      key={`${message.id}-${hasContent ? 'live' : 'wait'}`}
                      className="animate-stream-in"
                    >
                      {contentNode}
                    </div>
                  )
                }
                return contentNode
              })()}
              {message.sourceDocuments && !message.isStreaming && (
                <MessageSources docs={message.sourceDocuments} />
              )}
            </>
          )}
        </div>

        {!isUser && message.content && !message.isStreaming && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onRestoreToMessage && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => onRestoreToMessage(message.id)}
              >
                Restore to here
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => { copyToClipboard(message.content); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => {
                if ('speechSynthesis' in window) {
                  window.speechSynthesis.cancel()
                  window.speechSynthesis.speak(new SpeechSynthesisUtterance(message.content))
                }
              }}
            >
              <Volume2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      {isUser && (
        <Avatar className="w-7 h-7 sm:w-8 sm:h-8 shrink-0 border border-border/50 mt-0.5">
          <AvatarFallback className="bg-muted text-muted-foreground text-xs">U</AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}

export function ChatMessages({
  messages,
  isStreaming,
  tempChat,
  onSuggestionClick,
  suggestionPrompts = DEFAULT_SUGGESTIONS,
  onRestoreToMessage,
}: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastMessage = messages[messages.length - 1]
  const showSuggestionsAfterReply = lastMessage?.role === 'assistant' && !isStreaming && onSuggestionClick

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-14 h-14 rounded-2xl bg-foreground/8 border border-border/40 flex items-center justify-center mb-5 text-foreground/40">
          <AppLogo className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-semibold text-foreground mb-2 text-balance text-center">
          How can I help you today?
        </h2>
        <p className="text-muted-foreground text-center max-w-sm text-sm text-balance leading-relaxed mb-6">
          Select a chatflow from the sidebar and start a conversation. Your messages are routed through your Flowise instance.
        </p>
        {onSuggestionClick && suggestionPrompts.length > 0 && (
          <Suggestions className="w-full max-w-2xl justify-center mx-auto">
            {suggestionPrompts.map((s) => (
              <Suggestion key={s} suggestion={s} onClick={onSuggestionClick} />
            ))}
          </Suggestions>
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Temporary chat banner */}
      {tempChat && (
        <div className="shrink-0 px-4 py-2.5 bg-muted/60 border-b border-border/50 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500/60" />
          <p className="text-xs text-muted-foreground font-medium">
            Temporary chat active · This conversation will not be saved
          </p>
        </div>
      )}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-4xl mx-auto">
          {messages.map(m => (
            <ChatMessageItem
              key={m.id}
              message={m}
              onRestoreToMessage={onRestoreToMessage}
            />
          ))}
          {showSuggestionsAfterReply && (
            <div className="px-2 sm:px-4 py-3 flex justify-center">
              <Suggestions className="w-full mx-auto justify-center">
                {suggestionPrompts.map((s) => (
                  <Suggestion key={s} suggestion={s} onClick={onSuggestionClick} />
                ))}
              </Suggestions>
            </div>
          )}
          <div ref={bottomRef} className="h-4" />
        </div>
      </div>
    </div>
  )
}
