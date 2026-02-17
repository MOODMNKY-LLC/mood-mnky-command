"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DISMISS_KEY = "verse-pwa-install-dismissed";
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

export function VersePwaInstall() {
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
      className="fixed bottom-0 left-0 right-0 z-[100] px-4 pb-4"
      style={{
        paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="verse-pwa-install mx-auto max-w-[var(--verse-page-width,1600px)] rounded-lg border border-verse-text/20 bg-verse-bg/95 px-4 py-3 shadow-lg backdrop-blur-sm">
        {showInstall ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-verse-text">
              Install MNKY VERSE for a better experience
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleInstall}
                disabled={installing}
                className="rounded-md bg-verse-button px-3 py-1.5 text-sm font-medium text-verse-button-text disabled:opacity-70"
              >
                {installing ? "Installing…" : "Add to Home Screen"}
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="text-sm text-verse-text-muted hover:text-verse-text"
              >
                Don&apos;t show again
              </button>
            </div>
          </div>
        ) : showIosHint ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-verse-text">
              Add to Home Screen: tap <strong>Share</strong> then{" "}
              <strong>Add to Home Screen</strong>.
            </p>
            <button
              type="button"
              onClick={dismiss}
              className="shrink-0 text-sm text-verse-text-muted hover:text-verse-text"
            >
              Dismiss
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
