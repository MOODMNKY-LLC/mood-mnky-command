'use client'

import React, { useState, useMemo, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Plus,
  Trash2,
  Settings,
  X,
  Bot,
  Pencil,
  Search,
  MoreHorizontal,
  Archive,
  Share2,
  Pin,
  Download,
  ImageIcon,
  ChevronDown,
  User,
  LogOut,
  ExternalLink,
  Folder,
  FolderOpen,
  Plug,
  Users,
  Users2,
  MessageSquare,
  PanelLeftClose,
  SquarePen,
  Copy,
  Check,
  FileText,
  Paperclip,
  Palette,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { ChatSession } from '@/lib/types'
import { useCurrentUser } from '@/hooks/use-current-user'
import { RealtimeAvatarStack } from '@/components/realtime-avatar-stack'
import { AppLogo } from '@/components/app-logo'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Chatflow {
  id: string
  name: string
  description?: string
}

interface Project {
  id: string
  name: string
  icon: string
  color: string
  instructions: string
  chatCount: number
  fileCount: number
}

interface MockImage {
  id: string
  alt: string
  url: string | null
  prompt: string
  size?: string
  createdAt?: string
}

export interface ChatSidebarProps {
  sessions: ChatSession[]
  currentSessionId: string | null
  onSelectSession: (id: string) => void
  onNewChat: () => void
  onDeleteSession: (id: string) => void
  onRenameSession: (id: string, title: string) => void
  onPinSession?: (id: string, pinned: boolean) => void
  onArchiveSession?: (id: string) => void
  chatflows: Chatflow[]
  selectedChatflowId: string
  onSelectChatflow: (id: string) => void
  isOpen: boolean
  onClose: () => void
  connectionStatus: 'unknown' | 'healthy' | 'error'
  isAdmin?: boolean
  onNavigateImages?: () => void
}

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_INTEGRATIONS = [
  { id: 'int-1', name: 'Flowise Agent Tools', icon: Bot, color: 'oklch(0.55 0.18 200)', requiresAuth: false, enabled: true },
  { id: 'int-2', name: 'MCP Memory Server',   icon: Plug, color: 'oklch(0.5 0.15 260)',  requiresAuth: true,  enabled: false },
  { id: 'int-3', name: 'Google Drive MCP',    icon: Folder, color: 'oklch(0.55 0.17 145)', requiresAuth: true, enabled: false },
]

const MOCK_GROUP_CHATS = [
  { id: 'gc-1', name: 'Shared Chat Introduction', members: ['MP', 'KW'], memberColors: ['oklch(0.55 0.2 320)', 'oklch(0.5 0.22 30)'] },
  { id: 'gc-2', name: 'Product Roadmap',           members: ['JD', 'AL'], memberColors: ['oklch(0.45 0.18 200)', 'oklch(0.55 0.15 150)'] },
]

const MOCK_IMAGES: MockImage[] = [
  { id: 'i1', alt: 'Architecture diagram',    url: null, prompt: 'System architecture diagram',  size: '1024×1024', createdAt: '2025-03-07' },
  { id: 'i2', alt: 'Onboarding flow',          url: null, prompt: 'User onboarding flow chart',   size: '1024×768',  createdAt: '2025-03-06' },
  { id: 'i3', alt: 'Sales funnel metrics',     url: null, prompt: 'Sales funnel metrics chart',   size: '1280×720',  createdAt: '2025-03-05' },
  { id: 'i4', alt: 'Landing page mockup',      url: null, prompt: 'Landing page mockup',          size: '1440×900',  createdAt: '2025-03-04' },
  { id: 'i5', alt: 'Brand identity concepts',  url: null, prompt: 'Brand identity concepts',      size: '1024×1024', createdAt: '2025-03-03' },
  { id: 'i6', alt: 'Dashboard wireframe',      url: null, prompt: 'Dashboard wireframe',          size: '1280×800',  createdAt: '2025-03-02' },
]

const PROJECT_COLORS = [
  'oklch(0.55 0.18 200)', 'oklch(0.55 0.18 145)', 'oklch(0.55 0.18 30)',
  'oklch(0.55 0.18 320)', 'oklch(0.55 0.18 260)', 'oklch(0.55 0.18 60)',
]
const PROJECT_ICONS = ['folder', 'star', 'heart', 'code', 'book', 'brain']

// ── Marquee subtext ────────────────────────────────────────────────────────────
const MARQUEE_ITEMS = [
  'Powered by Flowise',
  'Multi-agent orchestration',
  'RAG · Knowledge bases',
  'MCP tool integrations',
  'Realtime collaboration',
  'Document intelligence',
  'Custom AI workflows',
  'Semantic search',
]

function SidebarMarquee() {
  // Duplicate items so the loop is seamless
  const items = [...MARQUEE_ITEMS, ...MARQUEE_ITEMS]
  return (
    <div className="marquee-container w-full">
      <div className="animate-marquee">
        {items.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground/40 whitespace-nowrap pr-6"
          >
            <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/30 shrink-0" />
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}
function SidebarSection({
  label,
  icon: Icon,
  defaultOpen = false,
  trailing,
  children,
}: {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  defaultOpen?: boolean
  trailing?: React.ReactNode
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-0.5 rounded-lg hover:bg-sidebar-accent/60 transition-all duration-100 pr-0.5 mt-0.5">
        <CollapsibleTrigger className="flex items-center gap-3 flex-1 px-2 py-2.5 text-sm text-sidebar-foreground/80 hover:text-sidebar-foreground text-left min-w-0">
          {Icon ? <Icon className="w-4 h-4 shrink-0" /> : null}
          <span className="truncate">{label}</span>
        </CollapsibleTrigger>
        {trailing}
        <CollapsibleTrigger
          className="p-1.5 rounded-md text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0"
          aria-label={open ? 'Collapse' : 'Expand'}
        >
          <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', open && 'rotate-180')} />
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  )
}

// ── Images fullscreen gallery dialog ─────────────────────────────────────────
function ImageGalleryDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState<string | null>(null)

  const copyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const downloadImage = (img: MockImage) => {
    const a = document.createElement('a')
    a.href = img.url ?? '#'
    a.download = `${img.alt.replace(/\s+/g, '-')}.png`
    a.click()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-5xl w-full h-[85vh] flex flex-col p-0 gap-0 border-border/50">
        <DialogHeader className="px-6 py-4 border-b border-border/40 shrink-0">
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-muted-foreground" />
            Image Gallery
            <span className="text-xs font-normal text-muted-foreground ml-1">
              {MOCK_IMAGES.length} images
            </span>
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {MOCK_IMAGES.map(img => (
              <div key={img.id} className="group relative flex flex-col gap-2">
                {/* Thumbnail */}
                <div className="relative aspect-square rounded-xl overflow-hidden bg-muted/40 border border-border/30 hover:border-border/70 transition-all">
                  {img.url
                    ? <img src={img.url} alt={img.alt} className="object-cover w-full h-full" />
                    : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                        <ImageIcon className="w-8 h-8 text-muted-foreground/20" />
                        <span className="text-[10px] text-muted-foreground/40 text-center px-2 leading-tight">{img.prompt}</span>
                      </div>
                    )
                  }
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => copyUrl(img.id, img.url ?? `https://example.com/images/${img.id}.png`)}
                      className="p-2 rounded-lg bg-background border border-border/50 hover:bg-accent transition-all"
                      title="Copy public URL"
                    >
                      {copied === img.id
                        ? <Check className="w-3.5 h-3.5 text-green-500" />
                        : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => downloadImage(img)}
                      className="p-2 rounded-lg bg-background border border-border/50 hover:bg-accent transition-all"
                      title="Download image"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {/* Metadata */}
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{img.alt}</p>
                  <p className="text-[10px] text-muted-foreground/60 truncate">{img.prompt}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {img.size && <span className="text-[10px] text-muted-foreground/50">{img.size}</span>}
                    {img.createdAt && <span className="text-[10px] text-muted-foreground/40">{img.createdAt}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Inline thumbnail strip ────────────────────────────────────────────────────
function ImageThumbnailStrip({ onViewAll }: { onViewAll: () => void }) {
  return (
    <div className="mt-1 px-2 pb-1">
      <div className="grid grid-cols-3 gap-1.5">
        {MOCK_IMAGES.slice(0, 6).map(img => (
          <button
            key={img.id}
            onClick={onViewAll}
            className="group/thumb relative aspect-square rounded-lg overflow-hidden bg-muted/40 border border-border/20 flex items-center justify-center hover:border-border/60 transition-all"
            title={img.prompt}
          >
            {img.url
              ? <img src={img.url} alt={img.alt} className="object-cover w-full h-full" />
              : <ImageIcon className="w-3.5 h-3.5 text-muted-foreground/25" />
            }
          </button>
        ))}
      </div>
      <button
        onClick={onViewAll}
        className="mt-2 w-full text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors text-center py-0.5"
      >
        View all {MOCK_IMAGES.length} images
      </button>
    </div>
  )
}

// ── New project multistep dialog ──────────────────────────────────────────────
interface NewProjectDialogProps {
  open: boolean
  onClose: () => void
  onCreate: (project: Omit<Project, 'id' | 'chatCount' | 'fileCount'>) => void
}

function NewProjectDialog({ open, onClose, onCreate }: NewProjectDialogProps) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [selectedColor, setSelectedColor] = useState(PROJECT_COLORS[0])
  const [selectedIcon, setSelectedIcon] = useState(PROJECT_ICONS[0])
  const [instructions, setInstructions] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setStep(1); setName(''); setSelectedColor(PROJECT_COLORS[0])
    setSelectedIcon(PROJECT_ICONS[0]); setInstructions(''); setFiles([])
  }

  const handleClose = () => { reset(); onClose() }

  const handleCreate = () => {
    onCreate({ name: name.trim() || 'Untitled Project', icon: selectedIcon, color: selectedColor, instructions })
    handleClose()
  }

  const TOTAL_STEPS = 3

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-md w-full p-0 gap-0 border-border/50">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40">
          <DialogTitle className="text-base font-semibold">
            {step === 1 && 'Name your project'}
            {step === 2 && 'Set custom instructions'}
            {step === 3 && 'Upload files (optional)'}
          </DialogTitle>
          {/* Step indicator */}
          <div className="flex items-center gap-1.5 mt-3">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'h-1 flex-1 rounded-full transition-all',
                  i < step ? 'bg-foreground' : 'bg-muted'
                )}
              />
            ))}
          </div>
        </DialogHeader>

        <div className="px-6 py-5 min-h-[220px]">
          {/* Step 1: Name + color + icon */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Project name</Label>
                <Input
                  autoFocus
                  placeholder="e.g. Customer Support Bot"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && name.trim() && setStep(2)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5" /> Color
                </Label>
                <div className="flex items-center gap-2">
                  {PROJECT_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={cn('w-7 h-7 rounded-full transition-all border-2', selectedColor === c ? 'border-foreground scale-110' : 'border-transparent')}
                      style={{ background: c }}
                      aria-label={`Color ${c}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Custom instructions */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Instructions guide every chat in this project. Set a role, tone, or constraints. These override your global instructions for this project.
              </p>
              <Textarea
                autoFocus
                placeholder="e.g. You are a customer support specialist for MOODMNKY. Always respond professionally and concisely. Escalate unresolved issues to a human agent."
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                className="min-h-[120px] text-sm resize-none"
              />
              <p className="text-[11px] text-muted-foreground/50">
                {instructions.length} / 2000 characters
              </p>
            </div>
          )}

          {/* Step 3: File upload */}
          {step === 3 && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Upload reference files that all chats in this project can access. PDFs, docs, spreadsheets, and images are supported.
              </p>
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-border/50 rounded-xl p-6 text-center cursor-pointer hover:border-border/80 hover:bg-accent/20 transition-all"
              >
                <Paperclip className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Click to upload files</p>
                <p className="text-xs text-muted-foreground/50 mt-1">PDF, DOCX, TXT, MD, CSV, images</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                multiple
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.md,.csv,image/*"
                onChange={e => setFiles(Array.from(e.target.files ?? []))}
              />
              {files.length > 0 && (
                <div className="space-y-1.5">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span className="flex-1 truncate">{f.name}</span>
                      <button onClick={() => setFiles(fs => fs.filter((_, j) => j !== i))}>
                        <X className="w-3 h-3 hover:text-foreground" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="px-6 pb-5 pt-2 flex items-center justify-between border-t border-border/40">
          <Button variant="ghost" size="sm" onClick={step === 1 ? handleClose : () => setStep(s => s - 1)} className="text-sm">
            {step === 1 ? 'Cancel' : 'Back'}
          </Button>
          <div className="flex items-center gap-2">
            {step < TOTAL_STEPS && (
              <Button variant="ghost" size="sm" onClick={() => setStep(s => s + 1)} className="text-sm text-muted-foreground">
                Skip
              </Button>
            )}
            <Button
              size="sm"
              onClick={step < TOTAL_STEPS ? () => setStep(s => s + 1) : handleCreate}
              disabled={step === 1 && !name.trim()}
              className="text-sm"
            >
              {step < TOTAL_STEPS ? 'Continue' : 'Create project'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Chat item with full CRUD ──────────────────────────────────────────────────
function ChatItem({
  session, isActive, onSelect, onDelete, onRename, onPin, onArchive,
}: {
  session: ChatSession
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
  onRename: (title: string) => void
  onPin?: (pinned: boolean) => void
  onArchive?: () => void
}) {
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(session.title)
  const [pinned, setPinned] = useState(!!session.isPinned)
  const inputRef = useRef<HTMLInputElement>(null)

  const commitRename = useCallback(() => {
    if (renameValue.trim()) onRename(renameValue.trim())
    setIsRenaming(false)
  }, [renameValue, onRename])

  const handleDownload = useCallback(() => {
    const blob = new Blob([`# ${session.title}\n\nExported on ${new Date().toISOString()}`], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${session.title.replace(/\s+/g, '-')}.md`; a.click()
    URL.revokeObjectURL(url)
  }, [session.title])

  const handlePin = () => {
    const next = !pinned
    setPinned(next)
    onPin?.(next)
  }

  return (
    <div
      className={cn(
        'group/item relative flex items-center gap-1.5 px-2 py-[7px] rounded-lg cursor-pointer transition-all duration-100 select-none',
        'hover:bg-sidebar-accent/60',
        isActive && 'bg-sidebar-accent text-sidebar-accent-foreground'
      )}
      onClick={() => { if (!isRenaming) onSelect() }}
    >
      {isRenaming ? (
        <input
          ref={inputRef}
          autoFocus
          className="flex-1 min-w-0 bg-transparent text-sm outline-none border-b border-border/60 pb-px"
          value={renameValue}
          onChange={e => setRenameValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setIsRenaming(false) }}
          onBlur={commitRename}
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <span className="flex-1 min-w-0 truncate text-sm">{session.title}</span>
      )}

      {!isRenaming && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost" size="icon"
              className="h-6 w-6 opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0 hover:bg-sidebar-accent"
              onClick={e => e.stopPropagation()}
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 text-sm">
            <DropdownMenuItem onClick={() => { setRenameValue(session.title); setIsRenaming(true) }}>
              <Pencil className="w-3.5 h-3.5 mr-2" /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handlePin}>
              <Pin className="w-3.5 h-3.5 mr-2" /> {pinned ? 'Unpin' : 'Pin'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Share2 className="w-3.5 h-3.5 mr-2" /> Share
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownload}>
              <Download className="w-3.5 h-3.5 mr-2" /> Download
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { onArchive?.() }}>
              <Archive className="w-3.5 h-3.5 mr-2" /> Archive
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={e => { e.stopPropagation(); onDelete() }}
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

