import { Music, Film, ImageIcon, BookOpen, Disc3 } from "lucide-react"
import { MainNav, MainFooter, MainGlassCard, MediaMusicMarquee } from "@/components/main"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { BlurFade } from "@/components/ui/blur-fade"
import {
  getMainMediaAudio,
  getMainMediaGallery,
  getJellyfinFeaturedItems,
  getJellyfinFeaturedBooks,
  getJellyfinFeaturedMusic,
} from "@/lib/main-media-data"

export const metadata = {
  title: "Media – MOOD MNKY",
  description:
    "A showcase of the media we serve: MNKY MUSIK, Jellyfin music, movies, books, and our art gallery.",
}

export default async function MainMediaPage() {
  const [tracks, jellyfinMusic, jellyfinItems, jellyfinBooks, galleryItems] =
    await Promise.all([
      getMainMediaAudio(),
      getJellyfinFeaturedMusic(undefined, { limit: 8 }),
      getJellyfinFeaturedItems(undefined, { limit: 6 }),
      getJellyfinFeaturedBooks(undefined, { limit: 6 }),
      getMainMediaGallery(12),
    ])

  const jellyfinBase = process.env.JELLYFIN_BASE_URL?.replace(/\/$/, "")

  return (
    <>
      <MainNav />
      <main className="main-container py-12 md:py-16">
        <div className="mx-auto max-w-6xl space-y-20">
          <BlurFade delay={0.03} inView inViewMargin="-20px">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Media
              </h1>
              <p className="text-muted-foreground">
                A showcase of the media we serve across the MNKY VERSE.
              </p>
            </div>
          </BlurFade>

          {/* MNKY MUSIK — horizontal scroll */}
          <BlurFade delay={0.05} inView inViewMargin="-20px">
            <section className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Music className="h-6 w-6 text-foreground" />
                  <h2 className="text-xl font-semibold text-foreground">
                    MNKY MUSIK
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Custom crafted by MOOD MNKY and our AI agents.
                </p>
              </div>
              {tracks.length === 0 ? (
                <MainGlassCard className="main-glass-panel-card p-6 text-center text-sm text-muted-foreground">
                  No tracks in the playlist yet. Check back later.
                </MainGlassCard>
              ) : (
                <div className="-mx-4 md:-mx-6">
                  <MediaMusicMarquee
                    variant="mnky-musik"
                    tracks={tracks}
                    enable3D
                  />
                </div>
              )}
            </section>
          </BlurFade>

          {/* Jellyfin Music — horizontal scroll */}
          <BlurFade delay={0.1} inView inViewMargin="-20px">
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Disc3 className="h-6 w-6 text-foreground" />
                <h2 className="text-xl font-semibold text-foreground">
                  Music
                </h2>
              </div>
              {jellyfinMusic.length === 0 ? (
                <MainGlassCard className="main-glass-panel-card p-6 text-center text-sm text-muted-foreground">
                  No featured music available right now.
                </MainGlassCard>
              ) : (
                <div className="-mx-4 md:-mx-6">
                  <MediaMusicMarquee
                    variant="jellyfin-music"
                    jellyfinItems={jellyfinMusic}
                    jellyfinBaseUrl={jellyfinBase}
                    enable3D
                  />
                </div>
              )}
            </section>
          </BlurFade>

          {/* Featured — movies/series grid with overlay */}
          <BlurFade delay={0.15} inView inViewMargin="-20px">
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Film className="h-6 w-6 text-foreground" />
                <h2 className="text-xl font-semibold text-foreground">
                  Featured
                </h2>
              </div>
              {jellyfinItems.length === 0 ? (
                <MainGlassCard className="main-glass-panel-card p-6 text-center text-sm text-muted-foreground">
                  No featured content available right now.
                </MainGlassCard>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {jellyfinItems.map((item) => (
                    <MainGlassCard
                      key={item.id}
                      className="main-glass-panel-card overflow-hidden p-0"
                    >
                      <div className="relative aspect-video w-full bg-muted">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Film className="h-10 w-10 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-10 backdrop-blur-[2px]">
                          <p className="font-medium text-white drop-shadow">
                            {item.name}
                          </p>
                          {item.overview && (
                            <p className="mt-0.5 line-clamp-2 text-xs text-white/90 drop-shadow">
                              {item.overview}
                            </p>
                          )}
                          {jellyfinBase && (
                            <a
                              href={`${jellyfinBase}/web/index.html#!/item?id=${item.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-block text-xs text-white/95 hover:underline font-medium"
                            >
                              Open in Jellyfin →
                            </a>
                          )}
                        </div>
                      </div>
                    </MainGlassCard>
                  ))}
                </div>
              )}
            </section>
          </BlurFade>

          {/* Books — grid with overlay */}
          <BlurFade delay={0.2} inView inViewMargin="-20px">
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-foreground" />
                <h2 className="text-xl font-semibold text-foreground">
                  Books
                </h2>
              </div>
              {jellyfinBooks.length === 0 ? (
                <MainGlassCard className="main-glass-panel-card p-6 text-center text-sm text-muted-foreground">
                  No featured books available right now.
                </MainGlassCard>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {jellyfinBooks.map((item) => (
                    <MainGlassCard
                      key={item.id}
                      className="main-glass-panel-card overflow-hidden p-0"
                    >
                      <div className="relative aspect-[3/4] w-full bg-muted">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <BookOpen className="h-10 w-10 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-12 backdrop-blur-[2px]">
                          <p className="font-medium text-white drop-shadow">
                            {item.name}
                          </p>
                          {item.overview && (
                            <p className="mt-0.5 line-clamp-2 text-xs text-white/90 drop-shadow">
                              {item.overview}
                            </p>
                          )}
                          {jellyfinBase && (
                            <a
                              href={`${jellyfinBase}/web/index.html#!/item?id=${item.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-block text-xs text-white/95 hover:underline font-medium"
                            >
                              Open in Jellyfin →
                            </a>
                          )}
                        </div>
                      </div>
                    </MainGlassCard>
                  ))}
                </div>
              )}
            </section>
          </BlurFade>

          {/* Art gallery — grid with overlay */}
          <BlurFade delay={0.25} inView inViewMargin="-20px">
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-6 w-6 text-foreground" />
                <h2 className="text-xl font-semibold text-foreground">
                  Art gallery
                </h2>
              </div>
              {galleryItems.length === 0 ? (
                <MainGlassCard className="main-glass-panel-card p-6 text-center text-sm text-muted-foreground">
                  No gallery items yet. Admins can add and describe art in
                  Platform → Main Media.
                </MainGlassCard>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {galleryItems.map((item) => (
                    <Card
                      key={item.id}
                      className="main-glass-panel-card overflow-hidden border border-border"
                    >
                      <div className="relative aspect-square w-full bg-muted">
                        {item.public_url ? (
                          <img
                            src={item.public_url}
                            alt={item.ai_description ?? item.file_name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <ImageIcon className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 pt-12 backdrop-blur-[2px]">
                          <p className="text-sm text-white drop-shadow line-clamp-3">
                            {item.ai_description || "No description yet."}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </BlurFade>
        </div>
      </main>
      <MainFooter />
    </>
  )
}
