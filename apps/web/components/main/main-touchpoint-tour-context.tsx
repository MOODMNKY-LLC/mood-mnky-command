"use client"

import * as React from "react"

type MainTouchpointTourContextValue = {
  openTour: () => void
  tourOpen: boolean
  setTourOpen: (open: boolean) => void
}

const MainTouchpointTourContext =
  React.createContext<MainTouchpointTourContextValue | null>(null)

export function MainTouchpointTourProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [tourOpen, setTourOpen] = React.useState(false)
  const value: MainTouchpointTourContextValue = React.useMemo(
    () => ({
      openTour: () => setTourOpen(true),
      tourOpen,
      setTourOpen,
    }),
    [tourOpen]
  )
  return (
    <MainTouchpointTourContext.Provider value={value}>
      {children}
    </MainTouchpointTourContext.Provider>
  )
}

export function useMainTouchpointTour(): MainTouchpointTourContextValue {
  const ctx = React.useContext(MainTouchpointTourContext)
  if (!ctx) {
    throw new Error(
      "useMainTouchpointTour must be used within MainTouchpointTourProvider"
    )
  }
  return ctx
}