// ── User profile footer ───────────────────────────────────────────────────────
function UserProfileFooter({ isAdmin }: { isAdmin?: boolean }) {
  const { name, email, avatarUrl } = useCurrentUser()

  const displayName = name?.trim() || email || 'Signed in'
  const initials = displayName
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || (email ? email.slice(0, 2).toUpperCase() : '?')

  const handleSignOut = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client')
      await createClient().auth.signOut()
      window.location.href = '/auth/login'
    } catch {
      window.location.href = '/auth/login'
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'w-full flex items-center gap-3 px-2 py-2.5 rounded-xl transition-all duration-150 text-left',
            'hover:bg-sidebar-accent/60 focus:outline-none focus:bg-sidebar-accent/60'
          )}
        >
          <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center shrink-0 overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-background text-xs font-semibold leading-none">{initials}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium truncate block">{displayName}</span>
            {email && (
              <span className="text-[11px] text-muted-foreground truncate block">{email}</span>
            )}
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" sideOffset={8} className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium truncate">{displayName}</p>
          {email && <p className="text-xs text-muted-foreground truncate">{email}</p>}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2">
          <User className="w-4 h-4" /> Profile
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2">
          <Settings className="w-4 h-4" /> Settings
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2" onSelect={() => window.open('/admin', '_blank')}>
              <ExternalLink className="w-4 h-4" /> Admin Console
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onSelect={handleSignOut}>
          <LogOut className="w-4 h-4" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ── Main sidebar ──────────────────────────────────────────────────────────────
