import Link from "next/link"
import { MessageCircle, Newspaper, Compass } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { MainNav, MainFooter, MainGlassCard } from "@/components/main"
import { Button } from "@/components/ui/button"

const DISCORD_INVITE_URL =
  process.env.NEXT_PUBLIC_DISCORD_INVITE_URL ?? ""

export const metadata = {
  title: "Community – MOOD MNKY",
  description:
    "Our community touchpoints: Discord server, blog, and the MNKY VERSE. Connect with MOOD MNKY.",
}

export default async function MainCommunityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <>
      <MainNav />
      <main className="main-container py-12 md:py-16">
        <div className="mx-auto max-w-3xl space-y-10">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Community
            </h1>
            <p className="text-muted-foreground">
              Connect with MOOD MNKY through our blog, Discord server, and the
              MNKY VERSE. Join the conversation and stay in the loop.
            </p>
          </div>

          {user && (
            <MainGlassCard className="main-glass-panel-card flex flex-col gap-3 p-5">
              <div className="flex items-center gap-2">
                <Compass className="h-5 w-5 text-foreground" />
                <h2 className="font-semibold text-foreground">Your Dojo</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                You’re signed in. Head to your Dojo for quests, Discord linking,
                and member-only features.
              </p>
              <Button asChild className="w-fit">
                <Link href="/dojo/community">Visit your Dojo</Link>
              </Button>
            </MainGlassCard>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            {DISCORD_INVITE_URL ? (
              <MainGlassCard className="main-glass-panel-card flex flex-col gap-4 p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-background/80 text-foreground">
                    <MessageCircle className="h-6 w-6" />
                  </span>
                  <div>
                    <h2 className="font-semibold text-foreground">
                      MOOD MNKY Discord
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Official server
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Chat with the community, get early drops, and connect with
                  other fragrance enthusiasts. Join for events, support, and
                  exclusive updates. Start in #welcome-and-rules, then explore
                  MNKY VERSE and MNKY LABZ channels.
                </p>
                <Button asChild className="w-fit">
                  <a
                    href={DISCORD_INVITE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Join Discord server
                  </a>
                </Button>
              </MainGlassCard>
            ) : null}

            <MainGlassCard className="main-glass-panel-card flex flex-col gap-4 p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-background/80 text-foreground">
                  <Newspaper className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="font-semibold text-foreground">
                    MNKY VERSE Blog
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Stories and guides
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Read about fragrance, blending, and the MNKY VERSE. Guides,
                behind-the-scenes, and community spotlights.
              </p>
              <Button asChild variant="outline" className="w-fit">
                <Link href="/verse/blog">Open blog</Link>
              </Button>
            </MainGlassCard>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            More community features—quests, manga, and UGC—live in the Dojo and
            on the MNKY VERSE. Sign in to unlock your Dojo.
          </p>
        </div>
      </main>
      <MainFooter />
    </>
  )
}
