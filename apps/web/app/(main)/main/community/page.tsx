import Link from "next/link"
import Image from "next/image"
import { MessageCircle, Newspaper, Compass } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { MainNav, MainFooter, MainGlassCard } from "@/components/main"
import { Button } from "@/components/ui/button"
import { getMainCommunityImageUrls } from "@/lib/app-asset-slots"

const DISCORD_INVITE_URL =
  process.env.NEXT_PUBLIC_DISCORD_INVITE_URL ?? ""

const COMMUNITY_PLACEHOLDER = "/images/community/placeholder.svg"

export const metadata = {
  title: "Community – MOOD MNKY",
  description:
    "Our community touchpoints: Discord server, blog, and the Dojo. Connect with MOOD MNKY.",
}

function CommunitySectionImage({
  src,
  alt = "",
}: {
  src: string
  alt?: string
}) {
  const isRemote = src.startsWith("http") || src.startsWith("//")
  return (
    <div className="relative w-full shrink-0 overflow-hidden rounded-t-lg" style={{ aspectRatio: "16/10" }}>
      {isRemote ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      )}
    </div>
  )
}

export default async function MainCommunityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const imageUrls = await getMainCommunityImageUrls()

  const heroUrl = imageUrls.hero ?? null
  const discordUrl = imageUrls.discord ?? COMMUNITY_PLACEHOLDER
  const blogUrl = imageUrls.blog ?? COMMUNITY_PLACEHOLDER
  const dojoUrl = imageUrls.dojo ?? COMMUNITY_PLACEHOLDER

  return (
    <>
      <MainNav />
      <main className="main-container py-12 md:py-16">
        <div className="mx-auto max-w-4xl space-y-10">
          {heroUrl ? (
            <div className="relative w-full overflow-hidden rounded-xl border border-border" style={{ aspectRatio: "21/9" }}>
              {heroUrl.startsWith("http") || heroUrl.startsWith("//") ? (
                <img
                  src={heroUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  sizes="100vw"
                />
              ) : (
                <Image
                  src={heroUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="100vw"
                />
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 p-6 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow md:text-4xl">
                  Community
                </h1>
                <p className="mt-2 max-w-xl text-sm text-white/90 drop-shadow">
                  Connect with MOOD MNKY through our blog, Discord server, and the Dojo.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Community
              </h1>
              <p className="text-muted-foreground">
                Connect with MOOD MNKY through our blog, Discord server, and the
                Dojo. Join the conversation and stay in the loop.
              </p>
            </div>
          )}

          {user && (
            <MainGlassCard className="main-glass-panel-card flex flex-col overflow-hidden border border-border p-0">
              <CommunitySectionImage src={dojoUrl} alt="" />
              <div className="flex flex-col gap-3 p-5">
                <div className="flex items-center gap-2">
                  <Compass className="h-5 w-5 text-foreground" />
                  <h2 className="font-semibold text-foreground">Your Dojo</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  You’re signed in. Head to your Dojo for quests, Discord linking,
                  and member-only features.
                </p>
                <Button asChild className="w-fit">
                  <Link href="/dojo/me">Visit your Dojo</Link>
                </Button>
              </div>
            </MainGlassCard>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            {DISCORD_INVITE_URL ? (
              <MainGlassCard className="main-glass-panel-card flex flex-col overflow-hidden border border-border p-0">
                <CommunitySectionImage src={discordUrl} alt="" />
                <div className="flex flex-col gap-4 p-5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-background/80 text-foreground">
                      <MessageCircle className="h-6 w-6" />
                    </span>
                    <div className="min-w-0">
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
                    Dojo and MNKY LABZ channels.
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
                </div>
              </MainGlassCard>
            ) : null}

            <MainGlassCard className="main-glass-panel-card flex flex-col overflow-hidden border border-border p-0">
              <CommunitySectionImage src={blogUrl} alt="" />
              <div className="flex flex-col gap-4 p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-background/80 text-foreground">
                    <Newspaper className="h-6 w-6" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-semibold text-foreground">
                      Dojo Blog
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Stories and guides
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Read about fragrance, blending, and the Dojo. Guides,
                  behind-the-scenes, and community spotlights.
                </p>
                <Button asChild variant="outline" className="w-fit">
                  <Link href="/dojo/blog">Open blog</Link>
                </Button>
              </div>
            </MainGlassCard>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            More community features—quests, manga, and UGC—live in the Dojo.
            Sign in to unlock your Dojo hub.
          </p>
        </div>
      </main>
      <MainFooter />
    </>
  )
}
