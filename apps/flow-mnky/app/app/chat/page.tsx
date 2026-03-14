 'use client'

import { useEffect, useState } from 'react'

import { ChatShell } from '@/components/chat/chat-shell'

export default function ChatPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return <ChatShell />
}
