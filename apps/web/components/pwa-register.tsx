"use client"

import { SerwistProvider } from "@serwist/next/react"
import { useEffect, useState } from "react"

export function PwaRegister({
  children,
  registerSw = true,
}: {
  children: React.ReactNode
  registerSw?: boolean
}) {
  const [shouldRegister, setShouldRegister] = useState(false)

  useEffect(() => {
    if (!registerSw) return
    if (!("serviceWorker" in navigator)) return

    // Check sw.js is fetchable without redirect before registering to avoid SecurityError
    ;(async () => {
      try {
        const res = await fetch("/sw.js", { method: "GET", redirect: "manual" })
        // If response is a redirect (3xx), don't register
        if (res.status >= 300 && res.status < 400) {
          console.debug("PWA: sw.js fetch returned redirect; skipping registration", res.status)
          setShouldRegister(false)
          return
        }
        // If OK or opaque, allow registration and attempt to register safely
        setShouldRegister(true)
        try {
          const reg = await navigator.serviceWorker.register("/sw.js")
          console.debug("PWA: service worker registered", reg)
        } catch (err) {
          console.debug("PWA: service worker registration failed (caught)", err)
        }
      } catch (err) {
        console.debug("PWA: sw.js fetch failed; not registering service worker", err)
        setShouldRegister(false)
      }
    })()
  }, [registerSw])

  return (
    <SerwistProvider swUrl="/sw.js" register={false}>
      {children}
    </SerwistProvider>
  )
}
