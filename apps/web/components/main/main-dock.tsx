"use client"

import { usePathname } from "next/navigation"
import { Dock, DockIcon } from "@/components/ui/dock"
import { VerseLogoHairIcon } from "@/components/verse/verse-logo-hair-icon"
import { useMainTalkToAgent } from "@/components/main/main-talk-to-agent-context"
import { cn } from "@/lib/utils"

const DOCK_ICON_SIZE = 48

/**
 * Bottom dock on Main section with one icon that opens the Talk to MOOD MNKY dialog.
 */
export function MainDock() {
  const pathname = usePathname()
  const talk = useMainTalkToAgent()

  const isMain = pathname?.startsWith("/main") ?? false
  if (!isMain || !talk) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex justify-center pt-6"
      style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="pointer-events-auto flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-border main-glass-panel">
        <Dock
          className="mt-0 h-full min-h-0 w-full max-w-full shrink-0 gap-0 overflow-hidden rounded-full border-0 bg-transparent p-0 shadow-none"
          iconSize={DOCK_ICON_SIZE}
          iconMagnification={DOCK_ICON_SIZE}
          disableMagnification
        >
          <DockIcon className="flex items-center justify-center">
            <button
              type="button"
              onClick={talk.openDialog}
              className={cn(
                "flex items-center justify-center rounded-full bg-background/80 text-foreground shadow-md transition-colors hover:bg-background/90",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              )}
              style={{ width: DOCK_ICON_SIZE, height: DOCK_ICON_SIZE }}
              aria-label="Talk to MOOD MNKY"
              title="Talk to MOOD MNKY"
            >
              <VerseLogoHairIcon
                withRing
                size="lg"
                className="text-foreground"
                ringClassName="border-foreground/80"
              />
            </button>
          </DockIcon>
        </Dock>
      </div>
    </div>
  )
}