export function ChatSidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  onPinSession,
  onArchiveSession,
  isOpen,
  onClose,
  connectionStatus,
  isAdmin,
  onNavigateImages,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sessionToDelete, setSessionToDelete] = useState<ChatSession | null>(null)
  const [imagesExpanded, setImagesExpanded] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [newProjectOpen, setNewProjectOpen] = useState(false)
  const [projects, setProjects] = useState<Project[]>([
    { id: 'p1', name: 'Customer Support Bot',    icon: 'folder', color: PROJECT_COLORS[0], instructions: '', chatCount: 12, fileCount: 3 },
    { id: 'p2', name: 'Internal Knowledge Base', icon: 'book',   color: PROJECT_COLORS[4], instructions: '', chatCount: 5,  fileCount: 8 },
    { id: 'p3', name: 'Sales Assistant',         icon: 'star',   color: PROJECT_COLORS[2], instructions: '', chatCount: 8,  fileCount: 1 },
  ])

  const statusDot = {
    unknown: 'bg-muted-foreground/50 animate-pulse',
    healthy: 'bg-green-500',
    error:   'bg-destructive',
  }[connectionStatus]

  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions
    const q = searchQuery.toLowerCase()
    return sessions.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.chatflowName?.toLowerCase().includes(q)
    )
  }, [sessions, searchQuery])

  const { pinnedSessions, todaySessions, weekSessions, olderSessions } = useMemo(() => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart  = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000)
    const unpinned   = filteredSessions.filter(s => !s.isPinned)
    return {
      pinnedSessions: filteredSessions.filter(s => s.isPinned),
      todaySessions:  unpinned.filter(s => new Date(s.updatedAt) >= todayStart),
      weekSessions:   unpinned.filter(s => new Date(s.updatedAt) >= weekStart && new Date(s.updatedAt) < todayStart),
      olderSessions:  unpinned.filter(s => new Date(s.updatedAt) < weekStart),
    }
  }, [filteredSessions])

  const renderChatGroup = (label: string, items: ChatSession[]) => {
    if (!items.length) return null
    return (
      <div key={label} className="mb-0.5">
        <p className="px-2 pt-3 pb-1 text-[11px] text-muted-foreground/40 select-none uppercase tracking-wider">{label}</p>
        {items.map(s => (
          <ChatItem
            key={s.id}
            session={s}
            isActive={s.id === currentSessionId}
            onSelect={() => onSelectSession(s.id)}
            onDelete={() => setSessionToDelete(s)}
            onRename={title => onRenameSession(s.id, title)}
            onPin={pinned => onPinSession?.(s.id, pinned)}
            onArchive={() => onArchiveSession?.(s.id)}
          />
        ))}
      </div>
    )
  }

  const handleConfirmDelete = useCallback(() => {
    if (sessionToDelete) {
      onDeleteSession(sessionToDelete.id)
      setSessionToDelete(null)
    }
  }, [sessionToDelete, onDeleteSession])

  return (
    <>
      {/* Delete confirmation (Phase 3: Confirmation) */}
      <Dialog open={!!sessionToDelete} onOpenChange={open => !open && setSessionToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete chat?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {sessionToDelete && `"${sessionToDelete.title}" will be permanently deleted. This cannot be undone.`}
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setSessionToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} aria-hidden />
      )}

      <aside
        className={cn(
          'fixed lg:relative inset-y-0 left-0 z-50 flex flex-col h-full',
          'bg-sidebar border-r border-sidebar-border',
          'transition-all duration-300 ease-in-out',
          isOpen
            ? 'w-[260px] translate-x-0'
            : '-translate-x-full lg:-translate-x-full lg:w-0 lg:border-0 overflow-hidden'
        )}
      >
        {/* ── Header: Logo + Marquee + Search ─────────────────── */}
        <div className="shrink-0 px-3 pt-5 pb-3 border-b border-sidebar-border/40 space-y-3">

          {/* Logo row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* App logo with status indicator */}
              <div className="relative w-8 h-8 rounded-full bg-background flex items-center justify-center shrink-0 overflow-hidden ring-1 ring-border/50 text-foreground">
                <AppLogo className="w-5 h-5" />
                <span className={cn('absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background', statusDot)} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-[0.18em] uppercase text-foreground leading-tight">FLOW MNKY</span>
                <span className="text-[10px] text-muted-foreground/50 leading-tight tracking-wide">AI Console</span>
              </div>
            </div>
            <Button
              variant="ghost" size="icon"
              className="h-7 w-7 text-sidebar-foreground/50 hover:text-sidebar-foreground lg:hidden"
              onClick={onClose}
              aria-label="Close sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </Button>
          </div>

          {/* Marquee subtext */}
          <SidebarMarquee />

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40 pointer-events-none" />
            <input
              placeholder="Search chats…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-7 text-sm bg-sidebar-accent/30 border border-sidebar-border/40 rounded-lg outline-none focus:border-sidebar-ring/50 placeholder:text-muted-foreground/40 transition-colors"
              aria-label="Search chats"
            />
            {searchQuery && (
              <button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground" onClick={() => setSearchQuery('')} aria-label="Clear">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── Scrollable body ──────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none px-2 pb-2">

          {/* 1. New chat */}
          <button
            onClick={onNewChat}
            className="flex items-center gap-3 w-full px-2 py-2.5 rounded-lg text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground transition-all duration-100"
          >
            <SquarePen className="w-4 h-4 shrink-0" />
            New chat
          </button>

          {/* 2. Images — left click = gallery dialog, chevron = inline strip */}
          <div className="mt-0.5">
            <div className="flex items-center gap-0.5 rounded-lg hover:bg-sidebar-accent/60 transition-all duration-100 pr-0.5">
              <button
                onClick={() => setGalleryOpen(true)}
                className="flex items-center gap-3 flex-1 px-2 py-2.5 text-sm text-sidebar-foreground/80 hover:text-sidebar-foreground"
              >
                <ImageIcon className="w-4 h-4 shrink-0" />
                Images
              </button>
              <button
                onClick={() => setImagesExpanded(v => !v)}
                className="p-1.5 rounded-md text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                aria-label={imagesExpanded ? 'Collapse' : 'Expand preview'}
              >
                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', imagesExpanded && 'rotate-180')} />
              </button>
            </div>
            {imagesExpanded && <ImageThumbnailStrip onViewAll={() => setGalleryOpen(true)} />}
          </div>

          {/* 3. Integrations */}
          <SidebarSection label="Integrations" icon={Plug} defaultOpen={false} trailing={
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground/50 hover:text-muted-foreground" onClick={e => e.stopPropagation()} aria-label="Integrations menu">
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 text-sm">
                <DropdownMenuItem className="gap-2"><Plus className="w-3.5 h-3.5" /> Explore integrations</DropdownMenuItem>
                <DropdownMenuItem className="gap-2"><Settings className="w-3.5 h-3.5" /> Configure</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          }>
            <div className="space-y-0.5 pt-0.5">
              {MOCK_INTEGRATIONS.map(int => (
                <div
                  key={int.id}
                  className="group/int flex items-center gap-3 px-2 py-2 rounded-lg text-sm hover:bg-sidebar-accent/60 transition-all duration-100 cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0" style={{ background: int.color }}>
                    <int.icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="flex-1 truncate text-sidebar-foreground/80">{int.name}</span>
                  {int.requiresAuth && !int.enabled && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground/60 shrink-0">Auth</span>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost" size="icon"
                        className="h-5 w-5 opacity-0 group-hover/int:opacity-100 transition-opacity shrink-0"
                        onClick={e => e.stopPropagation()}
                      >
                        <MoreHorizontal className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 text-sm">
                      <DropdownMenuItem className="gap-2"><Settings className="w-3.5 h-3.5" /> Configure</DropdownMenuItem>
                      {int.requiresAuth && <DropdownMenuItem className="gap-2"><ExternalLink className="w-3.5 h-3.5" /> Authenticate</DropdownMenuItem>}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive"><Trash2 className="w-3.5 h-3.5" /> Remove</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
              <button className="flex items-center gap-3 w-full px-2 py-2 rounded-lg text-sm text-muted-foreground/60 hover:bg-sidebar-accent/60 hover:text-foreground transition-all duration-100 text-left">
                <div className="w-6 h-6 rounded-md border border-dashed border-sidebar-border/50 flex items-center justify-center shrink-0">
                  <Plus className="w-3 h-3" />
                </div>
                Explore integrations
              </button>
            </div>
          </SidebarSection>

          {/* 4. Projects */}
          <SidebarSection
            label="Projects"
            icon={Folder}
            defaultOpen={false}
            trailing={
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground/50 hover:text-muted-foreground" onClick={e => e.stopPropagation()} aria-label="Projects menu">
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44 text-sm">
                  <DropdownMenuItem className="gap-2" onSelect={() => setNewProjectOpen(true)}>
                    <Plus className="w-3.5 h-3.5" /> New project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            }
          >
            <div className="space-y-0.5 pt-0.5">
              {projects.map(p => (
                <div key={p.id} className="group/proj flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm hover:bg-sidebar-accent/60 transition-all duration-100 cursor-pointer">
                  <div className="w-5 h-5 rounded flex items-center justify-center shrink-0" style={{ background: p.color }}>
                    <FolderOpen className="w-3 h-3 text-white" />
                  </div>
                  <span className="flex-1 truncate text-sidebar-foreground/80">{p.name}</span>
                  <span className="text-[11px] text-muted-foreground/40 shrink-0">{p.chatCount}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost" size="icon"
                        className="h-5 w-5 opacity-0 group-hover/proj:opacity-100 transition-opacity shrink-0"
                        onClick={e => e.stopPropagation()}
                      >
                        <MoreHorizontal className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 text-sm">
                      <DropdownMenuItem className="gap-2"><Pencil className="w-3.5 h-3.5" /> Rename</DropdownMenuItem>
                      <DropdownMenuItem className="gap-2"><Share2 className="w-3.5 h-3.5" /> Share</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive"><Trash2 className="w-3.5 h-3.5" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
              <button
                onClick={() => setNewProjectOpen(true)}
                className="flex items-center gap-2.5 w-full px-2 py-2 rounded-lg text-sm text-muted-foreground/60 hover:bg-sidebar-accent/60 hover:text-foreground transition-all duration-100"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" /> New project
              </button>
            </div>
          </SidebarSection>

          {/* 5. Group chats — presence room per group so participants show via RealtimeAvatarStack */}
          <SidebarSection label="Group chats" icon={Users2} defaultOpen={false}>
            <div className="space-y-0.5 pt-0.5">
              {MOCK_GROUP_CHATS.map(gc => (
                <button key={gc.id} className="flex items-center gap-2.5 w-full px-2 py-2 rounded-lg text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/60 transition-all duration-100 text-left">
                  <span className="flex-1 truncate">{gc.name}</span>
                  <div className="flex items-center shrink-0 min-w-[2rem]">
                    <RealtimeAvatarStack roomName={`flow-mnky:group:${gc.id}`} />
                  </div>
                </button>
              ))}
              <button className="flex items-center gap-2.5 w-full px-2 py-2 rounded-lg text-sm text-muted-foreground/60 hover:bg-sidebar-accent/60 hover:text-foreground transition-all duration-100">
                <Users className="w-3.5 h-3.5 shrink-0" /> New group chat
              </button>
            </div>
          </SidebarSection>

          {/* 6. Your chats */}
          <SidebarSection label="Your chats" icon={MessageSquare} defaultOpen={true}>
            {filteredSessions.length === 0 ? (
              <p className="text-xs text-muted-foreground/40 px-2 py-4 text-center">
                {searchQuery ? 'No matching chats' : 'Start a conversation above'}
              </p>
            ) : (
              <div className="pt-0.5">
                {renderChatGroup('Pinned', pinnedSessions)}
                {renderChatGroup('Today', todaySessions)}
                {renderChatGroup('Previous 7 days', weekSessions)}
                {renderChatGroup('Older', olderSessions)}
              </div>
            )}
          </SidebarSection>

        </div>

        {/* ── Footer ───────────────────────────────────────────── */}
        <div className="px-2 py-2.5 border-t border-sidebar-border shrink-0">
          <UserProfileFooter isAdmin={isAdmin} />
        </div>
      </aside>

      {/* Dialogs (rendered outside aside to avoid clipping) */}
      <ImageGalleryDialog open={galleryOpen} onClose={() => setGalleryOpen(false)} />
      <NewProjectDialog
        open={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
        onCreate={p => setProjects(prev => [...prev, { ...p, id: crypto.randomUUID(), chatCount: 0, fileCount: 0 }])}
      />
    </>
  )
}
