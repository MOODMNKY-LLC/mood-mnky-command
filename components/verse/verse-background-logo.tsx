"use client";

import { VerseLogoBlock } from "./verse-logo-block";

/** Centered verse logo watermark for /verse background with subtle metallic shimmer */
export function VerseBackgroundLogo() {
  return (
    <div className="verse-bg-logo" aria-hidden>
      <div className="verse-bg-logo-inner">
        <VerseLogoBlock variant="background" primaryText="MNKY VERSE" />
      </div>
    </div>
  );
}
