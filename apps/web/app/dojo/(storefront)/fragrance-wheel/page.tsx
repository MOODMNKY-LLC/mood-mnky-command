import { VerseFragranceWheel } from "@/components/verse/verse-fragrance-wheel";

export default function VerseFragranceWheelPage() {
  return (
    <div className="verse-container mx-auto max-w-[var(--verse-page-width)] px-4 py-8 md:px-6">
      <div className="mb-6">
        <h1 className="font-verse-heading text-2xl font-semibold text-verse-text">
          Fragrance Wheel
        </h1>
        <p className="mt-1 text-verse-text-muted">
          Discover scent families and learn how different fragrances relate.
          Click a segment to explore kindred and complementary scents.
        </p>
      </div>
      <VerseFragranceWheel />
    </div>
  );
}
