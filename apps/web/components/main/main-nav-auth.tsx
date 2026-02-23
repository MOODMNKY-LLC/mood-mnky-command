"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut, User, CreditCard, Store, MessageCircle, Loader2 } from "lucide-react"
import { SiGithub } from "react-icons/si"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { useMainUser } from "@/components/main/main-user-context"
import { cn } from "@/lib/utils"

type LinkedAccountsResponse = {
  shopify: { linked: boolean; linkUrl: string; manageUrl: string }
  discord: { linked: boolean; linkUrl: string }
  github: { linked: boolean; linkUrl: string }
}

const linkClass =
  "text-sm text-muted-foreground transition-colors hover:text-foreground"

function getInitials(displayName?: string, email?: string): string {
  if (displayName) {
    const parts = displayName.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return displayName.slice(0, 2).toUpperCase()
  }
  if (email) {
    return email.slice(0, 2).toUpperCase()
  }
  return "?"
}

export function MainNavAuth({ className }: { className?: string }) {
  const user = useMainUser()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccountsResponse | null>(null)
  const [linkedLoading, setLinkedLoading] = useState(false)

  useEffect(() => {
    if (!open || !user) return
    setLinkedLoading(true)
    fetch("/api/me/linked-accounts")
      .then((r) => (r.ok ? r.json() : null))
      .then(setLinkedAccounts)
      .finally(() => setLinkedLoading(false))
  }, [open, user])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setOpen(false)
    router.push("/auth/login")
    router.refresh()
  }

  if (!user) {
    return (
      <Link
        href="/auth/login"
        className={cn(linkClass, className)}
        aria-label="Sign in"
      >
        Sign in
      </Link>
    )
  }

  const name = user.displayName || user.email || "Signed in"
  const email = user.email || ""
  const initials = getInitials(user.displayName, user.email)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("rounded-full", className)}
          aria-label="Account menu"
        >
          <Avatar className="h-8 w-8 rounded-full ring-1 ring-border">
            <AvatarImage src={user.avatarUrl} alt={name} />
            <AvatarFallback className="rounded-full bg-primary text-primary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="main-glass-panel-card w-72 rounded-xl border border-border p-0"
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-3 px-4 py-3">
            <Avatar className="h-10 w-10 shrink-0 rounded-full ring-1 ring-border">
              <AvatarImage src={user.avatarUrl} alt={name} />
              <AvatarFallback className="rounded-full bg-primary text-primary-foreground text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-medium text-foreground">{name}</p>
              <p className="truncate text-xs text-muted-foreground">{email || "Member"}</p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="mx-0" />
        <div className="px-4 py-2">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Linked accounts
          </p>
          {linkedLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : linkedAccounts ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-2.5 py-1.5">
                <span className="flex items-center gap-2 text-xs font-medium">
                  <Store className="h-3.5 w-3.5 text-muted-foreground" />
                  Shopify
                </span>
                {linkedAccounts.shopify.linked ? (
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Linked</span>
                ) : (
                  <a href={linkedAccounts.shopify.linkUrl} className="text-xs text-primary hover:underline">Connect</a>
                )}
              </div>
              <div className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-2.5 py-1.5">
                <span className="flex items-center gap-2 text-xs font-medium">
                  <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  Discord
                </span>
                {linkedAccounts.discord.linked ? (
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Linked</span>
                ) : (
                  <Link href={linkedAccounts.discord.linkUrl} className="text-xs text-primary hover:underline">Link</Link>
                )}
              </div>
              <div className="flex items-center justify-between rounded-md border border-border bg-muted/20 px-2.5 py-1.5">
                <span className="flex items-center gap-2 text-xs font-medium">
                  <SiGithub className="h-3.5 w-3.5 text-muted-foreground" />
                  GitHub
                </span>
                {linkedAccounts.github.linked ? (
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Linked</span>
                ) : (
                  <Link href={linkedAccounts.github.linkUrl} className="text-xs text-primary hover:underline">Link</Link>
                )}
              </div>
            </div>
          ) : null}
        </div>
        <DropdownMenuSeparator className="mx-0" />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/dojo/profile" className="flex items-center gap-2 cursor-pointer">
              <User className="h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/auth/update-password" className="flex items-center gap-2 cursor-pointer">
              <CreditCard className="h-4 w-4" />
              Account
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="mx-0" />
        <DropdownMenuItem onClick={handleSignOut} className="gap-2 cursor-pointer">
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
