import Link from "next/link";
import { VerseButton } from "@/components/verse/ui/button";

export default function DojoPage() {
  return (
    <div className="verse-container mx-auto max-w-[var(--verse-page-width)] px-4 py-12 md:px-6">
      <div className="mx-auto max-w-2xl space-y-6 text-center">
        <h1 className="font-verse-heading text-3xl font-semibold tracking-tight text-verse-text md:text-4xl">
          The Dojo
        </h1>
        <p className="text-lg text-verse-text-muted">
          Your personal space—wellness, learning, and projects. This page will
          be customized with your dashboard and tools.
        </p>
        <VerseButton asChild>
          <Link href="/verse">Back to Home</Link>
        </VerseButton>
      </div>
    </div>
  );
}
