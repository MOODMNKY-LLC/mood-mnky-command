"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useTheme } from "next-themes";

type VerseTheme = "light" | "dark";

type VerseThemeContextValue = {
  theme: VerseTheme;
  setTheme: (theme: VerseTheme) => void;
  toggleTheme: () => void;
};

const VerseThemeContext = createContext<VerseThemeContextValue | null>(null);

/**
 * Bridges next-themes (light/dark MODE) to Verse. useVerseTheme() returns the same mode as the rest
 * of the app so verse CSS stays in sync with the app-wide mode (AnimatedThemeToggler).
 * Note: "theme" here = mode (light|dark). For palette (Main|Dojo) use useThemePalette().
 * Uses a mounted guard so the initial mode is "light" until after hydration.
 */
export function VerseThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme: resolvedTheme, setTheme: setNextTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const theme: VerseTheme =
    !mounted ? "light" : resolvedTheme === "dark" ? "dark" : "light";

  const setTheme = (next: VerseTheme) => {
    setNextTheme(next);
  };

  const toggleTheme = () => {
    setNextTheme(theme === "dark" ? "light" : "dark");
  };

  const value: VerseThemeContextValue = {
    theme,
    setTheme,
    toggleTheme,
  };

  return (
    <VerseThemeContext.Provider value={value}>
      {children}
    </VerseThemeContext.Provider>
  );
}

export function useVerseTheme() {
  const ctx = useContext(VerseThemeContext);
  if (!ctx) {
    return {
      theme: "light" as VerseTheme,
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }
  return ctx;
}
