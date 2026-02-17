"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface VerseErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface VerseErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Client error boundary for the verse storefront.
 * Catches client-side exceptions (e.g. Globe zero-dimension, Rive/WebGL on mobile),
 * logs the real error for debugging, and renders a minimal fallback so the app
 * doesn't show the generic Next.js "Application error" page.
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
    // Log so it's visible in console when debugging on mobile (e.g. chrome://inspect, Safari Web Inspector)
    console.error("[VerseErrorBoundary]", error.message, error.stack, errorInfo.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      const isDev =
        typeof process !== "undefined" &&
        process.env.NODE_ENV === "development";
      return (
        <div className="verse-error-fallback flex min-h-[200px] flex-col items-center justify-center gap-4 px-4 py-8 text-center">
          <p className="text-sm font-medium text-verse-text">
            Something went wrong loading this section.
          </p>
          {isDev && (
            <pre className="max-h-32 overflow-auto rounded bg-verse-text/10 p-2 text-left text-xs text-verse-text">
              {this.state.error.message}
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
