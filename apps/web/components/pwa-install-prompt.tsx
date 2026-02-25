"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DISMISS_KEY = "pwa-install-dismissed";
const DISMISS_DAYS = 7;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<{ outcome: "accepted" | "dismissed" }>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function wasDismissedRecently(): boolean {
  if (typeof localStorage === "undefined") return true;
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (Number.isNaN(ts)) return false;
    return Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

/**
 * Shared PWA install prompt for Main, Dojo, and LABZ. Uses theme-agnostic
 * tokens so it looks correct in both Main and Dojo palettes. Shown only when
 * not standalone and not dismissed recently.
 */
export function PwaInstallPrompt() {
  const [showInstall, setShowInstall] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);
  const installPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // ignore
    }
    setShowInstall(false);
    setShowIosHint(false);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) return;
    if (wasDismissedRecently()) return;

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      installPromptRef.current = e as BeforeInstallPromptEvent;
      setShowInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    if (isIos() && !installPromptRef.current) {
      setShowIosHint(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    const ev = installPromptRef.current;
    if (!ev) return;
    setInstalling(true);
    try {
      await ev.prompt();
      installPromptRef.current = null;
      setShowInstall(false);
      dismiss();
    } catch {
      // ignore
    } finally {
      setInstalling(false);
    }
  }, [dismiss]);

  if (!showInstall && !showIosHint) return null;

  return (
    <div
      className="fixed left-1/2 top-1/2 z-[100] w-[min(90vw,320px)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-background/95 px-4 py-3 shadow-xl backdrop-blur-sm"
      style={{
        marginTop: "env(safe-area-inset-top, 0px)",
        marginLeft: "env(safe-area-inset-left, 0px)",
      }}
    >
      {showInstall ? (
        <div className="flex flex-col items-stretch gap-3 text-center">
          <p className="text-sm font-medium text-foreground">
            Add MOOD MNKY to your home screen for a smoother experience
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleInstall}
              disabled={installing}
              className="min-h-[44px] min-w-[44px] rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-70"
            >
              {installing ? "Installing…" : "Add to Home Screen"}
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="min-h-[44px] rounded-md px-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Not now
            </button>
          </div>
        </div>
      ) : showIosHint ? (
        <div className="flex flex-col items-stretch gap-2 text-center">
          <p className="text-sm text-foreground">
            To install: tap <strong>Share</strong>, then{" "}
            <strong>Add to Home Screen</strong>.
          </p>
          <button
            type="button"
            onClick={dismiss}
            className="min-h-[44px] rounded-md text-sm text-muted-foreground hover:text-foreground"
          >
            Dismiss
          </button>
        </div>
      ) : null}
    </div>
  );
}
