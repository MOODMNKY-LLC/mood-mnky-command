"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { TemplateWithVersions } from "@/lib/app-factory/data";
import { AlertTriangle, Box, Layers, Package } from "lucide-react";

const TEMPLATE_DESCRIPTIONS: Record<
  string,
  { description: string; howItWorks: string; icon: typeof Box; requiresVolumes?: boolean }
> = {
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
  "full-stack": {
    description: "Supabase self-hosted + Flowise (queue + worker) + n8n + MinIO.",
    howItWorks: "Full backend in one stack. Deploy via Coolify; the server must have Supabase ./volumes/ (see Full-stack runbook). Set env and deploy as with agent-stack.",
    icon: Package,
    requiresVolumes: true,
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
                <div className="flex items-center gap-1.5">
                  {meta.requiresVolumes && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex text-amber-600 dark:text-amber-500" aria-label="Requires setup">
                            <AlertTriangle className="h-4 w-4" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          Requires Supabase self-hosted volumes on the deploy server. See Full-stack runbook in portal docs.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <Badge variant="secondary" className="font-mono text-xs">
                    {template.template_key}
                  </Badge>
                </div>
              </div>
              <CardTitle className="text-base mt-2">{template.display_name}</CardTitle>
              <CardDescription className="text-sm">{meta.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground border-t pt-3 mt-0">
                <span className="font-medium text-foreground">How it works:</span> {meta.howItWorks}
              </p>
              {meta.requiresVolumes && (
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-1.5">
                  Volumes required — see FULL-STACK-RUNBOOK.
                </p>
              )}
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
