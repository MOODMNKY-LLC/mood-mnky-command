"use client"

import Link from "next/link"
import { OpenInChat } from "@/components/ai-elements/open-in-chat"
import { VerseLogoHairIcon } from "@/components/verse/verse-logo-hair-icon"
import { BrandMatrixText } from "@/components/main/elevenlabs/brand-matrix-text"

const DEFAULT_FOOTER_QUERY = "Tell me about MOOD MNKY – bespoke fragrance and the MNKY VERSE."

export function MainFooter() {
  return (
    <footer
      className="main-container main-glass-footer mx-4 mt-20 rounded-t-2xl py-8"
      role="contentinfo"
    >
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <Link
          href="/main"
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <VerseLogoHairIcon
            withRing
            size="sm"
            className="text-foreground"
            ringClassName="border-foreground/80"
          />
          <BrandMatrixText variant="MOOD MNKY" size={3} gap={1} className="h-5" />
        </Link>
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <Link
            href="/main/about"
            className="transition-colors hover:text-foreground"
          >
            About
          </Link>
          <Link href="/verse" className="transition-colors hover:text-foreground flex items-center gap-1">
            <BrandMatrixText variant="MNKY" size={2} gap={1} className="h-4" />
            <span> VERSE</span>
          </Link>
          <Link
            href="/verse/blog"
            className="transition-colors hover:text-foreground"
          >
            Blog
          </Link>
          <a
            href="https://docs.moodmnky.com"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            Docs
          </a>
          <OpenInChat query={DEFAULT_FOOTER_QUERY} />
        </div>
      </div>
      <div
        role="paragraph"
        className="mt-4 flex flex-wrap items-center justify-center gap-1 text-center text-xs text-muted-foreground"
      >
        &copy; {new Date().getFullYear()}{" "}
        <BrandMatrixText variant="MOOD MNKY" size={2} gap={0.5} className="inline-block h-3.5" />
        . Fragrance, Community, Innovation.
      </div>
    </footer>
  )
}
