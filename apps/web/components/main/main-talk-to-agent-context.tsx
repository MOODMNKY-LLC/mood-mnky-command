"use client"

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react"
import { MainDock } from "@/components/main/main-dock"
import { MainTalkToAgentDialog } from "@/components/main/main-talk-to-agent-dialog"

type TalkToAgentContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  openDialog: () => void
}

const TalkToAgentContext = createContext<TalkToAgentContextValue | null>(null)

export function useMainTalkToAgent() {
  const ctx = useContext(TalkToAgentContext)
  if (!ctx) return null
  return ctx
}

export function MainTalkToAgentProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const openDialog = useCallback(() => setOpen(true), [])
  const value: TalkToAgentContextValue = { open, setOpen, openDialog }
  return (
    <TalkToAgentContext.Provider value={value}>
      {children}
      <MainDock />
      <MainTalkToAgentDialog />
    </TalkToAgentContext.Provider>
  )
}
