import { notFound } from "next/navigation"
import Link from "next/link"
import { MainNav, MainFooter } from "@/components/main"
import { MainGlassCard } from "@/components/main/main-glass-card"
import { MainServiceDetailHeader } from "@/components/main/main-service-detail-header"
import { MainServiceSteamBlockLink } from "@/components/main/main-service-steam-block"
import { MAIN_SERVICES } from "@/lib/main-services-data"
import { getMainServiceImageUrls } from "@/lib/app-asset-slots"
import { getServiceStatus } from "@/lib/services"
import { createClient } from "@/lib/supabase/server"
import type { SteamProfileCache } from "@/lib/steam"

type PageProps = {
  params: Promise<{ slug: string }>
  searchParams?: Promise<{ steam?: string; message?: string }>
}

export async function generateStaticParams() {
  return MAIN_SERVICES.map((s) => ({ slug: s.id }))
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const service = MAIN_SERVICES.find((s) => s.id === slug)
  if (!service) return { title: "Service – MOOD MNKY" }
  return {
    title: `${service.name} – MOOD MNKY`,
    description: service.tagline,
  }
}

export default async function MainServiceDetailPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const base = MAIN_SERVICES.find((s) => s.id === slug)
  if (!base) notFound()
  const imageUrls = await getMainServiceImageUrls()
  const service = {
    ...base,
    bundleImageUrl: imageUrls[base.id] ?? base.bundleImageUrl,
  }

  const resolvedSearchParams = searchParams ? await searchParams : {}
  const steamMessage = resolvedSearchParams?.steam ?? null

  let steamData: {
    steamLinked: boolean
    steamProfileCache: SteamProfileCache | null
  } | null = null
  if (slug === "mnky-games") {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("steamid64, steam_profile_cache")
        .eq("id", user.id)
        .single()
      steamData = {
        steamLinked: !!profile?.steamid64,
        steamProfileCache: (profile?.steam_profile_cache as SteamProfileCache | null) ?? null,
      }
    }
  }

  let statusPayload: { configured: boolean; status?: string; metrics?: Record<string, number | string>; error?: string } = { configured: false }
  try {
    statusPayload = await getServiceStatus(slug)
  } catch {
    // Omit live block on error
  }

  return (
    <>
      <MainNav />
      <main className="main-container w-full max-w-[1600px] mx-auto py-12 md:py-16 px-4">
        <div className="mb-8">
          <Link
            href="/main/services"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Services
          </Link>
        </div>
        <div className="flex flex-col gap-8">
          <MainServiceDetailHeader service={service} />

          {statusPayload.configured && (
            <section aria-label="Service status" className="max-w-xl">
              <MainGlassCard className="main-float main-glass-panel-card flex flex-col gap-3 border border-border p-5">
                <h2 className="text-sm font-semibold text-foreground">Status</h2>
                <p className="text-sm text-muted-foreground">
                  {statusPayload.error
                    ? "Unavailable"
                    : statusPayload.status ?? "—"}
                </p>
                {statusPayload.metrics && Object.keys(statusPayload.metrics).length > 0 && (
                  <dl className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(statusPayload.metrics).map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}
                        </dt>
                        <dd className="font-medium text-foreground">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </MainGlassCard>
            </section>
          )}

          {slug === "mnky-cloud" && (
            <section aria-label="Mobile app" className="max-w-xl">
              <MainGlassCard className="main-float main-glass-panel-card flex flex-col gap-3 border border-border p-5">
                <h2 className="text-sm font-semibold text-foreground">Connect your device</h2>
                <p className="text-sm text-muted-foreground">
                  Add MNKY CLOUD to the Nextcloud mobile app:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Install the Nextcloud app from your device store.</li>
                  <li>Open the app and choose &quot;Add account&quot; or &quot;Log in&quot;.</li>
                  <li>Scan the QR code below, or enter the MNKY CLOUD server URL when prompted.</li>
                  <li>Sign in with your Nextcloud username and app password.</li>
                </ul>
                <div className="relative h-40 w-40 shrink-0">
                  <img
                    src="/images/nextcloud-mobile-app-qr.png"
                    alt="QR code to add MNKY CLOUD in the Nextcloud mobile app"
                    width={160}
                    height={160}
                    className="h-40 w-40 object-contain"
                  />
                </div>
              </MainGlassCard>
            </section>
          )}

          {slug === "mnky-games" && steamData !== null && (
            <MainServiceSteamBlockLink
              steamLinked={steamData.steamLinked}
              steamProfileCache={steamData.steamProfileCache}
              steamMessage={steamMessage === "error" ? "error" : steamMessage === "linked" || steamMessage === "unlinked" ? steamMessage : undefined}
            />
          )}
        </div>
      </main>
      <MainFooter />
    </>
  )
}
