"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface VerseErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  /** Optional label for granular boundaries (e.g. "content", "hero") */
  sectionLabel?: string;
}

interface VerseErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

function reportClientError(
  error: Error,
  errorInfo: ErrorInfo,
  sectionLabel?: string
): void {
  console.error(
    "[VerseErrorBoundary]",
    sectionLabel ?? "root",
    error.message,
    error.stack,
    errorInfo.componentStack
  );
  const url =
    typeof window !== "undefined" ? window.location.href : "";
  const userAgent =
    typeof navigator !== "undefined" ? navigator.userAgent : "";
  const viewport =
    typeof window !== "undefined"
      ? `${window.innerWidth}x${window.innerHeight}`
      : "";
  fetch("/api/log-client-error", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: error.message,
      stack: error.stack ?? "",
      componentStack: errorInfo.componentStack ?? "",
      userAgent,
      url,
      viewport,
      section: sectionLabel ?? "verse",
    }),
  }).catch(() => {});
}

/**
 * Client error boundary for the verse storefront.
 * Catches client-side exceptions, reports to API for debugging, and renders
 * a minimal fallback. With ?verse_debug=1 shows error details in the UI.
 */
export class VerseErrorBoundary extends Component<
  VerseErrorBoundaryProps,
  VerseErrorBoundaryState
> {
  constructor(props: VerseErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): VerseErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    reportClientError(error, errorInfo, this.props.sectionLabel);
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      const isDev =
        typeof process !== "undefined" &&
        process.env.NODE_ENV === "development";
      const showDebug =
        isDev ||
        (typeof window !== "undefined" &&
          typeof URLSearchParams !== "undefined" &&
          new URLSearchParams(window.location.search).get("verse_debug") ===
            "1");
      const err = this.state.error;
      return (
        <div className="verse-error-fallback flex min-h-[200px] flex-col items-center justify-center gap-4 px-4 py-8 text-center">
          <p className="text-sm font-medium text-verse-text">
            {this.props.sectionLabel === "content"
              ? "Content failed to load."
              : this.props.sectionLabel === "hero"
                ? "Hero section failed to load."
                : "Something went wrong loading this section."}
          </p>
          {showDebug && (
            <pre className="max-h-40 overflow-auto rounded bg-verse-text/10 p-2 text-left text-xs text-verse-text">
              {err.message}
              {err.stack ? `\n\n${err.stack.slice(0, 800)}` : ""}
            </pre>
          )}
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="rounded-md bg-verse-button px-3 py-1.5 text-sm font-medium text-verse-button-text"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/** Fallback when Persona (Rive/WebGL2) fails on mobile — same mascot as hero. */
const PERSONA_FALLBACK = (
  <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-verse-text/5">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src="/verse/mood-mnky-3d.png"
      alt=""
      className="size-full object-contain"
      width={56}
      height={56}
    />
  </div>
);

interface VersePersonaErrorBoundaryProps {
  children: ReactNode;
}

interface VersePersonaErrorBoundaryState {
  hasError: boolean;
}

/** Wrapper to isolate hero (Globe/DottedMap) failures so the rest of the page still loads. */
export function VerseHeroErrorBoundary({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <VerseErrorBoundary sectionLabel="hero">{children}</VerseErrorBoundary>
  );
}

/**
 * Error boundary around Persona only. When Rive/WebGL2 fails (e.g. on mobile),
 * renders a static mascot fallback so the rest of /verse still loads.
 */
export class VersePersonaErrorBoundary extends Component<
  VersePersonaErrorBoundaryProps,
  VersePersonaErrorBoundaryState
> {
  constructor(props: VersePersonaErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): VersePersonaErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[VersePersonaErrorBoundary]", error.message, error.stack, errorInfo.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return PERSONA_FALLBACK;
    }
    return this.props.children;
  }
}
