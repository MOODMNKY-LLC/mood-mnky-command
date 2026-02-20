"use client"

import { useState } from "react"
import type { FragranceFamily } from "@/lib/types"
import { FragranceWheel } from "@/components/blending/fragrance-wheel"
import { BlendingCalculator } from "@/components/blending/blending-calculator"
import { DocsTrigger } from "@/components/docs/docs-trigger"

export default function BlendingPage() {
  const [selectedFamily, setSelectedFamily] = useState<FragranceFamily | null>(
    null
  )

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
            Fragrance and Blending Calculator
          </h1>
          <DocsTrigger category="guide" slug="blending-lab">
            View guide
          </DocsTrigger>
        </div>
        <p className="text-sm text-muted-foreground">
          Get precise fragrance calculations for any project
        </p>
        <div className="flex flex-col gap-2">
          <h2 className="text-base font-medium text-foreground">
            Formulating unique fragrances for your products just got easier!
          </h2>
          <p className="text-sm text-muted-foreground">
            The Fragrance and Blending Calculator makes it simple to create
            signature scents quickly and accurately:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            <li>Pick up to 4 fragrances to build your blend</li>
            <li>Set the blend ratios</li>
            <li>Select the product type for the blend</li>
            <li>Choose the desired fragrance load from the slider options</li>
          </ul>
          <p className="text-xs text-muted-foreground">
            This calculator also helps you determine the amount of fragrance for
            single-scent products. Just select one fragrance in that case!
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Fragrance Wheel - left column */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 flex flex-col gap-4">
            <FragranceWheel
              selectedFamily={selectedFamily}
              onSelectFamily={setSelectedFamily}
            />
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                How to Blend
              </h3>
              <ul className="flex flex-col gap-2 text-xs text-muted-foreground leading-relaxed">
                <li>
                  <span className="text-foreground font-medium">Kindred</span>{" "}
                  families are adjacent on the wheel -- they share
                  characteristics and blend harmoniously.
                </li>
                <li>
                  <span className="text-foreground font-medium">
                    Complementary
                  </span>{" "}
                  families are across the wheel -- they create complex,
                  intriguing contrasts.
                </li>
                <li>
                  Pick a{" "}
                  <span className="text-foreground font-medium">dominant</span>{" "}
                  fragrance at a higher percentage, then layer in supporting
                  scents at lower ratios.
                </li>
                <li>
                  Test your blend with{" "}
                  <span className="text-foreground font-medium">
                    blotter strips
                  </span>{" "}
                  before committing to a full batch.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Blending Calculator - right column */}
        <div className="lg:col-span-2">
          <BlendingCalculator />
        </div>
      </div>
    </div>
  )
}
