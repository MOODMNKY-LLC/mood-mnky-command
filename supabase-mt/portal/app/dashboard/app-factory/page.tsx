import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { UsersIcon, FolderIcon, FileTextIcon, RocketIcon, ArrowRightIcon } from "lucide-react";
import { getAppFactoryDashboardCounts } from "@/lib/app-factory/data";
import { Button } from "@/components/ui/button";

export default async function AppFactoryPage() {
  const counts = await getAppFactoryDashboardCounts();

  return (
    <div className="main-site space-y-0">
      {/* Hero */}
      <section className="main-container-full-bleed border-b bg-gradient-to-b from-muted/40 to-background">
        <div className="main-container py-12 md:py-16">
          <h1
            className="font-semibold tracking-tight text-foreground"
            style={{ fontSize: "var(--main-hero-title-size)" }}
          >
            App Factory
          </h1>
          <p
            className="mt-3 max-w-2xl text-muted-foreground"
            style={{ fontSize: "var(--main-hero-subtitle-size)" }}
          >
            Generate and deploy customer and partner apps from templates. Create a project, push to GitHub, and deploy to Coolify in one guided workflow.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="main-btn-glass">
              <Link href="/dashboard/app-factory/launch">
                <RocketIcon className="mr-2 h-4 w-4" />
                Launch new app
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/app-factory/projects">View projects</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="main-container py-10 md:py-14">
        <h2 className="text-lg font-medium tracking-tight text-foreground mb-1">How it works</h2>
        <p className="text-sm text-muted-foreground max-w-xl mb-8">
          Choose a customer and tenant, pick a template, enter app details, then run the pipeline. The app is generated, pushed to GitHub, and deployed to Coolify.
        </p>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <li className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium">1</span>
            <div>
              <span className="font-medium text-foreground">Customers</span>
              <p className="text-muted-foreground mt-0.5">Create or select a customer and tenant for the project.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium">2</span>
            <div>
              <span className="font-medium text-foreground">Templates</span>
              <p className="text-muted-foreground mt-0.5">Pick a template (e.g. Platforms, Agent Stack) and version.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium">3</span>
            <div>
              <span className="font-medium text-foreground">Launch Wizard</span>
              <p className="text-muted-foreground mt-0.5">Enter app name, slug, and options; submit and run the pipeline.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium">4</span>
            <div>
              <span className="font-medium text-foreground">Projects</span>
              <p className="text-muted-foreground mt-0.5">View deployments, open the app or Coolify, or delete the project.</p>
            </div>
          </li>
        </ol>
      </section>

      {/* At-a-glance cards */}
      <section className="main-container pb-12 md:pb-16">
        <h2 className="text-lg font-medium tracking-tight text-foreground mb-1">At a glance</h2>
        <p className="text-sm text-muted-foreground mb-6">Jump to a section or launch a new app.</p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/dashboard/app-factory/customers">
            <Card className="main-glass-panel-card main-float h-full transition-all hover:border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Customers</CardTitle>
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tabular-nums">{counts.customersCount}</p>
                <CardDescription className="mt-1">Customer directory and project rollups</CardDescription>
                <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                  Open <ArrowRightIcon className="h-3 w-3" />
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/app-factory/projects">
            <Card className="main-glass-panel-card main-float h-full transition-all hover:border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Projects</CardTitle>
                <FolderIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tabular-nums">{counts.projectsCount}</p>
                <CardDescription className="mt-1">Per-project record, spec, and release history</CardDescription>
                <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                  Open <ArrowRightIcon className="h-3 w-3" />
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/app-factory/templates">
            <Card className="main-glass-panel-card main-float h-full transition-all hover:border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Templates</CardTitle>
                <FileTextIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tabular-nums">{counts.templatesCount}</p>
                <CardDescription className="mt-1">Approved templates and versions</CardDescription>
                <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                  Open <ArrowRightIcon className="h-3 w-3" />
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/app-factory/launch">
            <Card className="main-glass-panel-card main-float h-full transition-all hover:border-primary/30 bg-primary/5 dark:bg-primary/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Launch Wizard</CardTitle>
                <RocketIcon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-primary">Start</p>
                <CardDescription className="mt-1">Guided workflow: customer, template, spec, launch</CardDescription>
                <p className="mt-2 text-xs text-primary font-medium flex items-center gap-1">
                  Launch new app <ArrowRightIcon className="h-3 w-3" />
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>
    </div>
  );
}
