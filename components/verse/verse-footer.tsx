"use client";

import Link from "next/link";

export function VerseFooter() {
  return (
    <footer className="border-t border-verse-text/10 bg-verse-bg/50 py-8">
      <div className="mx-auto max-w-[var(--verse-page-width,1600px)] px-4 md:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <Link
            href="/verse"
            className="font-verse-heading text-sm font-medium text-verse-text-muted"
          >
            MNKY VERSE
          </Link>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-verse-text-muted">
            <Link href="/verse/products" className="hover:text-verse-text">
              Shop
            </Link>
            <Link href="/verse/explore" className="hover:text-verse-text">
              Explore
            </Link>
            <Link href="/verse/community" className="hover:text-verse-text">
              Community
            </Link>
            <a
              href="https://docs.moodmnky.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-verse-text"
            >
              Docs
            </a>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-verse-text-muted">
          Members-only portal. Your gateway to the MOOD MNKY universe. &copy;{" "}
          {new Date().getFullYear()} MOOD MNKY.
        </p>
      </div>
    </footer>
  );
}
