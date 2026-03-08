'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Send,
  Paperclip,
  Loader2,
  Wrench,
  Globe,
  Brain,
  Code2,
  Search,
  Database,
  Plug,
  Bot,
  Lock,
} from 'lucide-react'
import {
  Attachments,
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
} from '@/components/ai-elements/attachments'
import type { AttachmentData } from '@/components/ai-elements/attachments'
import { SpeechInput } from '@/components/ai-elements/speech-input'

// ── Tool definitions ──────────────────────────────────────────────────────────
interface ToolDef {
  id: string
  name: string
  description: string
  icon: React.ElementType
  requiresAuth: boolean
  enabled: boolean
  category: 'default' | 'integration'
}

const TOOLS: ToolDef[] = [
  // No-auth defaults
  { id: 'web-search',   name: 'Web Search',     description: 'Search the web for up-to-date information',              icon: Globe,    requiresAuth: false, enabled: true,  category: 'default' },
  { id: 'code-exec',    name: 'Code Interpreter',description: 'Run and debug code in a sandbox',                         icon: Code2,    requiresAuth: false, enabled: true,  category: 'default' },
  { id: 'doc-search',   name: 'Document Search', description: 'Semantic search across uploaded documents',               icon: Search,   requiresAuth: false, enabled: false, category: 'default' },
  { id: 'memory',       name: 'Memory',           description: 'Persist context across sessions using MCP Memory',       icon: Brain,    requiresAuth: false, enabled: true,  category: 'default' },
  // Auth-required integrations
  { id: 'google-drive', name: 'Google Drive',     description: 'Read and write files in Google Drive',                   icon: Database, requiresAuth: true,  enabled: false, category: 'integration' },
  { id: 'mcp-server',   name: 'MCP Server',       description: 'Connect to your custom MCP server endpoints',            icon: Plug,     requiresAuth: true,  enabled: false, category: 'integration' },
  { id: 'flowise-agent',name: 'Flowise Agent',    description: 'Invoke additional Flowise agent tools inside responses', icon: Bot,      requiresAuth: false, enabled: true,  category: 'integration' },
]

