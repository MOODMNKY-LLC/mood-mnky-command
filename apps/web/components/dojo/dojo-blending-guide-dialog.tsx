"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DojoBlendingGuideDialogProps {
  trigger: React.ReactNode;
}

export function DojoBlendingGuideDialog({ trigger }: DojoBlendingGuideDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Blending Guide</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Learn how scent families work together. Kindred scents harmonize; complementary scents create contrast.
          </p>
        </DialogHeader>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <section className="space-y-2">
            <h3 className="text-base font-semibold">How Scent Families Work</h3>
            <p className="leading-relaxed text-muted-foreground">
              The fragrance wheel organizes scents into 10 families arranged by season. Each family has distinct
              characteristics—from bright Citrus to warm Woody to sweet Gourmand. Understanding these families helps you
              choose scents that match your mood and discover new favorites.
            </p>
          </section>

          <section className="mt-6 space-y-2">
            <h3 className="text-base font-semibold">Kindred vs Complementary</h3>
            <p className="leading-relaxed text-muted-foreground">
              <strong>Kindred</strong> families are adjacent on the wheel. They share characteristics and blend
              harmoniously—think Citrus with Marine/Ozonic or Floral with Aromatic.
            </p>
            <p className="leading-relaxed text-muted-foreground">
              <strong>Complementary</strong> families sit across the wheel. They create complex, intriguing contrasts
              when layered—like Spicy with Marine/Ozonic or Gourmand with Green.
            </p>
          </section>

          <section className="mt-6 space-y-2">
            <h3 className="text-base font-semibold">Tips for Layering Scents</h3>
            <ul className="list-inside list-disc space-y-2 text-muted-foreground">
              <li>
                <strong>Dominant</strong> — Pick one fragrance at a higher percentage (e.g., 50–60%) to anchor your
                blend.
              </li>
              <li>
                <strong>Supporting</strong> — Layer in 2–3 scents at lower ratios (e.g., 20–30% each) for depth.
              </li>
              <li>
                <strong>Kindred</strong> — Blend adjacent families for harmony and smooth transitions.
              </li>
              <li>
                <strong>Complementary</strong> — Blend opposite families for intrigue and contrast.
              </li>
              <li>
                <strong>Test</strong> — Use blotter strips or small batches before committing to a full blend.
              </li>
            </ul>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
