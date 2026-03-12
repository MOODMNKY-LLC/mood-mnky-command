"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  FRAGRANCE_FAMILIES,
  FAMILY_COLORS,
  FAMILY_SEASONS,
  FAMILY_KINDRED,
  FAMILY_COMPLEMENTARY,
  type FragranceFamily,
} from "@/lib/types"

interface FragranceWheelProps {
  selectedFamily?: FragranceFamily | null
  onSelectFamily?: (family: FragranceFamily) => void
  highlightedFamilies?: FragranceFamily[]
  /** When true, hides the legend card below the wheel (for compact embedding) */
  compact?: boolean
}

export function FragranceWheel({
  selectedFamily,
  onSelectFamily,
  highlightedFamilies,
  compact = false,
}: FragranceWheelProps) {
  const [hoveredFamily, setHoveredFamily] = useState<FragranceFamily | null>(
    null
  )
  const activeFamily = hoveredFamily || selectedFamily || null
  const kindred =
    activeFamily && activeFamily in FAMILY_KINDRED
      ? FAMILY_KINDRED[activeFamily as FragranceFamily]
      : []
  const complementary =
    activeFamily && activeFamily in FAMILY_COMPLEMENTARY
      ? FAMILY_COMPLEMENTARY[activeFamily as FragranceFamily]
      : null

  const families = [...FRAGRANCE_FAMILIES]
  const total = families.length
  const cx = 160
  const cy = 160
  const outerR = 140
  const innerR = 60
  const anglePerSlice = (2 * Math.PI) / total
  // Start at -PI/2 so first slice is at the top
  const startOffset = -Math.PI / 2

  // Round to avoid hydration mismatch from floating-point differences between server/client
  const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d

  function polarToCart(angle: number, radius: number) {
    return {
      x: round(cx + radius * Math.cos(angle)),
      y: round(cy + radius * Math.sin(angle)),
    }
  }

  function getSlicePath(index: number) {
    const a1 = startOffset + index * anglePerSlice
    const a2 = a1 + anglePerSlice
    const outerStart = polarToCart(a1, outerR)
    const outerEnd = polarToCart(a2, outerR)
    const innerEnd = polarToCart(a2, innerR)
    const innerStart = polarToCart(a1, innerR)
    const largeArc = anglePerSlice > Math.PI ? 1 : 0
    return [
      `M ${outerStart.x} ${outerStart.y}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
      `L ${innerEnd.x} ${innerEnd.y}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
      "Z",
    ].join(" ")
  }

  function getLabelPos(index: number) {
    const mid = startOffset + index * anglePerSlice + anglePerSlice / 2
    const r = (outerR + innerR) / 2
    return polarToCart(mid, r)
  }

  function getLabelAngle(index: number) {
    const midAngle =
      (startOffset + index * anglePerSlice + anglePerSlice / 2) *
      (180 / Math.PI)
    return round(midAngle)
  }

  function getOpacity(family: FragranceFamily) {
    if (highlightedFamilies && highlightedFamilies.length > 0) {
      return highlightedFamilies.includes(family) ? 1 : 0.2
    }
    if (!activeFamily) return 0.85
    if (family === activeFamily) return 1
    if (kindred.includes(family)) return 0.7
    if (family === complementary) return 0.55
    return 0.15
  }

  function getStroke(family: FragranceFamily) {
    if (!activeFamily) return "transparent"
    if (family === activeFamily) return "#fff"
    if (kindred.includes(family)) return FAMILY_COLORS[family]
    if (family === complementary) return FAMILY_COLORS[family]
    return "transparent"
  }

  // Season labels around the wheel
  const seasonPositions = [
    { label: "Summer", angle: startOffset + 0 * anglePerSlice },
    { label: "Spring", angle: startOffset + 2.5 * anglePerSlice },
    { label: "Fall", angle: startOffset + 5 * anglePerSlice },
    { label: "Winter", angle: startOffset + 7.5 * anglePerSlice },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center">
        <svg
          viewBox="0 0 320 320"
          className="w-full max-w-[360px]"
          role="img"
          aria-label="CandleScience Fragrance Wheel showing 10 scent families arranged by season"
        >
          {/* Season labels */}
          {seasonPositions.map((sp) => {
            const pos = polarToCart(sp.angle, outerR + 16)
            return (
              <text
                key={sp.label}
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="fill-muted-foreground text-[9px] font-medium uppercase tracking-widest"
              >
                {sp.label}
              </text>
            )
          })}

          {/* Slices */}
          {families.map((family, i) => {
            const opacity = getOpacity(family)
            const stroke = getStroke(family)
            return (
              <g key={family}>
                <path
                  d={getSlicePath(i)}
                  fill={FAMILY_COLORS[family]}
                  fillOpacity={opacity}
                  stroke={stroke}
                  strokeWidth={family === activeFamily ? 2.5 : 1}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredFamily(family)}
                  onMouseLeave={() => setHoveredFamily(null)}
                  onClick={() => onSelectFamily?.(family)}
                />
                {/* Label */}
                {(() => {
                  const pos = getLabelPos(i)
                  const angle = getLabelAngle(i)
                  const flip = angle > 90 || angle < -90
                  return (
                    <text
                      x={pos.x}
                      y={pos.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      transform={`rotate(${flip ? angle + 180 : angle}, ${pos.x}, ${pos.y})`}
                      className="pointer-events-none fill-foreground text-[8px] font-semibold"
                      style={{
                        fill:
                          opacity < 0.3
                            ? "hsl(var(--muted-foreground))"
                            : "#fff",
                      }}
                    >
                      {family.length > 12
                        ? family.replace("/", "/ ")
                        : family}
                    </text>
                  )
                })()}
              </g>
            )
          })}

          {/* Center circle */}
          <circle
            cx={cx}
            cy={cy}
            r={innerR - 2}
            className="fill-background stroke-border"
            strokeWidth={1}
          />
          <text
            x={cx}
            y={cy - 8}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-foreground text-[9px] font-bold"
          >
            FRAGRANCE
          </text>
          <text
            x={cx}
            y={cy + 6}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-foreground text-[9px] font-bold"
          >
            WHEEL
          </text>
          {activeFamily && (
            <text
              x={cx}
              y={cy + 22}
              textAnchor="middle"
              dominantBaseline="central"
              className="text-[7px] font-medium"
              fill={FAMILY_COLORS[activeFamily]}
            >
              {activeFamily}
            </text>
          )}
        </svg>
      </div>

      {/* Legend - always reserved to prevent layout shift (hidden when compact) */}
      {!compact && (
      <Card className="min-h-[140px] border-border bg-card">
        <CardContent className="p-4">
          {activeFamily ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: FAMILY_COLORS[activeFamily] }}
                />
                <span className="text-sm font-semibold text-foreground">
                  {activeFamily}
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] text-muted-foreground"
                >
                  {FAMILY_SEASONS[activeFamily]}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Kindred (harmonious)
                  </span>
                  <div className="flex gap-1">
                    {kindred.map((f) => (
                      <Badge
                        key={f}
                        variant="outline"
                        className="text-[10px]"
                        style={{
                          borderColor: `${FAMILY_COLORS[f]}60`,
                          color: FAMILY_COLORS[f],
                        }}
                      >
                        {f}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Complementary (contrast)
                  </span>
                  {complementary && (
                    <Badge
                      variant="outline"
                      className="text-[10px] w-fit"
                      style={{
                        borderColor: `${FAMILY_COLORS[complementary]}60`,
                        color: FAMILY_COLORS[complementary],
                      }}
                    >
                      {complementary}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[108px] flex-col justify-center gap-1 text-center">
              <p className="text-sm text-muted-foreground">
                Click or hover a segment
              </p>
              <p className="text-xs text-muted-foreground">
                to see kindred and complementary families
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  )
}
