'use client'

import * as React from 'react'
import { Palette, Contrast } from 'lucide-react'

import { useThemePalette, type ThemePalette } from '@/components/theme-palette-provider'
import { cn } from '@/lib/utils'

/**
 * Toggles palette (Main | Dojo) between grayscale and Dojo slate. One click switches to the other.
 * This is palette, not mode: for light/dark use AnimatedThemeToggler or ThemeToggle.
 */
export function ThemePaletteSwitcher({
  className,
  ...props
}: React.ComponentPropsWithoutRef<'button'>) {
  const [mounted, setMounted] = React.useState(false)
  const { palette, setPalette } = useThemePalette()

  React.useEffect(() => setMounted(true), [])

  const togglePalette = () => {
    const next: ThemePalette = palette === 'main' ? 'dojo' : 'main'
    setPalette(next)
  }

  if (!mounted) {
    return (
      <button
        type="button"
        onClick={togglePalette}
        className={cn('flex size-9 items-center justify-center', className)}
        aria-label="Toggle theme palette"
        {...props}
      >
        <Contrast className="h-4 w-4" aria-hidden />
      </button>
    )
  }

  const isDojo = palette === 'dojo'

  return (
    <button
      type="button"
      onClick={togglePalette}
      className={cn('flex size-9 items-center justify-center', className)}
      title={isDojo ? 'Switch to Main (grayscale)' : 'Switch to Dojo (color)'}
      aria-label={isDojo ? 'Switch to Main theme' : 'Switch to Dojo theme'}
      {...props}
    >
      {isDojo ? (
        <Palette className="h-4 w-4" aria-hidden />
      ) : (
        <Contrast className="h-4 w-4" aria-hidden />
      )}
      <span className="sr-only">
        {isDojo ? 'Switch to Main (grayscale)' : 'Switch to Dojo (color)'}
      </span>
    </button>
  )
}
