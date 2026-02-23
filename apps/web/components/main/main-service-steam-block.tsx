import Link from "next/link"
import { MainGlassCard } from "@/components/main/main-glass-card"
import { Button } from "@/components/ui/button"
import { SiSteam } from "react-icons/si"
import type { SteamProfileCache } from "@/lib/steam"

const PERSONA_STATE_LABELS: Record<number, string> = {
  0: "Offline",
  1: "Online",
  2: "Busy",
  3: "Away",
  4: "Snooze",
  5: "Looking to trade",
  6: "Looking to play",
}

export function MainServiceSteamBlockLink({
  steamLinked,
  steamProfileCache,
  steamMessage,
}: {
  steamLinked: boolean
  steamProfileCache: SteamProfileCache | null
  steamMessage?: string | null
}) {
  return (
    <section aria-label="Steam account" className="max-w-xl">
      <MainGlassCard className="main-float main-glass-panel-card flex flex-col gap-3 border border-border p-5">
        <div className="flex items-center gap-2">
          <SiSteam className="h-5 w-5 text-muted-foreground" aria-hidden />
          <h2 className="text-sm font-semibold text-foreground">Steam</h2>
        </div>

        {steamMessage === "linked" && (
          <p className="text-sm text-green-600 dark:text-green-400">Steam account linked successfully.</p>
        )}
        {steamMessage === "unlinked" && (
          <p className="text-sm text-muted-foreground">Steam account unlinked.</p>
        )}
        {steamMessage === "error" && (
          <p className="text-sm text-destructive">Something went wrong. You can try linking again.</p>
        )}

        {!steamLinked ? (
          <>
            <p className="text-sm text-muted-foreground">
              Link your Steam account to show a &quot;Now Playing&quot; profile and Steam Verified badge on MNKY GAMES.
            </p>
            <Button variant="outline" className="main-btn-glass w-fit" asChild>
              <Link href="/api/auth/steam/link">Link Steam account</Link>
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">Your Steam account is linked.</p>
            {steamProfileCache && (
              <div className="flex items-center gap-3 rounded-md border border-border bg-background/60 p-3">
                {steamProfileCache.avatarfull ? (
                  <img
                    src={steamProfileCache.avatarfull}
                    alt=""
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 shrink-0 rounded-full bg-muted" aria-hidden />
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {steamProfileCache.personaname || "Steam user"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {PERSONA_STATE_LABELS[steamProfileCache.personastate] ?? "Steam"}
                  </p>
                </div>
              </div>
            )}
            <form action="/api/me/steam/unlink" method="POST" className="text-xs text-muted-foreground">
              <button type="submit" className="underline hover:text-foreground">
                Unlink Steam
              </button>
            </form>
          </>
        )}
      </MainGlassCard>
    </section>
  )
}
