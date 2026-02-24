"use client";

import { useState } from "react";
import Link from "next/link";
import { FragranceWheel } from "@/components/blending/fragrance-wheel";
import { VerseButton } from "@/components/verse/ui/button";
import type { FragranceFamily } from "@/lib/types";

export function VerseFragranceWheel() {
  const [selectedFamily, setSelectedFamily] = useState<FragranceFamily | null>(
    null
  );

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-verse-text/15 bg-verse-bg/60 p-4 [&_.fill-foreground]:fill-verse-text [&_.fill-muted-foreground]:fill-verse-text-muted [&_.text-foreground]:text-verse-text [&_.text-muted-foreground]:text-verse-text-muted [&_.bg-card]:bg-verse-bg/80 [&_.border-border]:border-verse-text/15">
        <FragranceWheel
          selectedFamily={selectedFamily}
          onSelectFamily={setSelectedFamily}
        />
      </div>

      {/* How to Blend - educational copy */}
      <div className="rounded-lg border border-verse-text/15 bg-verse-bg/30 p-4">
        <h3 className="mb-2 font-verse-heading text-sm font-semibold uppercase tracking-wider text-verse-text">
          How Scents Work Together
        </h3>
        <ul className="space-y-2 text-sm leading-relaxed text-verse-text-muted">
          <li>
            <span className="font-medium text-verse-text">Kindred</span>{" "}
            families are adjacent on the wheel—they share characteristics and
            blend harmoniously.
          </li>
          <li>
            <span className="font-medium text-verse-text">Complementary</span>{" "}
            families are across the wheel—they create complex, intriguing
            contrasts.
          </li>
          <li>
            Select a family to explore scents in that category and discover
            products that match your preferences.
          </li>
        </ul>
      </div>

      {/* CTA to explore products */}
      <div className="flex flex-wrap gap-3">
        <VerseButton asChild>
          <Link href="/dojo/products">
            {selectedFamily
              ? `Explore ${selectedFamily} Products`
              : "Shop All Products"}
          </Link>
        </VerseButton>
        <VerseButton variant="outline" asChild>
          <Link href="/dojo/explore">Browse Fragrance Notes</Link>
        </VerseButton>
      </div>
    </div>
  );
}
