"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  type LabzContextId,
  LABZ_CONTEXT_STORAGE_KEY,
  DEFAULT_LABZ_CONTEXT,
  LABZ_CONTEXT_IDS,
  labzContexts,
} from "@/lib/labz-sidebar-context";

export type LabzContextValue = {
  contextId: LabzContextId;
  setContextId: (id: LabzContextId) => void;
};

const LabzContext = React.createContext<LabzContextValue | null>(null);

export function useLabzContext(): LabzContextValue {
  const ctx = React.useContext(LabzContext);
  if (!ctx) {
    throw new Error("useLabzContext must be used within LabzContextProvider");
  }
  return ctx;
}

export function LabzContextProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [contextId, setContextIdState] = React.useState<LabzContextId>(DEFAULT_LABZ_CONTEXT);

  const setContextId = React.useCallback(
    (id: LabzContextId) => {
      setContextIdState(id);
      if (typeof window !== "undefined") {
        localStorage.setItem(LABZ_CONTEXT_STORAGE_KEY, id);
      }
      const ctx = labzContexts.find((c) => c.id === id);
      if (ctx) {
        router.push(ctx.href);
      }
    },
    [router]
  );

  React.useEffect(() => {
    const stored = localStorage.getItem(LABZ_CONTEXT_STORAGE_KEY);
    if (stored && LABZ_CONTEXT_IDS.includes(stored as LabzContextId)) {
      setContextIdState(stored as LabzContextId);
    }
  }, []);

  React.useEffect(() => {
    if (!pathname) return;
    if (pathname === "/store" || pathname.startsWith("/store/")) {
      setContextIdState("store");
    } else if (pathname === "/verse" || pathname.startsWith("/verse") || pathname.startsWith("/verse-backoffice")) {
      setContextIdState("verse");
    } else if (pathname === "/platform" || pathname.startsWith("/platform") || pathname === "/members" || pathname.startsWith("/members/")) {
      setContextIdState("platform");
    } else if (
      pathname === "/chat" ||
      pathname.startsWith("/chat") ||
      pathname === "/code-mnky" ||
      pathname.startsWith("/studio") ||
      pathname === "/media" ||
      pathname.startsWith("/media/")
    ) {
      setContextIdState("ai-tools");
    } else if (
      pathname === "/" ||
      pathname.startsWith("/formulas") ||
      pathname.startsWith("/fragrances") ||
      pathname.startsWith("/glossary") ||
      pathname.startsWith("/blending") ||
      pathname.startsWith("/wicks") ||
      pathname.startsWith("/products")
    ) {
      setContextIdState("lab");
    }
  }, [pathname]);

  const value = React.useMemo(() => ({ contextId, setContextId }), [contextId, setContextId]);

  return <LabzContext.Provider value={value}>{children}</LabzContext.Provider>;
}
