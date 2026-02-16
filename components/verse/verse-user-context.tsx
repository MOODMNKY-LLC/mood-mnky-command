"use client";

import { createContext, useContext } from "react";
import type { VerseUser } from "./verse-storefront-shell";

const VerseUserContext = createContext<VerseUser>(null);

export function VerseUserProvider({
  user,
  children,
}: {
  user: VerseUser;
  children: React.ReactNode;
}) {
  return (
    <VerseUserContext.Provider value={user}>{children}</VerseUserContext.Provider>
  );
}

export function useVerseUser() {
  return useContext(VerseUserContext);
}
