"use client"

import { createContext, useContext } from "react"

export type MainUser = {
  id: string
  email?: string
  displayName?: string
  avatarUrl?: string
  isAdmin?: boolean
} | null

const MainUserContext = createContext<MainUser>(null)

export function MainUserProvider({
  user,
  children,
}: {
  user: MainUser
  children: React.ReactNode
}) {
  return (
    <MainUserContext.Provider value={user}>{children}</MainUserContext.Provider>
  )
}

export function useMainUser(): MainUser {
  return useContext(MainUserContext)
}
