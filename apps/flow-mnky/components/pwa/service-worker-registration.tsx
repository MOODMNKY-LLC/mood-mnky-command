'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    // Avoid stale dev bundles and cached shells during local validation.
    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations()
        .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
        .catch((error) => {
          console.error('[PWA] Failed to unregister service workers in development:', error)
        })

      if ('caches' in window) {
        caches.keys()
          .then((cacheNames) => Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName))))
          .catch((error) => {
            console.error('[PWA] Failed to clear caches in development:', error)
          })
      }

      return
    }

    let updateInterval: ReturnType<typeof setInterval> | null = null

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registered with scope:', registration.scope)

        updateInterval = setInterval(() => {
          registration.update()
        }, 60 * 60 * 1000)
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error)
      })

    return () => {
      if (updateInterval) {
        clearInterval(updateInterval)
      }
    }
  }, [])

  return null
}
