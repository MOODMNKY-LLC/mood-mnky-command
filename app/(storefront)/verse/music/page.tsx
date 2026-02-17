import { VerseMusicPlayer } from "@/components/verse/verse-music-player"

export default function VerseMusicPage() {
  return (
    <div className="verse-container mx-auto max-w-[var(--verse-page-width)] px-4 py-8 md:px-6">
      <div className="space-y-6">
        <div>
          <h1 className="font-verse-heading text-2xl font-semibold text-verse-text">
            Music
          </h1>
          <p className="mt-1 text-sm text-verse-text-muted">
            Curated playlist for Verse.
          </p>
        </div>
        <VerseMusicPlayer />
      </div>
    </div>
  )
}
