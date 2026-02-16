"use client"

import { SerwistProvider } from "@serwist/next/react"

export function PwaRegister({
  children,
  registerSw = true,
}: {
  children: React.ReactNode
  registerSw?: boolean
}) {
  return (
    <SerwistProvider swUrl="/sw.js" register={registerSw}>
      {children}
    </SerwistProvider>
  )
}
