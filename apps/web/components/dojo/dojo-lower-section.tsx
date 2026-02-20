"use client";

import Link from "next/link";
import { BookOpen, Image, Gift } from "lucide-react";
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

interface DojoLowerSectionProps {
  rewardClaims?: RewardClaim[];
}

export function DojoLowerSection({ rewardClaims = [] }: DojoLowerSectionProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
        <CardContent>
          <Link
            href="/verse/issues"
            className="text-sm font-medium text-primary hover:underline"
          >
            Start reading →
          </Link>
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
          <Link
            href="/verse/ugc"
            className="text-sm font-medium text-primary hover:underline"
          >
            Upload content →
          </Link>
        </CardContent>
      </Card>
      <Card>
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
              {rewardClaims.map((claim) => (
                <li
                  key={claim.id}
                  className="flex flex-col gap-1.5 rounded-md border bg-muted/30 px-3 py-2 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="capitalize font-medium">
                      {claim.type.replace("_", " ")}
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
                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                          {String(claim.payload.code)}
                        </code>
                        <CopyCodeButton code={String(claim.payload.code)} />
                      </div>
                    )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CopyCodeButton({ code }: { code: string }) {
  const handleCopy = () => {
    void navigator.clipboard.writeText(code);
  };
  return (
    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={handleCopy}>
      Copy
    </Button>
  );
}
