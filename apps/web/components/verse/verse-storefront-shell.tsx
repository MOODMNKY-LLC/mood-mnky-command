"use client";

import { Suspense } from "react";
import { VerseHeader } from "./verse-header";
import { VerseFooter } from "./verse-footer";
import { VerseAnnouncementBar } from "./verse-announcement-bar";
import { VerseAdminDock } from "./verse-admin-dock";
import { VerseUserProvider } from "./verse-user-context";
import { VersePersonaStateProvider } from "./verse-persona-state-context";
import { useVerseTheme } from "./verse-theme-provider";
import { VerseErrorBoundary } from "./verse-error-boundary";

export type VerseUser = {
  id: string;
  email?: string;
  displayName?: string;
  isAdmin?: boolean;
} | null;

export function VerseStorefrontShell({
  children,
  isAdmin = false,
  user = null,
  shopifyLinked = false,
}: {
  children: React.ReactNode;
  isAdmin?: boolean;
  user?: VerseUser;
  shopifyLinked?: boolean;
}) {
  const { theme } = useVerseTheme();

  return (
    <div
      className="verse-storefront relative flex min-h-screen flex-col bg-verse-bg"
      data-verse
      data-verse-theme={theme}
    >
      <VersePersonaStateProvider>
        <VerseErrorBoundary>
          <div className="relative z-10 flex min-h-screen flex-col overflow-x-hidden">
            <VerseAnnouncementBar />
            <Suspense fallback={<header className="h-16" />}>
              <VerseHeader isAdmin={isAdmin} user={user} shopifyLinked={shopifyLinked} />
            </Suspense>
            <VerseErrorBoundary sectionLabel="content">
              <main className="flex-1">
                <VerseUserProvider user={user}>{children}</VerseUserProvider>
              </main>
            </VerseErrorBoundary>
            <VerseFooter />
            <VerseAdminDock isAdmin={isAdmin} user={user} />
          </div>
        </VerseErrorBoundary>
      </VersePersonaStateProvider>
    </div>
  );
}
