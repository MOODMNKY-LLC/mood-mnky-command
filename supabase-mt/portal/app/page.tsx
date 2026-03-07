import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeroModelDynamic } from "@/components/hero-model-dynamic";
import { offerings } from "@/lib/copy/offerings";

export default function LandingPage() {
  return (
    <div className="main main-container w-full flex-1 py-12 md:py-16">
      {/* Hero */}
      <section
        className="flex min-h-[var(--main-hero-min-height)] flex-col justify-center py-16 md:flex-row md:items-center md:gap-12"
        style={{ gap: "var(--main-section-gap-sm)" }}
      >
        <div
          className="flex flex-1 flex-col justify-center order-2 md:order-1"
          style={{ gap: "var(--main-section-gap-sm)" }}
        >
          <h1
            className="font-bold tracking-tight text-foreground"
            style={{ fontSize: "var(--main-hero-title-size)" }}
          >
            Your organization. The <span className="text-primary">MNKY</span>{" "}
            ecosystem. One portal.
          </h1>
          <p
            className="max-w-2xl text-muted-foreground"
            style={{ fontSize: "var(--main-hero-subtitle-size)" }}
          >
            Manage your team, access shared resources, and connect to the tools
            that power your work. Built for organizations, non-profits, and
            community efforts.
          </p>
          <p className="text-sm text-muted-foreground/90">
            One login. Full access.
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
        <div className="flex flex-1 justify-center md:justify-end order-1 md:order-2 w-full max-w-[440px] md:max-w-[520px]">
          <div className="main-glass-panel main-float rounded-2xl p-2 w-full overflow-hidden">
            <HeroModelDynamic />
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
            <h3 className="text-lg font-semibold tracking-tight">Community & programs</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Shared spaces, events, and programs for your organization and community.
            </p>
          </div>
          <div className="main-glass-panel-card main-float p-6">
            <h3 className="text-lg font-semibold tracking-tight">Resources & tools</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Access workflows, automation, and collaboration tools assigned to your org.
            </p>
          </div>
          <div className="main-glass-panel-card main-float p-6">
            <h3 className="text-lg font-semibold tracking-tight">Your organization</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              One place to manage your team, invites, and shared access.
            </p>
          </div>
        </div>
      </section>

      {/* Offerings: granular + full stack */}
      <section className="py-16 md:py-24" style={{ marginTop: "var(--main-section-gap)" }} aria-labelledby="offerings-heading">
        <h2 id="offerings-heading" className="text-2xl font-bold tracking-tight sm:text-3xl text-center mb-10">
          How we serve you
        </h2>
        <p className="max-w-2xl mx-auto text-center text-muted-foreground mb-12">
          {offerings.main}
        </p>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 max-w-4xl mx-auto mb-14">
          <div className="main-glass-panel-card main-float p-6">
            <h3 className="text-lg font-semibold tracking-tight">Granular app services</h3>
            <p className="mt-3 text-sm text-muted-foreground">
              {offerings.granular}
            </p>
            <p className="mt-4 text-xs text-muted-foreground/90">
              n8n · Flowise · MinIO · Nextcloud — each with its own use cases; subscribe per app.
            </p>
          </div>
          <div className="main-glass-panel-card main-float p-6">
            <h3 className="text-lg font-semibold tracking-tight">Full stack (DevOps / Agent)</h3>
            <p className="mt-3 text-sm text-muted-foreground">
              {offerings.fullStack.replace(/\*\*(.*?)\*\*/g, "$1")}
            </p>
            <p className="mt-4 text-xs text-muted-foreground/90">
              We provision and deploy the whole stack on a homelab VM or LXC as a white-label environment.
            </p>
            <div className="mt-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="main-glass-panel main-float mx-auto max-w-[700px] p-8 text-center">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            One place. Many tools.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Partner organizations get access to shared apps and services—assigned per
            tenant. See your resources, manage access, and grow with your community.
          </p>
        </div>
      </section>
    </div>
  );
}
