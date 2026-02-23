import { notFound } from "next/navigation"
import Link from "next/link"
import { MainNav, MainFooter } from "@/components/main"
import { MainGlassCard } from "@/components/main/main-glass-card"
import { MAIN_SERVICES } from "@/lib/main-services-data"
import { getServiceStatus } from "@/lib/services"

type PageProps = { params: Promise<{ slug: string }> }

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

export default async function MainServiceDetailPage({ params }: PageProps) {
  const { slug } = await params
  const service = MAIN_SERVICES.find((s) => s.id === slug)
  if (!service) notFound()

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
          <header>
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {service.name}
            </h1>
            <p className="mt-2 text-lg font-medium text-muted-foreground">
              {service.tagline}
            </p>
            <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">
              {service.description}
            </p>
            {service.features.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2" aria-label="Features">
                {service.features.map((feature) => (
                  <li
                    key={feature}
                    className="rounded-md border border-border bg-background/60 px-2.5 py-1 text-xs text-foreground"
                  >
                    {feature}
                  </li>
                ))}
              </ul>
            )}
          </header>

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
        </div>
      </main>
      <MainFooter />
    </>
  )
}
