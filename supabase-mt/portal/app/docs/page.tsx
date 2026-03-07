import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { FileText, BookOpen, Wrench, Info, Rocket } from "lucide-react";

export const metadata = {
  title: "Info & docs | MOOD MNKY Portal",
  description: "Portal information and documentation: about, services, getting started, and App Factory.",
};

const externalDocsUrl =
  process.env.NEXT_PUBLIC_DOCS_URL ??
  (process.env.NEXT_PUBLIC_MAIN_APP_URL ? `${process.env.NEXT_PUBLIC_MAIN_APP_URL}/docs` : "https://www.moodmnky.com/docs");

const docSections = [
  {
    title: "About the Portal",
    description: "What the Portal is and how it fits into the MOOD MNKY ecosystem.",
    href: "/about",
    icon: Info,
  },
  {
    title: "Services",
    description: "Granular app services, full-stack provisioning, and App Factory.",
    href: "/services",
    icon: Wrench,
  },
  {
    title: "App Factory",
    description: "Launch customer and partner apps from templates; deploy via Coolify; track releases.",
    href: "/dashboard/app-factory",
    icon: Rocket,
  },
];

export default function DocsPage() {
  return (
    <div className="main main-container w-full flex-1 py-12 md:py-16">
      <div className="mx-auto max-w-3xl space-y-8">
        <section className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-muted-foreground" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Info & docs</h1>
            <p className="mt-1 text-muted-foreground">
              Portal information, service descriptions, and where to get started.
            </p>
          </div>
        </section>

        <div className="grid gap-4">
          {docSections.map(({ title, description, href, icon: Icon }) => (
            <Link key={href} href={href}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-2">
                  <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-base">{title}</CardTitle>
                    <CardContent className="p-0 pt-2">
                      <p className="text-sm text-muted-foreground">{description}</p>
                    </CardContent>
                  </div>
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground ml-auto" />
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">
          For external product and brand documentation, see{" "}
          <a href={externalDocsUrl} className="underline hover:text-foreground" target="_blank" rel="noopener noreferrer">
            MOOD MNKY docs
          </a>
          .
        </p>
      </div>
    </div>
  );
}
