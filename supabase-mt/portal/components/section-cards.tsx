import Link from "next/link";
import { TrendingUpIcon, ExternalLinkIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export type SectionCardsProps = {
  organizationsCount?: number;
  provisionsCount?: number;
  flowiseUrl?: string;
  n8nUrl?: string;
};

export function SectionCards({
  organizationsCount = 0,
  provisionsCount = 0,
  flowiseUrl,
  n8nUrl,
}: SectionCardsProps) {
  const hasEcosystem = !!(flowiseUrl || n8nUrl);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-4 lg:px-6">
      <Card className="main-glass-panel-card dashboard-section-card main-float rounded-xl border-0 shadow-sm">
        <CardHeader className="p-3 pb-1">
          <CardDescription className="text-xs">Organizations</CardDescription>
          <CardTitle className="text-xl font-semibold tabular-nums">
            {organizationsCount}
          </CardTitle>
          <Badge variant="outline" className="mt-1 w-fit text-[10px] rounded">
            <TrendingUpIcon className="size-2.5 mr-0.5" />
            Your orgs
          </Badge>
        </CardHeader>
        <CardFooter className="p-3 pt-0 text-xs text-muted-foreground">
          <Link href="/onboarding" className="text-primary hover:underline">
            Create organization
          </Link>
        </CardFooter>
      </Card>

      <Card className="main-glass-panel-card dashboard-section-card main-float rounded-xl border-0 shadow-sm">
        <CardHeader className="p-3 pb-1">
          <CardDescription className="text-xs">Provisions</CardDescription>
          <CardTitle className="text-xl font-semibold tabular-nums">
            {provisionsCount}
          </CardTitle>
          <Badge variant="outline" className="mt-1 w-fit text-[10px] rounded">
            Active services
          </Badge>
        </CardHeader>
        <CardFooter className="p-3 pt-0 text-xs text-muted-foreground">
          Flowise & n8n instances
        </CardFooter>
      </Card>

      <Card className="main-glass-panel-card dashboard-section-card main-float rounded-xl border-0 shadow-sm">
        <CardHeader className="p-3 pb-1">
          <CardDescription className="text-xs">Ecosystem</CardDescription>
          <CardTitle className="text-base font-semibold">
            Flowise & n8n
          </CardTitle>
        </CardHeader>
        <CardFooter className="p-3 pt-0 flex flex-wrap gap-1.5">
          {flowiseUrl && (
            <Button asChild variant="outline" size="sm" className="h-7 text-xs">
              <a href={flowiseUrl} target="_blank" rel="noopener noreferrer">
                Flowise
                <ExternalLinkIcon className="ml-0.5 h-2.5 w-2.5" />
              </a>
            </Button>
          )}
          {n8nUrl && (
            <Button asChild variant="outline" size="sm" className="h-7 text-xs">
              <a href={n8nUrl} target="_blank" rel="noopener noreferrer">
                n8n
                <ExternalLinkIcon className="ml-0.5 h-2.5 w-2.5" />
              </a>
            </Button>
          )}
          {!hasEcosystem && (
            <span className="text-muted-foreground text-xs">No instances</span>
          )}
        </CardFooter>
      </Card>

      <Card className="main-glass-panel-card dashboard-section-card main-float rounded-xl border-0 shadow-sm">
        <CardHeader className="p-3 pb-1">
          <CardDescription className="text-xs">Activity</CardDescription>
          <CardTitle className="text-xl font-semibold tabular-nums">
            —
          </CardTitle>
          <Badge variant="outline" className="mt-1 w-fit text-[10px] rounded">
            <TrendingUpIcon className="size-2.5 mr-0.5" />
            Coming soon
          </Badge>
        </CardHeader>
        <CardFooter className="p-3 pt-0 text-xs text-muted-foreground">
          Usage over time
        </CardFooter>
      </Card>
    </div>
  );
}
