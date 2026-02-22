"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FlaskConical,
  Home,
  Compass,
  Swords,
  ShoppingBag,
  ShoppingCart,
  Store,
} from "lucide-react";
import { Persona } from "@/components/ai-elements/persona";
import { VerseLogoHairIcon } from "@/components/verse/verse-logo-hair-icon";
import { Dock, DockIcon } from "@/components/ui/dock";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useVersePersonaState } from "@/components/verse/verse-persona-state-context";
import { useVerseTheme } from "@/components/verse/verse-theme-provider";
import { VerseChatPopup } from "@/components/verse/verse-chat-popup";
import { VerseRealtimeVoiceCard } from "@/components/verse/verse-realtime-voice-card";
import { cn } from "@/lib/utils";
import { DEFAULT_AGENT_SLUG } from "@/lib/agents";
import type { VerseUser } from "./verse-storefront-shell";

export function VerseAdminDock({
  isAdmin = false,
  user = null,
}: {
  isAdmin?: boolean;
  user?: VerseUser;
}) {
  const { personaState } = useVersePersonaState();
  const { theme } = useVerseTheme();
  const [realtimeOpen, setRealtimeOpen] = useState(false);

  return (
    <div
      className="verse-dock pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex justify-center pt-8"
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="pointer-events-auto">
        <Dock
          className={cn(
            "shadow-2xl backdrop-blur-2xl",
            theme === "dark"
              ? "border-[var(--verse-border)] bg-[var(--verse-bg)]/90 shadow-black/20"
              : "border-verse-text/20 bg-slate-200/90 shadow-black/5"
          )}
          iconSize={36}
          iconMagnification={48}
        >
          {/* Left: Chat (1st), Dojo (2nd), then nav */}
          {isAdmin ? (
            <>
              <DockIcon>
                <VerseChatPopup
                  user={user ?? undefined}
                  trigger={
                    <button
                      type="button"
                      className="flex size-full items-center justify-center rounded-full border-0 bg-transparent text-verse-text cursor-pointer"
                      aria-label="Open chat"
                    >
                      <VerseLogoHairIcon size="sm" withRing />
                    </button>
                  }
                />
              </DockIcon>
              {user && (
                <DockIcon>
                  <Link
                    href="/dojo"
                    className="flex size-full items-center justify-center text-verse-text"
                    title="Your Dojo"
                  >
                    <Swords className="h-5 w-5" />
                  </Link>
                </DockIcon>
              )}
              <DockIcon>
                <Link
                  href="/main"
                  className="flex size-full items-center justify-center text-verse-text"
                  title="Home (MOOD MNKY)"
                >
                  <Home className="h-5 w-5" />
                </Link>
              </DockIcon>
              <DockIcon>
                <Link
                  href="/"
                  className="flex size-full items-center justify-center text-verse-text"
                  title="MOOD MNKY LABZ"
                >
                  <FlaskConical className="h-5 w-5" />
                </Link>
              </DockIcon>
            </>
          ) : (
            <>
              <DockIcon>
                <VerseChatPopup
                  user={user ?? undefined}
                  trigger={
                    <button
                      type="button"
                      className="flex size-full items-center justify-center rounded-full border-0 bg-transparent text-verse-text cursor-pointer"
                      aria-label="Open chat"
                    >
                      <VerseLogoHairIcon size="sm" withRing />
                    </button>
                  }
                />
              </DockIcon>
              {user && (
                <DockIcon>
                  <Link
                    href="/dojo"
                    className="flex size-full items-center justify-center text-verse-text"
                    title="Your Dojo"
                  >
                    <Swords className="h-5 w-5" />
                  </Link>
                </DockIcon>
              )}
              <DockIcon>
                <Link
                  href="/main"
                  className="flex size-full items-center justify-center text-verse-text"
                  title="Home (MOOD MNKY)"
                >
                  <Home className="h-5 w-5" />
                </Link>
              </DockIcon>
              <DockIcon>
                <Link
                  href="/verse"
                  className="flex size-full items-center justify-center text-verse-text"
                  title="VERSE"
                >
                  <Store className="h-5 w-5" />
                </Link>
              </DockIcon>
              <DockIcon>
                <Link
                  href="/verse/explore"
                  className="flex size-full items-center justify-center text-verse-text"
                  title="Explore"
                >
                  <Compass className="h-5 w-5" />
                </Link>
              </DockIcon>
            </>
          )}
          <DockIcon>
            <button
              type="button"
              onClick={() => setRealtimeOpen(true)}
              className="relative flex min-w-24 min-h-24 w-24 h-24 items-center justify-center rounded-full border-0 bg-transparent cursor-pointer"
              aria-label="Open voice chat"
            >
              <Persona
                state={personaState}
                variant="halo"
                className="size-24 shrink-0 pointer-events-none"
                themeColorVariable="--verse-text-rgb"
              />
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <VerseLogoHairIcon size="md" className="text-verse-text" />
              </span>
            </button>
          </DockIcon>
          <Dialog open={realtimeOpen} onOpenChange={setRealtimeOpen}>
            <DialogContent
              className="verse-storefront verse-voice-dialog max-w-md gap-0 overflow-hidden border-[var(--verse-border)] bg-[var(--verse-bg)] p-0 shadow-2xl [&>button]:text-[var(--verse-text)] [&>button]:opacity-90 [&>button:hover]:opacity-100 sm:rounded-xl"
              data-verse-theme={theme}
              aria-describedby={undefined}
            >
              <DialogTitle className="sr-only">Voice chat with MNKY</DialogTitle>
              <div className="p-4 pt-12">
                <VerseRealtimeVoiceCard
                  agentSlug={DEFAULT_AGENT_SLUG}
                  onClose={() => setRealtimeOpen(false)}
                />
              </div>
            </DialogContent>
          </Dialog>
          {/* Right: Shop, Cart */}
          <DockIcon>
            <Link
              href="/verse/products"
              className="flex size-full items-center justify-center text-verse-text"
              title="Shop"
            >
              <ShoppingBag className="h-5 w-5" />
            </Link>
          </DockIcon>
          <DockIcon>
            <Link
              href="/verse/cart"
              className="flex size-full items-center justify-center text-verse-text"
              title="Cart"
            >
              <ShoppingCart className="h-5 w-5" />
            </Link>
          </DockIcon>
        </Dock>
      </div>
    </div>
  );
}
