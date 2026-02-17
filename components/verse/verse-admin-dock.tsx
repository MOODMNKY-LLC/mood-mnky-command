"use client";

import Link from "next/link";
import {
  FlaskConical,
  Home,
  Compass,
  ShoppingBag,
  ShoppingCart,
  Store,
} from "lucide-react";
import { Persona } from "@/components/ai-elements/persona";
import { VerseLogoHairIcon } from "@/components/verse/verse-logo-hair-icon";
import { Dock, DockIcon } from "@/components/ui/dock";
import { useVersePersonaState } from "@/components/verse/verse-persona-state-context";
import { VerseChatPopup } from "@/components/verse/verse-chat-popup";
import type { VerseUser } from "./verse-storefront-shell";

export function VerseAdminDock({
  isAdmin = false,
  user = null,
}: {
  isAdmin?: boolean;
  user?: VerseUser;
}) {
  const { personaState } = useVersePersonaState();

  return (
    <div className="verse-dock pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex justify-center pb-4 pt-8">
      <div className="pointer-events-auto">
        <Dock
          className="border-verse-text/20 bg-slate-200/90 dark:bg-neutral-800/90 shadow-lg shadow-verse-text/10 backdrop-blur-md"
          iconSize={36}
          iconMagnification={48}
        >
          {isAdmin ? (
            <>
              <DockIcon>
                <Link
                  href="/"
                  className="flex size-full items-center justify-center text-verse-text"
                  title="MOOD MNKY LABZ"
                >
                  <FlaskConical className="h-5 w-5" />
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
            </>
          ) : (
            <>
              <DockIcon>
                <Link
                  href="/verse"
                  className="flex size-full items-center justify-center text-verse-text"
                  title="Home"
                >
                  <Home className="h-5 w-5" />
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
          <div
            className="relative flex min-w-24 min-h-24 w-24 h-24 items-center justify-center rounded-full"
            aria-hidden
          >
            <Persona
              state={personaState}
              variant="halo"
              className="size-24 shrink-0"
              themeColorVariable="--verse-text-rgb"
            />
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <VerseLogoHairIcon size="md" className="text-verse-text" />
            </span>
          </div>
          {isAdmin ? (
            <>
              <DockIcon>
                <Link
                  href="/store"
                  className="flex size-full items-center justify-center text-verse-text"
                  title="Store Admin"
                >
                  <Store className="h-5 w-5" />
                </Link>
              </DockIcon>
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
            </>
          ) : (
            <>
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
            </>
          )}
        </Dock>
      </div>
    </div>
  );
}
