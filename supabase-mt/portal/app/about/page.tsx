import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "About | MOOD MNKY Portal",
  description: "About the MOOD MNKY Portal — organizational control plane and App Factory for partners and customers.",
};

export default function AboutPage() {
  return (
    <div className="main main-container w-full flex-1 py-12 md:py-16">
      <div className="mx-auto max-w-3xl space-y-10">
        <section>
          <h1 className="text-3xl font-bold tracking-tight">About MOOD MNKY Portal</h1>
          <p className="mt-4 text-muted-foreground">
            The MOOD MNKY Portal is the organizational control plane for MOOD MNKY LLC and its partners.
            It provides one place to manage your team, access shared resources, and—with the App Factory—launch
            and manage customer and partner applications from approved templates.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold tracking-tight">Portal v2</h2>
          <p className="mt-2 text-muted-foreground">
            The Portal has evolved into a full control plane: equal parts organizational dashboard,
            back office for shared tools (Flowise, n8n, MinIO, Nextcloud, Coolify, Proxmox), and
            <strong> App Factory</strong> for generating, deploying, and managing customer and partner apps.
            One login. Full visibility. Repeatable deployments.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold tracking-tight">What you can do</h2>
          <ul className="mt-2 list-inside list-disc space-y-2 text-muted-foreground">
            <li>Manage your organization and tenant membership</li>
            <li>Access shared apps and services assigned to your org</li>
            <li>Request and track full-stack provisioning (DevOps / Agent stacks)</li>
            <li>Use the App Factory (platform admins) to launch customer apps from templates, deploy via Coolify, and track releases</li>
          </ul>
        </section>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Get started</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button asChild>
              <Link href="/auth/sign-up">Create account</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/services">View services</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/">Back to home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
