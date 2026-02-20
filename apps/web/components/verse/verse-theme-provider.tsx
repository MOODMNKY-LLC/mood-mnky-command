"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

const VERSE_THEME_KEY = "verse-theme";

type VerseTheme = "light" | "dark";

type VerseThemeContextValue = {
  theme: VerseTheme;
  setTheme: (theme: VerseTheme) => void;
  toggleTheme: () => void;
};

const VerseThemeContext = createContext<VerseThemeContextValue | null>(null);

export function VerseThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<VerseTheme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored =
      (typeof window !== "undefined" &&
        (localStorage.getItem(VERSE_THEME_KEY) as VerseTheme | null)) ||
      null;
    if (stored === "light" || stored === "dark") {
      setThemeState(stored);
    } else {
      setThemeState("light");
    }
  }, []);

  const setTheme = useCallback((next: VerseTheme) => {
    setThemeState(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(VERSE_THEME_KEY, next);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === "light" ? "dark" : "light";
      if (typeof window !== "undefined") {
        localStorage.setItem(VERSE_THEME_KEY, next);
      }
      return next;
    });
  }, []);

  const value: VerseThemeContextValue = {
    theme: mounted ? theme : "light",
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
