"use client"

import Image from "next/image"
import { useState } from "react"
import { MAIN_MASCOT_FALLBACK_HERO } from "@/lib/main-mascot-assets"

export interface MainMascotImageProps {
  src: string
  fallbackSrc?: string | null
  alt: string
  className?: string
  fill?: boolean
  sizes?: string
  priority?: boolean
  /** When true, render nothing if primary image fails and no fallback. */
  hideOnError?: boolean
}

/**
 * Renders a mascot image; on load error uses fallbackSrc (e.g. MAIN_MASCOT_FALLBACK_HERO) or hides.
 * Use for Main section mascot assets that may not exist until the user drops them into public/images/main/.
 */
export function MainMascotImage({
  src,
  fallbackSrc = MAIN_MASCOT_FALLBACK_HERO,
  alt,
  className,
  fill = false,
  sizes,
  priority = false,
  hideOnError = false,
}: MainMascotImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src)
  const [failed, setFailed] = useState(false)

  const handleError = () => {
    if (fallbackSrc && currentSrc === src) {
      setCurrentSrc(fallbackSrc)
    } else {
      setFailed(true)
    }
  }

  if (failed && hideOnError) return null

  return (
    <Image
      src={failed ? fallbackSrc ?? src : currentSrc}
      alt={alt}
      fill={fill}
      sizes={sizes}
      priority={priority}
      className={className}
      onError={handleError}
      unoptimized={currentSrc.startsWith("/images/main/")}
    />
  )
}
