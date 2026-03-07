import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { offerings } from "@/lib/copy/offerings";

export const metadata = {
  title: "Services | MOOD MNKY Portal",
  description: "MOOD MNKY services: granular app services, full DevOps/Agent stack, and App Factory for customer and partner deployments.",
};

export default function ServicesPage() {
  return (
    <div className="main main-container w-full flex-1 py-12 md:py-16">
      <div className="mx-auto max-w-3xl space-y-10">
        <section>
          <h1 className="text-3xl font-bold tracking-tight">Services</h1>
          <p className="mt-4 text-muted-foreground">
            MOOD MNKY provides granular app services, full-stack provisioning, and—through the Portal—an
            App Factory for launching and managing customer and partner applications. Below is how we serve you.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold tracking-tight">How we serve you</h2>
          <p className="mt-2 text-muted-foreground">
            {offerings.main}
          </p>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Granular app services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {offerings.granular}
              </p>
              <p className="text-xs text-muted-foreground/90">
                n8n · Flowise · MinIO · Nextcloud — subscribe per app. Access and manage them from the Portal.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Full stack (DevOps / Agent)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {offerings.fullStack.replace(/\*\*(.*?)\*\*/g, "$1")}
              </p>
              <p className="text-xs text-muted-foreground/90">
                We provision and deploy the whole stack on a homelab VM or LXC as a white-label environment.
                Request and track from the Portal dashboard.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">App Factory (Portal v2)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              For platform operators: launch customer and partner applications from approved templates.
              Intake → deployment spec → app generation → Git repo → Coolify deploy → health check.
              One control plane for the MNKY ecosystem.
            </p>
            <p className="text-xs text-muted-foreground/90">
              Available to platform admins in the dashboard under App Factory (Customers, Projects, Templates, Launch Wizard).
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-4">
          <Button asChild>
            <Link href="/auth/sign-up">Get started</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/about">About the Portal</Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
