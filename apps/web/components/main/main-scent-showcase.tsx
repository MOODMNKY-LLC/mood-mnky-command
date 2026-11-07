"use client"

import Link from "next/link"
import { BlurFade } from "@/components/ui/blur-fade"
import { MainMascotImage } from "./main-mascot-image"
import { MAIN_MASCOT_ASSETS } from "@/lib/main-mascot-assets"

/**
 * Static brand scent/vessel showcase when live fragrance_oils are unavailable.
 * Uses only repo source assets under /images/main — no fabricated product shots.
 */
export function MainScentShowcase() {
  return (
    <BlurFade delay={0.16} inView inViewMargin="-20px" className="col-span-full">
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Scent & vessel
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
            Brand artwork from the Main library. Live oil cards appear when the
            fragrance catalog backend is connected — this preview keeps the
            visual journey intact without inventing products.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {(
            [
              {
                src: MAIN_MASCOT_ASSETS.fragrances,
                alt: "Fragrance notes artwork",
                label: "Fragrances",
                href: "/main/collections/fragrances",
              },
              {
                src: MAIN_MASCOT_ASSETS.formulas,
                alt: "Formula and blending artwork",
                label: "Formulas",
                href: "/main/collections/formulas",
              },
              {
                src: MAIN_MASCOT_ASSETS.collections,
                alt: "Collections and vessel artwork",
                label: "Collections",
                href: "/main/collections",
              },
            ] as const
          ).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group relative aspect-[3/2] overflow-hidden rounded-2xl border border-border/60 bg-muted/30"
            >
              <MainMascotImage
                src={item.src}
                alt={item.alt}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2 text-sm font-medium text-white">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </BlurFade>
  )
}
