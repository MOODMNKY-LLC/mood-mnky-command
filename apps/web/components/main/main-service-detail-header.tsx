"use client"

import Image from "next/image"
import { getFeatureIcons } from "@/lib/main-services-icons"
import type { MainServiceItem } from "@/lib/main-services-data"

const BUNDLE_PLACEHOLDER_SRC = "/images/services/bundle-placeholder.svg"

export function MainServiceDetailHeader({ service }: { service: MainServiceItem }) {
  const bundleSrc = service.bundleImageUrl ?? BUNDLE_PLACEHOLDER_SRC
  const techIcons = getFeatureIcons(service)

  return (
    <header className="flex flex-col gap-6">
      <div
        className="relative w-full overflow-hidden rounded-xl border border-border main-glass-panel"
        style={{ aspectRatio: "16/10", maxHeight: "320px" }}
      >
        {bundleSrc.startsWith("http") || bundleSrc.startsWith("//") ? (
          <img
            src={bundleSrc}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <Image
            src={bundleSrc}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 1600px"
          />
        )}
      </div>
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {service.name}
        </h1>
        <p className="mt-2 text-lg font-medium text-muted-foreground">
          {service.tagline}
        </p>
        {techIcons.length > 0 && (
          <div
            className="mt-4 flex flex-wrap items-center gap-2"
            aria-label="Technologies"
          >
            {techIcons.filter(({ Icon }) => Icon).map(({ label, Icon }) => (
              <span
                key={label}
                className="flex items-center justify-center rounded-md border border-border bg-background/60 p-2 text-muted-foreground"
                title={label}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span className="sr-only">{label}</span>
              </span>
            ))}
          </div>
        )}
        <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">
          {service.description}
        </p>
        {service.features.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="Features">
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
    </header>
  )
}
