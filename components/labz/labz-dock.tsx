"use client";

import { cn } from "@/lib/utils";
import { Dock, DockIcon } from "@/components/ui/dock";
import { Persona } from "@/components/ai-elements/persona";
import { LabzChatPopup } from "@/components/labz/labz-chat-popup";
import { LabzStatusRing } from "@/components/labz/labz-status-ring";
import { LabzDockAvatar, LABZ_DOCK_CANONICAL_SIZE_PX } from "@/components/labz/labz-dock-avatar";
import { useLabzPersonaState } from "@/components/labz/labz-persona-state-context";

/** Outer size includes 2px ring stroke so inner content matches canonical diameter. */
const DOCK_ICON_SIZE_PX = LABZ_DOCK_CANONICAL_SIZE_PX + 4;

/**
 * Optional dock at bottom-center of dashboard with a single round icon that opens CODE MNKY (the MNKY LABZ virtual assistant).
 * Status ring, Persona circle, and avatar share one aligned circumference (canonical 64px).
 * Ring colors: blue=ready, green=active, red=record/error, yellow=warning.
 */
export function LabzDock() {
  const { personaState, statusOverride } = useLabzPersonaState();

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex justify-center pt-8"
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="pointer-events-auto">
        <Dock
          className="rounded-full border-0 bg-transparent shadow-none backdrop-blur-none p-0"
          iconSize={DOCK_ICON_SIZE_PX}
          iconMagnification={DOCK_ICON_SIZE_PX}
          disableMagnification
        >
          <DockIcon className="flex items-center justify-center p-0">
            <LabzChatPopup
              trigger={
                <button
                  type="button"
                  className={cn(
                    "relative flex items-center justify-center rounded-full border-0 bg-transparent text-foreground cursor-pointer hover:opacity-90",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  )}
                  style={{ width: DOCK_ICON_SIZE_PX, height: DOCK_ICON_SIZE_PX }}
                  aria-label="CODE MNKY – MNKY LABZ virtual assistant"
                  title="CODE MNKY – MNKY LABZ virtual assistant"
                >
                  <LabzStatusRing
                    state={personaState}
                    statusOverride={statusOverride}
                    className="box-border flex items-center justify-center overflow-hidden rounded-full bg-background/90 shadow-lg backdrop-blur-md"
                    style={{
                      width: DOCK_ICON_SIZE_PX,
                      height: DOCK_ICON_SIZE_PX,
                    }}
                  >
                    <div
                      className="relative flex items-center justify-center rounded-full"
                      style={{
                        width: LABZ_DOCK_CANONICAL_SIZE_PX,
                        height: LABZ_DOCK_CANONICAL_SIZE_PX,
                      }}
                    >
                      <Persona
                        state={personaState}
                        variant="halo"
                        className="pointer-events-none shrink-0 !size-16"
                        themeColorVariable="--primary"
                      />
                      <span
                        className="pointer-events-none absolute inset-0 flex items-center justify-center"
                        style={{
                          width: LABZ_DOCK_CANONICAL_SIZE_PX,
                          height: LABZ_DOCK_CANONICAL_SIZE_PX,
                        }}
                      >
                        <LabzDockAvatar
                          src="/code-mnky.png"
                          alt=""
                          size={LABZ_DOCK_CANONICAL_SIZE_PX}
                        />
                      </span>
                    </div>
                  </LabzStatusRing>
                </button>
              }
            />
          </DockIcon>
        </Dock>
      </div>
    </div>
  );
}
