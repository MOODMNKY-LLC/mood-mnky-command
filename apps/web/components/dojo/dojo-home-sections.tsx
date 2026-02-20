"use client";

import Link from "next/link";
import {
  Gift,
  MessageCircle,
  Droplets,
  BookOpen,
  Image,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type RewardClaim = {
  id: string;
  status: string;
  issuedAt: string;
  type: string;
  payload: Record<string, unknown>;
};

interface DojoHomeSectionsProps {
  rewardClaims: RewardClaim[];
  savedBlendsCount: number;
  funnelProfile: Record<string, unknown> | null;
  linkedAccounts: { discord: boolean };
  /** When set, show "Current issue" link in Manga & Issues card (env NEXT_PUBLIC_FEATURED_ISSUE_SLUG or first published). */
  featuredIssue?: { slug: string; title: string } | null;
}

function CopyCodeButton({ code }: { code: string }) {
  const handleCopy = () => {
    void navigator.clipboard.writeText(code);
  };
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-6 px-2 text-xs"
      onClick={handleCopy}
    >
      Copy
    </Button>
  );
}

export function DojoHomeSections({
  rewardClaims,
  savedBlendsCount,
  funnelProfile,
  linkedAccounts,
  featuredIssue = null,
}: DojoHomeSectionsProps) {
  const funnelKeys = funnelProfile ? Object.keys(funnelProfile) : [];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card id="my-rewards">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Gift className="h-4 w-4" />
            My Rewards
          </CardTitle>
          <CardDescription>
            Discount codes, early access, and more
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {rewardClaims.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No rewards yet. Complete quests to earn them.
            </p>
          ) : (
            <ul className="space-y-2">
              {rewardClaims.slice(0, 3).map((claim) => (
                <li
                  key={claim.id}
                  className="flex flex-col gap-1.5 rounded-md border bg-muted/30 px-3 py-2 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="capitalize font-medium">
                      {claim.type.replace(/_/g, " ")}
                    </span>
                    <Badge
                      variant={
                        claim.status === "redeemed" ? "secondary" : "default"
                      }
                    >
                      {claim.status}
                    </Badge>
                  </div>
                  {claim.type === "discount_code" &&
                    claim.payload?.code &&
                    claim.status === "issued" && (
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                          {String(claim.payload.code)}
                        </code>
                        <CopyCodeButton code={String(claim.payload.code)} />
                      </div>
                    )}
                </li>
              ))}
            </ul>
          )}
          <Button variant="ghost" size="sm" className="h-8 w-full" asChild>
            <Link href="/dojo#my-rewards">
              View all rewards
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            Linked Accounts
          </CardTitle>
          <CardDescription>
            Your connected services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Discord</span>
            </div>
            <Badge variant={linkedAccounts.discord ? "default" : "secondary"}>
              {linkedAccounts.discord ? "Linked" : "Not linked"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Droplets className="h-4 w-4" />
            Fragrance Profile
          </CardTitle>
          <CardDescription>
            Saved blends and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {savedBlendsCount > 0 && (
            <p className="text-sm">
              <span className="font-medium">{savedBlendsCount}</span>{" "}
              saved blend{savedBlendsCount !== 1 ? "s" : ""}
            </p>
          )}
          {funnelKeys.length > 0 && (
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              {funnelProfile?.target_mood && (
                <p>
                  <span className="text-foreground font-medium">Mood:</span>{" "}
                  {String(funnelProfile.target_mood)}
                </p>
              )}
              {funnelProfile?.product_type && (
                <p>
                  <span className="text-foreground font-medium">Product:</span>{" "}
                  {String(funnelProfile.product_type)}
                </p>
              )}
              {funnelProfile?.preferred_notes && (
                <p>
                  <span className="text-foreground font-medium">Notes:</span>{" "}
                  {String(funnelProfile.preferred_notes)}
                </p>
              )}
            </div>
          )}
          {savedBlendsCount === 0 && funnelKeys.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No fragrance profile yet. Create blends in Crafting or complete an
              intake.
            </p>
          )}
          <Button variant="ghost" size="sm" className="h-8 w-full" asChild>
            <Link href="/dojo/crafting">
              Open Crafting
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" />
            Manga & Issues
          </CardTitle>
          <CardDescription>
            Read chapters, pass quizzes, earn XP
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {featuredIssue && (
            <Button variant="default" size="sm" className="w-full justify-start" asChild>
              <Link href={`/verse/issues/${featuredIssue.slug}`}>
                Current issue: {featuredIssue.title}
              </Link>
            </Button>
          )}
          <Button variant="link" className="h-auto p-0 text-primary" asChild>
            <Link href="/verse/issues">
              {featuredIssue ? "All issues →" : "Start reading →"}
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Image className="h-4 w-4" />
            UGC Submissions
          </CardTitle>
          <CardDescription>
            Share your photos, videos, and stories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="link" className="h-auto p-0 text-primary" asChild>
            <Link href="/verse/ugc">
              Upload content →
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
