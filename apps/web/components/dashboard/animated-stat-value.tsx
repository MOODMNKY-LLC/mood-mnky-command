"use client"

import { useEffect, useState } from "react"

interface AnimatedStatValueProps {
  value: number
  className?: string
  duration?: number
}

/**
 * Animates from 0 to value on mount. Use for dashboard stat cards.
 */
export function AnimatedStatValue({
  value,
  className,
  duration = 0.8,
}: AnimatedStatValueProps) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (value === 0) {
      setDisplay(0)
      return
    }
    const start = performance.now()
    const step = (now: number) => {
      const elapsed = (now - start) / 1000
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - (1 - t) * (1 - t)
      setDisplay(Math.round(eased * value))
      if (t < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [value, duration])

  return <span className={className}>{display}</span>
}
