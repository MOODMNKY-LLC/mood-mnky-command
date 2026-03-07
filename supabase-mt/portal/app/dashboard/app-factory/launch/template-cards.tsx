"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TemplateWithVersions } from "@/lib/app-factory/data";
import { Box, Layers, Package } from "lucide-react";

const TEMPLATE_DESCRIPTIONS: Record<string, { description: string; howItWorks: string; icon: typeof Box }> = {
  platforms: {
    description: "Next.js app with subdomain routing, Tailwind, and Supabase-ready auth.",
    howItWorks: "You provide app name and slug; the generator creates a repo, pushes to GitHub, and deploys to Coolify. Your app gets a subdomain and runs as a dedicated Next.js instance.",
    icon: Layers,
  },
  "nextjs-mt-starter": {
    description: "Next.js multi-tenant starter with deployment spec and env placeholders.",
    howItWorks: "Enter app details and deployment mode. The generator produces a buildable app, pushes to a new GitHub repo, and deploys to Coolify with the configured strategy.",
    icon: Layers,
  },
  "agent-stack": {
    description: "Docker Compose stack for agent and service deployments.",
    howItWorks: "Set env variables and config with defaults for quick deploy. The generator creates the stack, pushes to GitHub, and Coolify deploys the Compose application.",
    icon: Package,
  },
};

function getTemplateMeta(templateKey: string) {
  return (
    TEMPLATE_DESCRIPTIONS[templateKey] ?? {
      description: "Generated app from this template.",
      howItWorks: "Configure the intake form and deploy. The generator creates the app and deploys to Coolify.",
      icon: Box,
    }
  );
}

type TemplateCardsProps = {
  templates: TemplateWithVersions[];
  onSelect: (templateId: string, templateVersionId: string) => void;
};

export function TemplateCards({ templates, onSelect }: TemplateCardsProps) {
  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No templates available. Add entries to the template registry.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => {
        const version = template.versions?.[0];
        const meta = getTemplateMeta(template.template_key);
        const Icon = meta.icon;

        return (
          <Card
            key={template.id}
            className="main-glass-panel-card main-float cursor-pointer transition-all hover:border-primary/30"
            onClick={() => version && onSelect(template.id, version.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <Badge variant="secondary" className="font-mono text-xs">
                  {template.template_key}
                </Badge>
              </div>
              <CardTitle className="text-base mt-2">{template.display_name}</CardTitle>
              <CardDescription className="text-sm">{meta.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground border-t pt-3 mt-0">
                <span className="font-medium text-foreground">How it works:</span> {meta.howItWorks}
              </p>
              {(!version || template.versions.length > 1) && (
                <p className="text-xs text-muted-foreground mt-1">
                  {template.versions?.length ?? 0} version(s) available
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
