'use client'

import * as React from 'react'

const THEME_PALETTE_KEY = 'theme-palette'

export type ThemePalette = 'main' | 'dojo'

type ThemePaletteContextValue = {
  palette: ThemePalette
  setPalette: (palette: ThemePalette) => void
}

const ThemePaletteContext = React.createContext<ThemePaletteContextValue | null>(null)

export function setPaletteTheme(palette: ThemePalette) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = palette
  try {
    localStorage.setItem(THEME_PALETTE_KEY, palette)
  } catch {
    /* ignore */
  }
}

export function getStoredPalette(): ThemePalette {
  if (typeof window === 'undefined') return 'main'
  try {
    const stored = localStorage.getItem(THEME_PALETTE_KEY)
    if (stored === 'main' || stored === 'dojo') return stored
  } catch {
    /* ignore */
  }
  return 'main'
}

export function ThemePaletteProvider({ children }: { children: React.ReactNode }) {
  const [palette, setPaletteState] = React.useState<ThemePalette>('main')
  const mounted = React.useRef(false)

  React.useEffect(() => {
    const stored = getStoredPalette()
    setPaletteState(stored)
    document.documentElement.dataset.theme = stored
    mounted.current = true
  }, [])

  const setPalette = React.useCallback((next: ThemePalette) => {
    setPaletteTheme(next)
    setPaletteState(next)
  }, [])

  const value = React.useMemo(
    () => ({ palette, setPalette }),
    [palette, setPalette]
  )

  return (
    <ThemePaletteContext.Provider value={value}>
      {children}
    </ThemePaletteContext.Provider>
  )
}

export function useThemePalette() {
  const ctx = React.useContext(ThemePaletteContext)
  if (!ctx) {
    return {
      palette: 'main' as ThemePalette,
      setPalette: (_: ThemePalette) => {},
    }
  }
  return ctx
}
