import { VerseBlendingGuide } from "@/components/verse/verse-blending-guide";

export default function VerseBlendingGuidePage() {
  return (
    <div className="verse-container mx-auto max-w-[var(--verse-page-width)] px-4 py-8 md:px-6">
      <div className="mb-6">
        <h1 className="font-verse-heading text-2xl font-semibold text-verse-text">
          Blending Guide
        </h1>
        <p className="mt-1 text-verse-text-muted">
          Learn how scent families work together. Kindred scents harmonize;
          complementary scents create contrast.
        </p>
      </div>
      <VerseBlendingGuide />
    </div>
  );
}
