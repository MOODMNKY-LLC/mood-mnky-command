'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Plug,
  GitBranch,
  Bot,
  Variable,
  Database,
  MessagesSquare,
  MessageSquare,
  LayoutDashboard,
  ExternalLink,
  Users,
} from 'lucide-react'
import { ThemeToggle } from '@/components/chat/theme-toggle'

const navItems = [
  { href: '/admin/users',           label: 'Users',          icon: Users },
  { href: '/admin/connections',     label: 'Connection',     icon: Plug },
  { href: '/admin/chatflows',       label: 'Chatflows',      icon: GitBranch },
  { href: '/admin/assistants',      label: 'Assistants',     icon: Bot },
  { href: '/admin/variables',       label: 'Variables',      icon: Variable },
  { href: '/admin/document-stores', label: 'Doc Stores',     icon: Database },
  { href: '/admin/conversations',   label: 'Conversations',  icon: MessagesSquare },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 flex flex-col shrink-0 glass-strong border-r border-border/50">
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-border/50">
        <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center">
          <LayoutDashboard className="w-3.5 h-3.5 text-background" />
        </div>
        <span className="font-semibold text-sm">Admin Console</span>
      </div>

      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start gap-2.5 h-9 text-sm font-normal',
                pathname.startsWith(href)
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Button>
          </Link>
        ))}
      </nav>

      <div className="p-3 border-t border-border/50 space-y-1">
        <Link href="/app/chat" target="_blank">
          <Button variant="ghost" className="w-full justify-start gap-2.5 h-9 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50">
            <MessageSquare className="w-4 h-4" />
            Open Chat
            <ExternalLink className="w-3 h-3 ml-auto" />
          </Button>
        </Link>
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-xs text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  )
}
