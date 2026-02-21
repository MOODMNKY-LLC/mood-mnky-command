"use client";

import Link from "next/link";
import { Store, Heart, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BlurFade } from "@/components/ui/blur-fade";

interface DojoShopperProfileCardProps {
  shopifyLinked: boolean;
  wishlistCount: number;
  lastSyncAt: string | null;
}

function formatSyncDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    const date = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Synced today";
    if (diffDays === 1) return "Synced yesterday";
    if (diffDays < 7) return `Synced ${diffDays} days ago`;
    return date.toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return "—";
  }
}

export function DojoShopperProfileCard({
  shopifyLinked,
  wishlistCount,
  lastSyncAt,
}: DojoShopperProfileCardProps) {
  return (
    <BlurFade delay={0.15} inView inViewMargin="-20px">
      <Card className="dojo-glass-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Store className="h-4 w-4" />
            Shopper Profile
          </CardTitle>
          <CardDescription>
            {shopifyLinked
              ? "Your preferences sync to Shopify for checkout personalization"
              : "Link your Shopify account to sync preferences"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {shopifyLinked ? (
            <>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5 rounded-md border bg-muted/30 px-3 py-1.5 text-sm">
                  <Heart className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{wishlistCount} in wishlist</span>
                </div>
                {lastSyncAt && (
                  <Badge variant="secondary" className="font-normal">
                    {formatSyncDate(lastSyncAt)}
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-full justify-between" asChild>
                <Link href="/dojo/preferences">
                  Manage preferences
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </>
          ) : (
            <Button variant="default" size="sm" className="w-full gap-2" asChild>
              <Link href="/verse/profile">
                <Store className="h-4 w-4" />
                Link Shopify account
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </BlurFade>
  );
}
