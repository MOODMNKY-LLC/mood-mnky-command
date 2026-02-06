"use client"

import { useState } from "react"
import type { FragranceFamily } from "@/lib/types"
import { FragranceWheel } from "@/components/blending/fragrance-wheel"
import { BlendingCalculator } from "@/components/blending/blending-calculator"

export default function BlendingPage() {
  const [selectedFamily, setSelectedFamily] = useState<FragranceFamily | null>(
    null
  )

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
          Fragrance Blending
        </h1>
        <p className="text-sm text-muted-foreground">
          Use the CandleScience fragrance wheel to explore scent families and
          build custom blends with up to 4 fragrances
        </p>
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
