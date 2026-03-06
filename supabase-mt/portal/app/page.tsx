import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="main main-container w-full flex-1 py-12 md:py-16">
      {/* Hero */}
      <section
        className="flex min-h-[var(--main-hero-min-height)] flex-col justify-center py-16 md:flex-row md:items-center md:gap-12"
        style={{ gap: "var(--main-section-gap-sm)" }}
      >
        <div
          className="flex flex-1 flex-col justify-center"
          style={{ gap: "var(--main-section-gap-sm)" }}
        >
          <h1
            className="font-bold tracking-tight text-foreground"
            style={{ fontSize: "var(--main-hero-title-size)" }}
          >
            Organizational portal for{" "}
            <span className="text-primary">MOOD MNKY</span> and partners
          </h1>
          <p
            className="max-w-2xl text-muted-foreground"
            style={{ fontSize: "var(--main-hero-subtitle-size)" }}
          >
            Discover our integrated ecosystem of personalized fragrance, community wellness, and
            intelligent technology. Access resources, manage your organization, and connect to the
            MNKY VERSE.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button size="lg" className="main-btn-glass" asChild>
              <Link href="/auth/sign-up">Get started</Link>
            </Button>
            <Button variant="outline" size="lg" className="main-btn-float" asChild>
              <Link href="/auth/login">Sign in</Link>
            </Button>
          </div>
        </div>
        <div className="flex flex-1 justify-center md:justify-end">
          <div className="main-glass-panel main-float rounded-2xl p-8">
            <div className="h-48 w-48 rounded-lg bg-muted/50 md:h-64 md:w-64" aria-hidden />
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="py-16 md:py-24" style={{ marginTop: "var(--main-section-gap)" }}>
        <div
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          style={{ gap: "var(--main-section-gap)" }}
        >
          <div className="main-glass-panel-card main-float p-6">
            <h3 className="text-lg font-semibold tracking-tight">MNKY VERSE</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Web experiential portal—storefront, blog, agents, gamification, and fragrance tools.
            </p>
          </div>
          <div className="main-glass-panel-card main-float p-6">
            <h3 className="text-lg font-semibold tracking-tight">The Dojo</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Members&apos; private hub—XP, quests, Blending Lab, MNKY CHAT, and preferences.
            </p>
          </div>
          <div className="main-glass-panel-card main-float p-6">
            <h3 className="text-lg font-semibold tracking-tight">MNKY LABZ</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Command center for formulas, oils, glossary, and integrations.
            </p>
          </div>
        </div>
      </section>

      {/* Resource allocation */}
      <section className="py-16 md:py-24" style={{ marginTop: "var(--main-section-gap)" }}>
        <div className="main-glass-panel main-float mx-auto max-w-[700px] p-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Multi-tenant resource allocation
          </h2>
          <p className="mt-4 text-muted-foreground">
            Partner organizations receive access to Flowise, n8n, Nextcloud, Jellyfin, and other
            microservices—assigned per tenant based on resource allocation.
          </p>
        </div>
      </section>
    </div>
  );
}
