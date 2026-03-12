"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import { MainGlassCard } from "@/components/main/main-glass-card"
import { getFeatureIcons } from "@/lib/main-services-icons"
import type { MainServiceItem } from "@/lib/main-services-data"

const BUNDLE_PLACEHOLDER_SRC = "/images/services/bundle-placeholder.svg"

export interface MainServiceCardProps {
  service: MainServiceItem
  className?: string
}

export function MainServiceCard({ service, className }: MainServiceCardProps) {
  const bundleSrc = service.bundleImageUrl ?? BUNDLE_PLACEHOLDER_SRC
  const techIcons = getFeatureIcons(service)

  return (
    <MainGlassCard
      className={cn(
        "main-float main-glass-panel-card flex h-full min-h-[400px] flex-col overflow-hidden border border-border transition-colors hover:border-border/90",
        className
      )}
    >
      {/* 1. Bundle image area – fixed 16/10 aspect ratio */}
      <div className="relative w-full shrink-0" style={{ aspectRatio: "16/10" }}>
        {bundleSrc.startsWith("http") || bundleSrc.startsWith("//") ? (
          <img
            src={bundleSrc}
            alt=""
            className="h-full w-full object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <Image
            src={bundleSrc}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        )}
      </div>

      {/* 2. Title + tagline, 3. Tech icons row, 4. Description + features in scrollable area with blur fade */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 p-6">
        <h3 className="text-lg font-semibold tracking-tight text-foreground shrink-0">
          {service.name}
        </h3>
        <p className="text-sm font-medium text-muted-foreground shrink-0 line-clamp-1">
          {service.tagline}
        </p>

        {techIcons.length > 0 && (
          <div
            className="flex shrink-0 flex-wrap items-center gap-2"
            aria-label="Technologies"
          >
            {techIcons
              .filter(({ Icon }) => Icon)
              .map(({ label, Icon }) => (
                <span
                  key={label}
                  className="flex items-center justify-center rounded-md border border-border bg-background/60 p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                  title={label}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                  <span className="sr-only">{label}</span>
                </span>
              ))}
          </div>
        )}

        {/* Scrollable description + features with gentle blur fade at bottom */}
        <div className="relative min-h-0 flex-1">
          <div
            className="h-full max-h-[140px] overflow-y-auto overflow-x-hidden scroll-smooth pr-1"
            style={{
              maskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to bottom, black 70%, transparent 100%)",
            }}
          >
            <p className="text-sm text-muted-foreground leading-relaxed">
              {service.description}
            </p>
            {service.features.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-2" aria-label="Features">
                {service.features.map((feature) => (
                  <li
                    key={feature}
                    className="rounded-md border border-border bg-background/60 px-2.5 py-1 text-xs text-foreground"
                  >
                    {feature}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </MainGlassCard>
  )
}
