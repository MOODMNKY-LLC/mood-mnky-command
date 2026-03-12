"use client";

import { createContext, useContext } from "react";

export type HydaelynUser = {
  id: string;
  email?: string;
  fflogsLinked?: boolean;
} | null;

const HydaelynUserContext = createContext<HydaelynUser>(null);

export function HydaelynUserProvider({
  user,
  children,
}: {
  user: HydaelynUser;
  children: React.ReactNode;
}) {
  return (
    <HydaelynUserContext.Provider value={user}>
      {children}
    </HydaelynUserContext.Provider>
  );
}

export function useHydaelynUser(): HydaelynUser {
  return useContext(HydaelynUserContext);
}
