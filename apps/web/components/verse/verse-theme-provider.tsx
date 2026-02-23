"use client";

import { createContext, useContext } from "react";
import { useTheme } from "next-themes";

type VerseTheme = "light" | "dark";

type VerseThemeContextValue = {
  theme: VerseTheme;
  setTheme: (theme: VerseTheme) => void;
  toggleTheme: () => void;
};

const VerseThemeContext = createContext<VerseThemeContextValue | null>(null);

/**
 * Bridges next-themes to Verse: useVerseTheme() returns the same theme as the rest of the app
 * so data-verse-theme and verse CSS stay in sync with the app-wide theme (and AnimatedThemeToggler).
 */
export function VerseThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme: resolvedTheme, setTheme: setNextTheme } = useTheme();
  const theme: VerseTheme =
    resolvedTheme === "dark" ? "dark" : "light";

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
