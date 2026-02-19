"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { PersonaState } from "@/components/ai-elements/persona";
import type { StatusOverride } from "@/components/labz/labz-status-ring";

interface LabzPersonaStateContextValue {
  personaState: PersonaState;
  setPersonaState: (state: PersonaState) => void;
  statusOverride: StatusOverride | null;
  setStatusOverride: (override: StatusOverride | null) => void;
}

const LabzPersonaStateContext =
  createContext<LabzPersonaStateContextValue | null>(null);

export function LabzPersonaStateProvider({ children }: { children: ReactNode }) {
  const [personaState, setPersonaState] = useState<PersonaState>("idle");
  const [statusOverride, setStatusOverride] = useState<StatusOverride | null>(null);
  const value = useMemo<LabzPersonaStateContextValue>(
    () => ({
      personaState,
      setPersonaState,
      statusOverride,
      setStatusOverride,
    }),
    [personaState, statusOverride]
  );
  return (
    <LabzPersonaStateContext.Provider value={value}>
      {children}
    </LabzPersonaStateContext.Provider>
  );
}

export function useLabzPersonaState(): LabzPersonaStateContextValue {
  const ctx = useContext(LabzPersonaStateContext);
  if (!ctx) {
    return {
      personaState: "idle",
      setPersonaState: () => {},
      statusOverride: null,
      setStatusOverride: () => {},
    };
  }
  return ctx;
}
