"use client";

import Link from "next/link";
import { FragranceWheel } from "@/components/blending/fragrance-wheel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { FragranceFamily } from "@/lib/types";

/**
 * Dojo-friendly crafting section: compact fragrance wheel + quick tips.
 * Member-focused; links to full Verse experiences for deeper exploration.
 */
export function DojoCraftingLab() {
  const [selectedFamily, setSelectedFamily] = useState<FragranceFamily | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Explore scent families</CardTitle>
        <p className="text-muted-foreground text-sm">
          Click a segment to explore that family. Kindred families blend smoothly; complementary families create contrast.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/30 p-4 [&_.fill-foreground]:fill-foreground [&_.fill-muted-foreground]:fill-muted-foreground [&_.text-foreground]:text-foreground [&_.text-muted-foreground]:text-muted-foreground">
          <FragranceWheel
            selectedFamily={selectedFamily}
            onSelectFamily={setSelectedFamily}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link href="/verse/fragrance-wheel">
              Full fragrance wheel
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/verse/chat">
              Chat with MNKY LABZ assistant
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/verse/formulas">
              Browse formulas
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
