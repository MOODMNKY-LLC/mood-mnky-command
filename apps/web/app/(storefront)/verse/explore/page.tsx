import { VerseExploreClient } from "./verse-explore-client";

export default function VerseExplorePage() {
  return (
    <div className="verse-container mx-auto max-w-[var(--verse-page-width)] px-4 py-8 md:px-6">
      <div className="mb-6">
        <h1 className="font-verse-heading text-2xl font-semibold text-verse-text">
          Explore Fragrances
        </h1>
        <p className="mt-1 text-verse-text-muted">
          Glossary of fragrance notes, olfactive profiles, and educational
          content.
        </p>
      </div>
      <VerseExploreClient />
    </div>
  );
}
