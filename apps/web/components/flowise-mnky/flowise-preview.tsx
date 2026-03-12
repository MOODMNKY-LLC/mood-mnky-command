"use client";

import type { ComponentProps, ReactNode } from "react";
import {
  WebPreview,
  WebPreviewBody,
  WebPreviewNavigation,
  WebPreviewUrl,
} from "@/components/ai-elements/web-preview";
import { cn } from "@/lib/utils";

export interface FlowisePreviewProps extends Omit<ComponentProps<"div">, "children"> {
  /** URL to preview (e.g. from Flowise tool output, v0-style generation, or chatflow). */
  url: string;
  /** Optional loading UI (avoids conflict with iframe loading attribute). */
  loadingUI?: ReactNode;
  /** Optional callback when URL changes (e.g. user edits in nav). */
  onUrlChange?: (url: string) => void;
  /** Show navigation bar with URL input. Default true. */
  showNavigation?: boolean;
}

/**
 * Live preview of chatflow output using Elements WebPreview.
 * Use when Flowise returns a preview URL (e.g. from tools that generate HTML pages,
 * v0-style generation, or a dedicated previewUrl stream event).
 */
export function FlowisePreview({
  url,
  loadingUI,
  onUrlChange,
  showNavigation = true,
  className,
  ...props
}: FlowisePreviewProps) {
  if (!url?.trim()) {
    return null;
  }

  return (
    <WebPreview
      defaultUrl={url}
      onUrlChange={onUrlChange}
      className={cn("min-h-[300px] overflow-hidden", className)}
      {...props}
    >
      {showNavigation && (
        <WebPreviewNavigation>
          <WebPreviewUrl />
        </WebPreviewNavigation>
      )}
      <WebPreviewBody src={url} loading={loadingUI} />
    </WebPreview>
  );
}
