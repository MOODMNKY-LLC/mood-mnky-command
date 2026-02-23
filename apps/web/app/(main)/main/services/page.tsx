import Link from "next/link"
import { MainNav, MainFooter, MainServiceCard } from "@/components/main"
import { MAIN_SERVICES } from "@/lib/main-services-data"

export const metadata = {
  title: "Services – MOOD MNKY",
  description:
    "Microservices from MOOD MNKY: MNKY CLOUD, MNKY MEDIA, AUTO MNKY, MNKY AGENTS, and the MOOD MNKY Experience.",
}

export default function MainServicesPage() {
  return (
    <>
      <MainNav />
      <main className="main-container w-full max-w-[1600px] mx-auto py-12 md:py-16 px-4">
        <div className="mb-12 flex flex-col gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Services
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            A catalog of microservices we offer: cloud, media, AI automation, deployable agents, and the MOOD MNKY subscription experience. More services will be added as we grow.
          </p>
          <Link
            href="/main/design"
            className="inline-block text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Design tokens →
          </Link>
        </div>
        <section
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch"
          aria-label="Microservices gallery"
        >
          {MAIN_SERVICES.map((service) => (
            <Link key={service.id} href={`/main/services/${service.id}`} className="block h-full min-h-[400px]">
              <MainServiceCard service={service} className="h-full" />
            </Link>
          ))}
        </section>
      </main>
      <MainFooter />
    </>
  )
}
