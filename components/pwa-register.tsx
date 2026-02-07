"use client"

import { SerwistProvider } from "@serwist/next/react"

export function PwaRegister({ children }: { children: React.ReactNode }) {
  return (
    <SerwistProvider swUrl="/sw.js" register>
      {children}
    </SerwistProvider>
  )
}
