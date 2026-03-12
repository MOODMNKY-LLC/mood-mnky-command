import Link from "next/link";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ApiHealthLights } from "@/components/api-health-lights";
import { HeroJobCards } from "@/components/hero-job-cards";
import { LandingHeroCtas } from "@/components/landing-hero-ctas";
import {
  Radio,
  Tv,
  Cpu,
  BarChart3,
  Database,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex flex-col">
      {/* Hero — split: copy left, job cards carousel right */}
      <section className="relative overflow-hidden px-4 py-16 md:py-24">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2 md:gap-12 lg:gap-16">
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              Hydaelyn
            </h1>
            <p className="mt-2 text-xl font-medium text-primary/90 md:text-2xl">
              Pull stats & stream command center for the Warriors of Light
            </p>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              Where the light gathers: pull tracking, OBS overlays, ACT ingest, and FFLogs in one place. Sign in with Discord, link your FFLogs account, and bring your raid data into stream and dashboard.
            </p>
            <div className="mt-6">
              <LandingHeroCtas />
            </div>
          </div>
          <div className="flex justify-center md:justify-end">
            <HeroJobCards />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-muted/30 px-4 py-16 md:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-semibold tracking-tight md:text-3xl">Features</h2>
          <p className="mt-3 text-center text-muted-foreground">
            Everything the Warriors of Light need: stream sessions, overlays, ACT data, and FFLogs in one place.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="border-border/80 transition-colors hover:border-primary/20">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Radio className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Stream sessions</CardTitle>
                </div>
                <CardDescription>
                  Create a session to get a unique overlay token for OBS and ACT.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-border/80 transition-colors hover:border-primary/20">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Tv className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">OBS overlay</CardTitle>
                </div>
                <CardDescription>
                  Add the overlay URL as a browser source to show pull count and best pull on stream.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">ACT ingest</CardTitle>
                </div>
                <CardDescription>
                  Point OverlayPlugin at the ACT ingest overlay; combat data flows into Hydaelyn.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-border/80 transition-colors hover:border-primary/20">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">FFLogs sync</CardTitle>
                </div>
                <CardDescription>
                  Link FFLogs to view your reports, rankings, and sync data with your sessions.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">ACT data</CardTitle>
                </div>
                <CardDescription>
                  Optional ODBC-style tables for encounter and combatant data in the app.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-border/80 transition-colors hover:border-primary/20">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">Insights</CardTitle>
                </div>
                <CardDescription>
                  AI-generated summaries and pull feedback for reports (OpenAI).
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section id="roadmap" className="border-t border-border px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-semibold">Roadmap</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Current and planned phases for Hydaelyn.
          </p>
          <ul className="mt-8 space-y-4 text-muted-foreground">
            <li className="flex gap-3">
              <span className="font-medium text-foreground">Phase 1</span>
              <span>Stream sessions, OBS overlay, ACT ingest, Discord sign-in, FFLogs link and sync.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-medium text-foreground">Phase 2</span>
              <span>Deeper FFLogs integration, report viewer, recaps, and OpenAI insights.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-medium text-foreground">Phase 3</span>
              <span>Mitigation and timeline views, team features, and expanded AI coaching.</span>
            </li>
            <li className="flex gap-3">
              <span className="font-medium text-foreground">Phase 4</span>
              <span>Monetization and premium features (if applicable).</span>
            </li>
          </ul>
          <p className="mt-6 text-center text-sm">
            <Link href="/#roadmap" className="text-primary underline hover:no-underline">
              Roadmap
            </Link>
            {" · "}
            <Link href="/auth/signin" className="text-primary underline hover:no-underline">
              Sign in
            </Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 px-4 py-10">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-4 text-sm text-muted-foreground">
          <ApiHealthLights className="justify-center" />
          <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
          <Link href="/auth/signin" className="hover:text-foreground">Sign in</Link>
          <Link href="/auth/signup" className="hover:text-foreground">Sign up</Link>
          <span>·</span>
          <span>Hydaelyn — for the Warriors of Light</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
