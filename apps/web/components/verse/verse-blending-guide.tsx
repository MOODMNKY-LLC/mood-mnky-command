"use client";

import Link from "next/link";
import { FragranceWheel } from "@/components/blending/fragrance-wheel";
import { VerseButton } from "@/components/verse/ui/button";

export function VerseBlendingGuide() {
  return (
    <div className="space-y-8">
      {/* Prose content */}
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <div className="space-y-6 text-verse-text">
          <section>
            <h2 className="font-verse-heading text-lg font-semibold text-verse-text">
              How Scent Families Work
            </h2>
            <p className="leading-relaxed text-verse-text-muted">
              The fragrance wheel organizes scents into 10 families arranged by
              season. Each family has distinct characteristics—from bright
              Citrus to warm Woody to sweet Gourmand. Understanding these
              families helps you choose scents that match your mood and discover
              new favorites.
            </p>
          </section>

          <section>
            <h2 className="font-verse-heading text-lg font-semibold text-verse-text">
              Kindred vs Complementary
            </h2>
            <p className="mb-3 leading-relaxed text-verse-text-muted">
              <strong className="text-verse-text">Kindred</strong> families are
              adjacent on the wheel. They share characteristics and blend
              harmoniously—think Citrus with Marine/Ozonic or Floral with
              Aromatic.
            </p>
            <p className="leading-relaxed text-verse-text-muted">
              <strong className="text-verse-text">Complementary</strong> families
              sit across the wheel. They create complex, intriguing contrasts
              when layered—like Spicy with Marine/Ozonic or Gourmand with Green.
            </p>
          </section>

          <section>
            <h2 className="font-verse-heading text-lg font-semibold text-verse-text">
              Tips for Layering Scents
            </h2>
            <ul className="list-inside list-disc space-y-2 text-verse-text-muted">
              <li>
                <strong className="text-verse-text">Dominant</strong> — Pick one
                fragrance at a higher percentage (e.g., 50–60%) to anchor your
                blend.
              </li>
              <li>
                <strong className="text-verse-text">Supporting</strong> — Layer
                in 2–3 scents at lower ratios (e.g., 20–30% each) for depth.
              </li>
              <li>
                <strong className="text-verse-text">Kindred</strong> — Blend
                adjacent families for harmony and smooth transitions.
              </li>
              <li>
                <strong className="text-verse-text">Complementary</strong> —
                Blend opposite families for intrigue and contrast.
              </li>
              <li>
                <strong className="text-verse-text">Test</strong> — Use blotter
                strips or small batches before committing to a full blend.
              </li>
            </ul>
          </section>
        </div>
      </div>

      {/* Compact wheel preview */}
      <div className="rounded-lg border border-verse-text/15 bg-verse-bg/60 p-4 [&_.fill-foreground]:fill-verse-text [&_.fill-muted-foreground]:fill-verse-text-muted">
        <h3 className="mb-4 font-verse-heading text-sm font-semibold text-verse-text">
          Explore the Fragrance Wheel
        </h3>
        <FragranceWheel />
      </div>

      {/* CTAs */}
      <div className="flex flex-wrap gap-3">
        <VerseButton asChild>
          <Link href="/dojo/fragrance-wheel">Full Fragrance Wheel</Link>
        </VerseButton>
        <VerseButton variant="outline" asChild>
          <Link href="/dojo/explore">Browse Notes Glossary</Link>
        </VerseButton>
        <VerseButton variant="outline" asChild>
          <Link href="/dojo/products">Shop Products</Link>
        </VerseButton>
      </div>
    </div>
  );
}
