'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import {
  updateProfileRole,
  listProfiles,
  setUserDefaultChatflow,
  setUserAllowedOpenAIModels,
  type ProfileRow,
  type ProfileRole,
} from '@/lib/actions/admin'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Loader2, Circle, Cpu } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'

const ROLES: ProfileRole[] = ['admin', 'moderator', 'user', 'pending']
const ACTIVE_THRESHOLD_MS = 60 * 60 * 1000 // 1 hour (last sign-in from Auth)

function formatLastSignIn(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  const now = Date.now()
  const diff = now - d.getTime()
  if (diff < 60_000) return 'Just now'
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`
  return d.toLocaleDateString(undefined, { dateStyle: 'short' })
}

function getStatus(lastSignIn: string | null | undefined): 'active' | 'away' {
  if (!lastSignIn) return 'away'
  return Date.now() - new Date(lastSignIn).getTime() <= ACTIVE_THRESHOLD_MS ? 'active' : 'away'
}
const PAGE_SIZE = 20
const MODELS_PAGE_SIZE = 30
/** Max height for the model list so the dialog never fills the whole page. */
const MODELS_LIST_MAX_HEIGHT = 'min(320px, 50vh)'
/** Sentinel for "no default chatflow" — Radix Select disallows empty string as item value. */
const NO_CHATFLOW_VALUE = '__none__'

interface ChatflowOption {
  id: string
  name: string
}

export function UsersTable({
  initialProfiles,
  initialNextOffset,
}: {
  initialProfiles: ProfileRow[]
  initialNextOffset: number | null
}) {
  const [profiles, setProfiles] = useState<ProfileRow[]>(initialProfiles)
  const [nextOffset, setNextOffset] = useState<number | null>(initialNextOffset)
  const [loadMorePending, setLoadMorePending] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [chatflows, setChatflows] = useState<ChatflowOption[]>([])
  const [isPending, startTransition] = useTransition()
  const [modelsDialogProfileId, setModelsDialogProfileId] = useState<string | null>(null)
  const [openaiModels, setOpenaiModels] = useState<{ id: string }[]>([])
  const [openaiModelsLoading, setOpenaiModelsLoading] = useState(false)
  /** How many models to show in the list; more load when scrolling to bottom. */
  const [visibleModelsCount, setVisibleModelsCount] = useState(MODELS_PAGE_SIZE)
  const modelsLoadMoreSentinelRef = useRef<HTMLDivElement>(null)
  /** Draft for the dialog: null = allow all, string[] = restrict to these */
  const [draftAllowedModels, setDraftAllowedModels] = useState<string[] | null>(null)
  /** Ref so Save always uses latest draft (avoids stale closure). */
  const draftAllowedModelsRef = useRef(draftAllowedModels)
  draftAllowedModelsRef.current = draftAllowedModels
  const [modelsSaveError, setModelsSaveError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/flowise/chatflows')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: ChatflowOption[]) => setChatflows(data))
      .catch(() => {})
  }, [])

  const loadMore = async () => {
    if (nextOffset === null || loadMorePending) return
    setLoadMorePending(true)
    const result = await listProfiles({ limit: PAGE_SIZE, offset: nextOffset })
    setLoadMorePending(false)
    if (result.ok) {
      setProfiles((prev) => [...prev, ...result.data])
      setNextOffset(result.nextOffset)
    }
  }

  const handleDefaultChatflowChange = (profileId: string, chatflowId: string | null) => {
    startTransition(async () => {
      const result = await setUserDefaultChatflow(profileId, chatflowId)
      if (result.ok) {
        setProfiles((prev) =>
          prev.map((p) =>
            p.id === profileId ? { ...p, default_chatflow_id: chatflowId } : p
          )
        )
      }
    })
  }

  const handleRoleChange = (profileId: string, newRole: ProfileRole) => {
    startTransition(async () => {
      setPendingId(profileId)
      const result = await updateProfileRole(profileId, newRole)
      setPendingId(null)
      if (result.ok) {
        setProfiles(prev =>
          prev.map(p => (p.id === profileId ? { ...p, role: newRole } : p)),
        )
      }
    })
  }

  const openModelsDialog = (profileId: string) => {
    const profile = profiles.find((p) => p.id === profileId)
    setModelsDialogProfileId(profileId)
    setDraftAllowedModels(profile?.allowed_openai_models ?? null)
    setModelsSaveError(null)
    setVisibleModelsCount(MODELS_PAGE_SIZE)
    setOpenaiModelsLoading(true)
    fetch('/api/admin/openai/models')
      .then((r) => (r.ok ? r.json() : { models: [] }))
      .then((d: { models?: { id: string }[] }) => {
        setOpenaiModels(d.models ?? [])
        setVisibleModelsCount(MODELS_PAGE_SIZE)
      })
      .catch(() => setOpenaiModels([]))
      .finally(() => setOpenaiModelsLoading(false))
  }

  /** Load more models when sentinel enters view (infinite scroll). */
  useEffect(() => {
    if (openaiModels.length === 0 || visibleModelsCount >= openaiModels.length) return
    const el = modelsLoadMoreSentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return
        setVisibleModelsCount((n) =>
          Math.min(n + MODELS_PAGE_SIZE, openaiModels.length)
        )
      },
      { root: null, rootMargin: '100px', threshold: 0 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [openaiModels.length, visibleModelsCount])

  const allowAll = draftAllowedModels === null
  const setAllowAll = (allow: boolean) => setDraftAllowedModels(allow ? null : [])

  const toggleModelInDraft = (id: string) => {
    if (allowAll) {
      setDraftAllowedModels(openaiModels.map((m) => m.id).filter((x) => x !== id))
      return
    }
    const list = draftAllowedModels ?? []
    if (list.includes(id)) {
      setDraftAllowedModels(list.length <= 1 ? [] : list.filter((x) => x !== id))
    } else {
      setDraftAllowedModels([...list, id])
    }
  }

  const isModelAllowed = (id: string) => allowAll || (draftAllowedModels ?? []).includes(id)

  const handleSaveAllowedModels = (profileId: string) => {
    setModelsSaveError(null)
    const modelIds = draftAllowedModelsRef.current
    startTransition(async () => {
      const result = await setUserAllowedOpenAIModels(profileId, modelIds)
      if (result.ok) {
        setProfiles((prev) =>
          prev.map((p) =>
            p.id === profileId ? { ...p, allowed_openai_models: modelIds } : p
          )
        )
        setModelsDialogProfileId(null)
      } else {
        setModelsSaveError(result.error ?? 'Failed to save')
      }
    })
  }

  if (profiles.length === 0) {
    return (
      <div className="rounded-lg border border-border/50 bg-muted/20 p-8 text-center text-muted-foreground text-sm">
        No users found. Profiles are created when users sign up.
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border/50">
            <TableHead className="w-[80px]">User</TableHead>
            <TableHead>Display name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="w-[90px]">Status</TableHead>
            <TableHead className="whitespace-nowrap">Last signed in</TableHead>
            <TableHead>Default chatflow</TableHead>
            <TableHead className="w-[100px]">OpenAI models</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.map((profile) => (
            <TableRow key={profile.id} className="border-border/50">
              <TableCell>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile.avatar_url ?? undefined} alt="" />
                  <AvatarFallback className="text-xs">
                    {(profile.display_name ?? profile.id.slice(0, 2)).slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell>
                <span className="font-medium">
                  {profile.display_name ?? '—'}
                </span>
                <p className="text-xs text-muted-foreground truncate max-w-[200px]" title={profile.id}>
                  {profile.id}
                </p>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    profile.role === 'admin'
                      ? 'default'
                      : profile.role === 'pending'
                        ? 'secondary'
                        : 'outline'
                  }
                >
                  {profile.role}
                </Badge>
              </TableCell>
              <TableCell>
                {getStatus(profile.last_sign_in_at) === 'active' ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-green-600">
                    <Circle className="h-2 w-2 fill-current" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Circle className="h-2 w-2 fill-muted-foreground/50" />
                    Away
                  </span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm tabular-nums">
                {formatLastSignIn(profile.last_sign_in_at)}
              </TableCell>
              <TableCell>
                <Select
                  value={profile.default_chatflow_id ?? NO_CHATFLOW_VALUE}
                  onValueChange={(value) =>
                    handleDefaultChatflowChange(profile.id, value === NO_CHATFLOW_VALUE ? null : value)
                  }
                  disabled={isPending}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_CHATFLOW_VALUE}>None</SelectItem>
                    {chatflows.map((cf) => (
                      <SelectItem key={cf.id} value={cf.id}>
                        {cf.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs font-normal text-muted-foreground hover:text-foreground"
                  onClick={() => openModelsDialog(profile.id)}
                >
                  <Cpu className="h-3 w-3" />
                  {profile.allowed_openai_models?.length
                    ? `${profile.allowed_openai_models.length} models`
                    : 'All'}
                </Button>
              </TableCell>
              <TableCell className="text-right">
                <Select
                  value={profile.role}
                  onValueChange={(value) => handleRoleChange(profile.id, value as ProfileRole)}
                  disabled={isPending && pendingId === profile.id}
                >
                  <SelectTrigger className="w-[130px]">
                    {pendingId === profile.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <SelectValue />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog
        open={!!modelsDialogProfileId}
        onOpenChange={(open) => !open && setModelsDialogProfileId(null)}
      >
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>OpenAI model allow list</DialogTitle>
          </DialogHeader>
          {modelsDialogProfileId && (
            <div className="space-y-3 flex flex-col min-h-0">
              <div className="flex items-center gap-2 shrink-0">
                <Checkbox
                  id="allow-all-models"
                  checked={allowAll}
                  onCheckedChange={(c) => setAllowAll(c === true)}
                />
                <label htmlFor="allow-all-models" className="text-sm font-medium cursor-pointer">
                  Allow all models (no restriction)
                </label>
              </div>
              {!allowAll && (
                <>
                  <p className="text-xs text-muted-foreground shrink-0">
                    Select which models this user can use for OpenAI fallback.
                  </p>
                  {openaiModelsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading models…
                    </div>
                  ) : (
                    <ScrollArea
                      className="shrink rounded-md border border-border/50 p-2"
                      style={{ height: MODELS_LIST_MAX_HEIGHT, maxHeight: MODELS_LIST_MAX_HEIGHT }}
                    >
                      <div className="space-y-2 pr-2">
                        {openaiModels.slice(0, visibleModelsCount).map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Checkbox
                              id={`model-${m.id}`}
                              checked={isModelAllowed(m.id)}
                              onCheckedChange={() => toggleModelInDraft(m.id)}
                            />
                            <label
                              htmlFor={`model-${m.id}`}
                              className="cursor-pointer font-mono text-xs"
                            >
                              {m.id}
                            </label>
                          </div>
                        ))}
                        {visibleModelsCount < openaiModels.length && (
                          <div
                            ref={modelsLoadMoreSentinelRef}
                            className="py-2 text-center text-xs text-muted-foreground"
                          >
                            Scroll for more ({openaiModels.length - visibleModelsCount} left)…
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  )}
                </>
              )}
              {modelsSaveError && (
                <p className="text-sm text-destructive shrink-0">{modelsSaveError}</p>
              )}
              <div className="flex justify-end gap-2 pt-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setModelsDialogProfileId(null)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={isPending}
                  onClick={() => {
                    if (modelsDialogProfileId)
                      handleSaveAllowedModels(modelsDialogProfileId)
                  }}
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {nextOffset !== null && (
        <div className="flex justify-center p-4 border-t border-border/50">
          <Button
            variant="outline"
            onClick={loadMore}
            disabled={loadMorePending}
          >
            {loadMorePending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load more'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
