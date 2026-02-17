"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { PersonaState } from "@/components/ai-elements/persona";

interface VersePersonaStateContextValue {
  personaState: PersonaState;
  setPersonaState: (state: PersonaState) => void;
}

const VersePersonaStateContext =
  createContext<VersePersonaStateContextValue | null>(null);

export function VersePersonaStateProvider({ children }: { children: ReactNode }) {
  const [personaState, setPersonaState] = useState<PersonaState>("idle");
  const value = useMemo<VersePersonaStateContextValue>(
    () => ({
      personaState,
      setPersonaState,
    }),
    [personaState]
  );
  return (
    <VersePersonaStateContext.Provider value={value}>
      {children}
    </VersePersonaStateContext.Provider>
  );
}

export function useVersePersonaState(): VersePersonaStateContextValue {
  const ctx = useContext(VersePersonaStateContext);
  if (!ctx) {
    return {
      personaState: "idle",
      setPersonaState: () => {},
    };
  }
  return ctx;
}
