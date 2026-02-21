"use client";

import Link from "next/link";
import {
  Gift,
  MessageCircle,
  Droplets,
  BookOpen,
  Image,
  ChevronRight,
  Heart,
  Store,
} from "lucide-react";
import { SiGithub } from "react-icons/si";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BlurFade } from "@/components/ui/blur-fade";
import { DojoShopperProfileCard } from "@/components/dojo/dojo-shopper-profile-card";

export type RewardClaim = {
  id: string;
  status: string;
  issuedAt: string;
  type: string;
  payload: Record<string, unknown>;
};

export type LinkedAccountEntry = {
  linked: boolean;
  linkUrl: string;
  manageUrl?: string;
};

interface DojoHomeSectionsProps {
  rewardClaims: RewardClaim[];
  savedBlendsCount: number;
  funnelProfile: Record<string, unknown> | null;
  linkedAccounts: {
    shopify: LinkedAccountEntry;
    discord: Pick<LinkedAccountEntry, "linked" | "linkUrl">;
    github: Pick<LinkedAccountEntry, "linked" | "linkUrl">;
  };
  /** When set, show "Current issue" link in Manga & Issues card (env NEXT_PUBLIC_FEATURED_ISSUE_SLUG or first published). */
  featuredIssue?: { slug: string; title: string } | null;
  shopifyLinked?: boolean;
  wishlistCount?: number;
  scentPersonality?: string;
  lastSyncAt?: string | null;
  favoriteNotes?: string;
  sizePreferences?: Record<string, string>;
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

function formatScentPersonality(value: string): string {
  if (!value) return "";
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function DojoHomeSections({
  rewardClaims,
  savedBlendsCount,
  funnelProfile,
  linkedAccounts,
  featuredIssue = null,
  shopifyLinked = false,
  wishlistCount = 0,
  scentPersonality = "",
  lastSyncAt = null,
  favoriteNotes = "",
  sizePreferences = {},
}: DojoHomeSectionsProps) {
  const funnelKeys = funnelProfile ? Object.keys(funnelProfile) : [];
  const sizeParts = [
    sizePreferences.clothing,
    sizePreferences.candle,
    sizePreferences.soap,
  ].filter(Boolean);
  const sizeSummary = sizeParts.length > 0 ? sizeParts.join(" · ") : null;

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
          {[
            {
              key: "shopify",
              label: "Shopify",
              icon: Store,
              linked: linkedAccounts.shopify.linked,
              linkUrl: linkedAccounts.shopify.linkUrl,
              manageUrl: linkedAccounts.shopify.manageUrl,
            },
            {
              key: "discord",
              label: "Discord",
              icon: MessageCircle,
              linked: linkedAccounts.discord.linked,
              linkUrl: linkedAccounts.discord.linkUrl,
              manageUrl: undefined,
            },
            {
              key: "github",
              label: "GitHub",
              icon: SiGithub,
              linked: linkedAccounts.github.linked,
              linkUrl: linkedAccounts.github.linkUrl,
              manageUrl: undefined,
            },
          ].map(({ key, label, icon: Icon, linked, linkUrl, manageUrl }) => (
            <div
              key={key}
              className="flex items-center justify-between rounded-md border px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{label}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={linked ? "default" : "secondary"}>
                  {linked ? "Linked" : "Not linked"}
                </Badge>
                {!linked ? (
                  <Button variant="outline" size="sm" asChild>
                    <a href={linkUrl}>Link</a>
                  </Button>
                ) : manageUrl ? (
                  <Button variant="ghost" size="sm" asChild>
                    <a href={manageUrl} target="_blank" rel="noopener noreferrer">
                      Manage
                    </a>
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/dojo/profile">Manage</Link>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <BlurFade delay={0.1} inView inViewMargin="-20px">
        <Card className="dojo-glass-panel">
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
            {wishlistCount > 0 && (
              <p className="flex items-center gap-2 text-sm">
                <Heart className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{wishlistCount} in wishlist</span>
                <Button variant="link" className="h-auto p-0 text-xs" asChild>
                  <Link href="/dojo/preferences">Manage</Link>
                </Button>
              </p>
            )}
            {scentPersonality && (
              <Badge variant="secondary" className="font-normal">
                {formatScentPersonality(scentPersonality)}
              </Badge>
            )}
            {sizeSummary && (
              <p className="text-xs text-muted-foreground">
                Sizes: {sizeSummary}
              </p>
            )}
            {favoriteNotes && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                Notes: {favoriteNotes}
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
            {savedBlendsCount === 0 &&
              funnelKeys.length === 0 &&
              !wishlistCount &&
              !scentPersonality &&
              !sizeSummary &&
              !favoriteNotes && (
                <p className="text-muted-foreground text-sm">
                  No fragrance profile yet. Create blends in Crafting or complete
                  an intake.
                </p>
              )}
            <div className="flex flex-col gap-1">
              <Button variant="ghost" size="sm" className="h-8 w-full justify-start" asChild>
                <Link href="/dojo/crafting">
                  Open Crafting
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-full justify-start" asChild>
                <Link href="/dojo/preferences">
                  Manage in Preferences
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </BlurFade>

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
