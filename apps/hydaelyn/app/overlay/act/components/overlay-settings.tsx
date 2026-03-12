"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy } from "lucide-react";
import type { OverlayTheme } from "../types";

type OverlaySettingsProps = {
  token: string;
  theme: OverlayTheme;
  onThemeChange: (t: OverlayTheme) => void;
  collapsed: boolean;
  onCollapsedChange: (v: boolean) => void;
  nameBlur: boolean;
  onNameBlurChange: (v: boolean) => void;
  hasWs: boolean;
  /** True when URL has HOST_PORT (overlay loaded inside ACT) */
  hasHostPort?: boolean;
  onCopyToken: () => void;
};

export function OverlaySettings({
  token,
  theme,
  onThemeChange,
  collapsed,
  onCollapsedChange,
  nameBlur,
  onNameBlurChange,
  hasWs,
  hasHostPort = false,
  onCopyToken,
}: OverlaySettingsProps) {
  return (
    <div className="mt-3 space-y-4">
      <div className="space-y-2">
        <Label className="text-white/80">Theme</Label>
        <select
          value={theme}
          onChange={(e) => onThemeChange(e.target.value as OverlayTheme)}
          className="flex h-10 w-full items-center justify-between rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/30"
        >
          <option value="minimal">Minimal</option>
          <option value="light">Light</option>
          <option value="classic">Classic</option>
        </select>
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-white/80">
          <input
            type="checkbox"
            checked={collapsed}
            onChange={(e) => onCollapsedChange(e.target.checked)}
            className="rounded border-white/20"
          />
          Collapse panel
        </label>
      </div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-white/80">
          <input
            type="checkbox"
            checked={nameBlur}
            onChange={(e) => onNameBlurChange(e.target.checked)}
            className="rounded border-white/20"
          />
          Blur names
        </label>
      </div>
      <div className="space-y-2">
        <Label className="text-white/80">Overlay token</Label>
        <div className="flex gap-2">
          <Input
            readOnly
            value={token}
            className="font-mono text-xs bg-white/10 border-white/20"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 border-white/20 text-white hover:bg-white/10"
            onClick={onCopyToken}
            aria-label="Copy token"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {!hasWs && (
        <p className="text-xs text-white/60">
          Using in OBS or a browser? Add{" "}
          <code className="bg-white/10 px-1 rounded">
            &OVERLAY_WS=ws://127.0.0.1:10501/ws
          </code>{" "}
          to the URL and start WSServer in OverlayPlugin.
        </p>
      )}
      {hasHostPort && (
        <p className="text-xs text-white/60">
          Loaded in ACT: the address bar may show &amp;HOST_PORT=ws://127.0.0.1/fake/ — that is added by OverlayPlugin and is normal.
        </p>
      )}
    </div>
  );
}