// ── Sub-component: tool row ───────────────────────────────────────────────────
function ToolRow({
  tool,
  onToggle,
}: {
  tool: ToolDef
  onToggle: (id: string, enabled: boolean) => void
}) {
  const Icon = tool.icon
  const canToggle = !tool.requiresAuth || tool.enabled

  return (
    <div className={cn('flex items-start gap-3 px-3 py-2.5 rounded-xl transition-all', tool.enabled ? 'bg-accent/40' : 'hover:bg-accent/20')}>
      <div className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-all',
        tool.enabled ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'
      )}>
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium">{tool.name}</span>
          {tool.requiresAuth && !tool.enabled && (
            <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground/70">
              <Lock className="w-2.5 h-2.5" /> Auth required
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground/70 mt-0.5 leading-snug">{tool.description}</p>
      </div>

      {/* Toggle */}
      <button
        onClick={() => {
          if (tool.requiresAuth && !tool.enabled) {
            // In production: redirect to auth flow
            alert(`Authenticate to enable ${tool.name}`)
            return
          }
          onToggle(tool.id, !tool.enabled)
        }}
        className={cn(
          'relative w-9 h-5 rounded-full shrink-0 mt-1.5 transition-all duration-200 focus-visible:outline-none',
          tool.enabled ? 'bg-foreground' : 'bg-muted border border-border/50'
        )}
        aria-label={tool.enabled ? `Disable ${tool.name}` : `Enable ${tool.name}`}
        role="switch"
        aria-checked={tool.enabled}
      >
        <span
          className={cn(
            'absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200',
            tool.enabled ? 'left-[18px] bg-background' : 'left-0.5 bg-muted-foreground/60'
          )}
        />
      </button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
interface ChatInputProps {
  onSubmit: (text: string, files?: File[]) => void
  isLoading: boolean
  disabled?: boolean
  placeholder?: string
}

interface AttachedFile {
  id: string
  file: File
  objectUrl: string
}

function toAttachmentData(af: AttachedFile): AttachmentData {
  return {
    id: af.id,
    type: 'file',
    url: af.objectUrl,
    filename: af.file.name,
    mediaType: af.file.type,
  }
}

export function ChatInput({ onSubmit, isLoading, disabled, placeholder }: ChatInputProps) {
  const [value, setValue] = useState('')
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [tools, setTools] = useState<ToolDef[]>(TOOLS)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const enabledCount = tools.filter(t => t.enabled).length

  const toggleTool = useCallback((id: string, enabled: boolean) => {
    setTools(prev => prev.map(t => t.id === id ? { ...t, enabled } : t))
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() }
  }

  const handleSubmit = useCallback(() => {
    const hasText = value.trim().length > 0
    const hasFiles = attachedFiles.length > 0
    if ((!hasText && !hasFiles) || isLoading || disabled) return
    onSubmit(hasText ? value : '', attachedFiles.map(af => af.file))
    attachedFiles.forEach(af => URL.revokeObjectURL(af.objectUrl))
    setValue('')
    setAttachedFiles([])
  }, [value, isLoading, disabled, onSubmit, attachedFiles])

  const addFiles = useCallback((files: FileList | File[] | null) => {
    if (!files) return
    const newEntries: AttachedFile[] = Array.from(files).map(f => ({
      id: crypto.randomUUID(),
      file: f,
      objectUrl: URL.createObjectURL(f),
    }))
    setAttachedFiles(prev => [...prev, ...newEntries])
  }, [])

  const removeFile = useCallback((id: string) => {
    setAttachedFiles(prev => {
      const item = prev.find(f => f.id === id)
      if (item) URL.revokeObjectURL(item.objectUrl)
      return prev.filter(f => f.id !== id)
    })
  }, [])

  useEffect(() => {
    return () => {
      attachedFiles.forEach(af => URL.revokeObjectURL(af.objectUrl))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- revoke on unmount only

  const handleTranscriptionChange = useCallback((text: string) => {
    setValue(prev => (prev ? `${prev} ${text}` : text))
    textareaRef.current?.focus()
  }, [])

  const defaultTools = tools.filter(t => t.category === 'default')
  const integrationTools = tools.filter(t => t.category === 'integration')

  return (
    <div className="px-2 sm:px-4 pb-4 pt-2 shrink-0 safe-area-bottom">
      <div className="max-w-4xl mx-auto">

        {/* Attached files - Elements Attachments (grid for larger image previews) */}
        {attachedFiles.length > 0 && (
          <Attachments variant="grid" className="mb-3 flex-wrap gap-3">
            {attachedFiles.map(af => (
              <Attachment
                key={af.id}
                data={toAttachmentData(af)}
                onRemove={() => removeFile(af.id)}
              >
                <AttachmentPreview />
                <AttachmentRemove />
              </Attachment>
            ))}
          </Attachments>
        )}

        {/* Input box */}
        <div
          className={cn(
            'relative glass-strong rounded-2xl border transition-all duration-200',
            isDragging ? 'border-foreground/40 scale-[1.005]' : 'border-border/50',
            'focus-within:border-foreground/25 focus-within:shadow-lg'
          )}
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={e => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files) }}
        >
          {isDragging && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-2xl z-10">
              <div className="flex items-center gap-2 text-foreground">
                <Paperclip className="w-5 h-5" />
                <span className="text-sm font-medium">Drop to attach</span>
              </div>
            </div>
          )}

          <Textarea
            ref={textareaRef}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder ?? 'Message AI…'}
            disabled={disabled || isLoading}
            className="min-h-[56px] max-h-[200px] resize-none border-0 bg-transparent px-4 pt-3.5 pb-14 text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 scrollbar-thin"
            rows={1}
          />

          {/* Bottom toolbar */}
          <div className="absolute bottom-1.5 sm:bottom-2 left-1.5 sm:left-2 right-1.5 sm:right-2 flex items-center justify-between">
            <TooltipProvider delayDuration={300}>
              <div className="flex items-center gap-0">

                {/* Attach */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost" size="icon"
                      className="h-10 w-10 sm:h-9 sm:w-9 text-muted-foreground hover:text-foreground hover:bg-accent/50 touch-target"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={disabled || isLoading}
                    >
                      <Paperclip className="w-5 h-5 sm:w-4 sm:h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="glass-strong border-border/50 hidden sm:block">Attach file</TooltipContent>
                </Tooltip>

                {/* Tools popover */}
                <Popover open={toolsOpen} onOpenChange={setToolsOpen}>
                  <PopoverTrigger asChild>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost" size="icon"
                          className={cn(
                            'h-10 w-10 sm:h-9 sm:w-9 relative transition-all touch-target',
                            toolsOpen
                              ? 'bg-foreground text-background hover:bg-foreground/90'
                              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                          )}
                          disabled={disabled || isLoading}
                          aria-label="Tools"
                        >
                          <Wrench className="w-5 h-5 sm:w-4 sm:h-4" />
                          {enabledCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-foreground text-background text-[9px] font-bold flex items-center justify-center border-2 border-background leading-none">
                              {enabledCount}
                            </span>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="glass-strong border-border/50 hidden sm:block">
                        Tools &amp; integrations
                      </TooltipContent>
                    </Tooltip>
                  </PopoverTrigger>

                  <PopoverContent
                    side="top"
                    align="start"
                    sideOffset={10}
                    className="w-80 p-0 border-border/50 shadow-xl"
                  >
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-border/40">
                      <p className="text-sm font-semibold flex items-center gap-2">
                        <Wrench className="w-3.5 h-3.5 text-muted-foreground" />
                        Tools
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Toggle which tools the agent can use. Auth-required tools need you to connect an integration first.
                      </p>
                    </div>

                    <div className="p-2 max-h-[60vh] overflow-y-auto scrollbar-thin space-y-1">
                      {/* Default tools */}
                      <p className="px-3 py-1.5 text-[11px] text-muted-foreground/50 uppercase tracking-wider font-medium">
                        Built-in
                      </p>
                      {defaultTools.map(t => (
                        <ToolRow key={t.id} tool={t} onToggle={toggleTool} />
                      ))}

                      {/* Integration tools */}
                      <p className="px-3 pt-3 pb-1.5 text-[11px] text-muted-foreground/50 uppercase tracking-wider font-medium">
                        Integrations
                      </p>
                      {integrationTools.map(t => (
                        <ToolRow key={t.id} tool={t} onToggle={toggleTool} />
                      ))}
                    </div>

                    <div className="px-4 py-2.5 border-t border-border/40 bg-muted/20 rounded-b-lg">
                      <p className="text-[11px] text-muted-foreground/60">
                        {enabledCount} tool{enabledCount !== 1 ? 's' : ''} active · Tools are passed to Flowise as overrides
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </TooltipProvider>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt,.md,.csv"
              onChange={e => addFiles(e.target.files)}
            />

            {/* Send + mic (right of send) */}
            <div className="flex items-center gap-0">
              <Button
                onClick={handleSubmit}
                disabled={(!value.trim() && attachedFiles.length === 0) || isLoading || disabled}
                size="icon"
                className={cn(
                  'h-10 w-10 sm:h-9 sm:w-9 rounded-xl transition-all touch-target',
(value.trim() || attachedFiles.length > 0) && !isLoading && !disabled
                  ? 'bg-foreground text-background hover:bg-foreground/90'
                  : 'bg-muted text-muted-foreground'
                )}
              >
                {isLoading ? <Loader2 className="w-5 h-5 sm:w-4 sm:h-4 animate-spin" /> : <Send className="w-5 h-5 sm:w-4 sm:h-4" />}
              </Button>
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <SpeechInput
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 sm:h-9 sm:w-9 text-muted-foreground hover:text-foreground hover:bg-accent/50 touch-target"
                        onTranscriptionChange={handleTranscriptionChange}
                        disabled={disabled || isLoading}
                        aria-label="Voice input"
                      />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="glass-strong border-border/50 hidden sm:block">
                    Voice input
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground/50 text-center mt-2">
          Responses are generated by your Flowise instance. Verify important information.
        </p>
      </div>
    </div>
  )
}
