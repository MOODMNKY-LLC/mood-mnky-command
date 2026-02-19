"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  type DojoContextId,
  DOJO_CONTEXT_STORAGE_KEY,
  DEFAULT_DOJO_CONTEXT,
  dojoContexts,
} from "@/lib/dojo-sidebar-config";

export type DojoContextValue = {
  contextId: DojoContextId;
  setContextId: (id: DojoContextId) => void;
};

const DojoContext = React.createContext<DojoContextValue | null>(null);

export function useDojoContext(): DojoContextValue {
  const ctx = React.useContext(DojoContext);
  if (!ctx) {
    throw new Error("useDojoContext must be used within DojoContextProvider");
  }
  return ctx;
}

export function DojoContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  // Always use default for initial state to avoid hydration mismatch (localStorage differs server vs client)
  const [contextId, setContextIdState] = React.useState<DojoContextId>(DEFAULT_DOJO_CONTEXT);

  const setContextId = React.useCallback(
    (id: DojoContextId) => {
      setContextIdState(id);
      if (typeof window !== "undefined") {
        localStorage.setItem(DOJO_CONTEXT_STORAGE_KEY, id);
      }
      const ctx = dojoContexts.find((c) => c.id === id);
      if (ctx) {
        router.push(ctx.href);
      }
    },
    [router]
  );

  // Hydrate from localStorage on mount (client-only) to restore persisted context
  React.useEffect(() => {
    const stored = localStorage.getItem(DOJO_CONTEXT_STORAGE_KEY);
    if (stored && (["home", "crafting", "verse"] as const).includes(stored as DojoContextId)) {
      setContextIdState(stored as DojoContextId);
    }
  }, []);

  // Sync context from pathname on mount/navigation (pathname overrides persisted)
  React.useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/dojo/crafting")) {
      setContextIdState("crafting");
    } else if (pathname.startsWith("/verse")) {
      setContextIdState("verse");
    } else if (pathname.startsWith("/dojo")) {
      setContextIdState("home");
    }
  }, [pathname]);

  const value = React.useMemo(
    () => ({ contextId, setContextId }),
    [contextId, setContextId]
  );

  return (
    <DojoContext.Provider value={value}>{children}</DojoContext.Provider>
  );
}
