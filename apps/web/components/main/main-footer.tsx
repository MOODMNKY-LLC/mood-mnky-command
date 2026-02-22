"use client"

import Link from "next/link"
import { OpenInChat } from "@/components/ai-elements/open-in-chat"
import { MainMascotImage } from "@/components/main/main-mascot-image"
import { MAIN_MASCOT_ASSETS } from "@/lib/main-mascot-assets"

const DEFAULT_FOOTER_QUERY = "Tell me about MOOD MNKY – bespoke fragrance and the MNKY VERSE."

export function MainFooter() {
  return (
    <footer
      className="main-container main-glass-footer mt-20 py-8"
      role="contentinfo"
    >
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <Link
          href="/main"
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded">
            <MainMascotImage
              src={MAIN_MASCOT_ASSETS.footer}
              alt=""
              fill
              className="object-cover object-center"
              hideOnError
            />
          </span>
          <span>MOOD MNKY</span>
        </Link>
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <Link
            href="/main/about"
            className="transition-colors hover:text-foreground"
          >
            About
          </Link>
          <Link href="/verse" className="transition-colors hover:text-foreground">
            MNKY VERSE
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
      <p className="mt-4 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} MOOD MNKY. Fragrance, Community,
        Innovation.
      </p>
    </footer>
  )
}
