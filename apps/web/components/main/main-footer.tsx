"use client"

import Link from "next/link"
import { OpenInChat } from "@/components/ai-elements/open-in-chat"
import { VerseLogoHairIcon } from "@/components/verse/verse-logo-hair-icon"
import { BrandMatrixText } from "@/components/main/elevenlabs/brand-matrix-text"
import { ROUTES } from "@/lib/nav-routes"
import { FOOTER_GROUPS } from "@/lib/main-nav-config"

export function MainFooter() {
  const { discover, dojo, connect } = FOOTER_GROUPS

  return (
    <footer
      className="main-container main-glass-footer mx-4 mt-20 rounded-t-2xl py-8"
      role="contentinfo"
    >
      <div className="flex flex-col gap-8 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <Link
          href={ROUTES.MAIN}
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

        <div className="flex flex-wrap gap-x-8 gap-y-4 sm:gap-x-10">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Discover
            </span>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {discover.map((item) =>
                item.external ? (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                )
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Dojo
            </span>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              {dojo.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Connect
            </span>
            <div className="text-sm text-muted-foreground">
              <OpenInChat query={connect.chatQuery} />
            </div>
          </div>
        </div>
      </div>
      <div
        role="paragraph"
        className="mt-6 flex flex-wrap items-center justify-center gap-1 border-t border-border/50 pt-6 text-center text-xs text-muted-foreground sm:justify-between"
      >
        <span className="flex items-center gap-1">
          &copy; {new Date().getFullYear()}{" "}
          <BrandMatrixText variant="MOOD MNKY" size={2} gap={0.5} className="inline-block h-3.5" />
          . Fragrance, Community, Innovation.
        </span>
      </div>
    </footer>
  )
}
