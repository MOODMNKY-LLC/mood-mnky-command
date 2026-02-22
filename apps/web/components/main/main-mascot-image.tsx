"use client"

import Image from "next/image"
import { useState } from "react"
import { MAIN_MASCOT_FALLBACK_HERO } from "@/lib/main-mascot-assets"

/** Tiny gray placeholder for blur when loading below-fold mascot images. */
const MAIN_MASCOT_BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxIiBoZWlnaHQ9IjEiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiM5YzljOWMiLz48L3N2Zz4="

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
  /** When set and priority is false, use as blur placeholder. */
  blurDataURL?: string | null
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
  blurDataURL,
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

  const useBlur = !priority && (blurDataURL ?? MAIN_MASCOT_BLUR_DATA_URL)

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
      {...(useBlur
        ? { placeholder: "blur" as const, blurDataURL: useBlur }
        : {})}
    />
  )
}
