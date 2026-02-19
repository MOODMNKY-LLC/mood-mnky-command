"use client";

import { Star, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { FragranceOil } from "@/lib/types";
import { FAMILY_COLORS } from "@/lib/types";

interface DojoFragranceOilCardProps {
  oil: FragranceOil;
  onSelect?: (oil: FragranceOil) => void;
  isSelected?: boolean;
  compact?: boolean;
}

const APPLICATIONS: Array<{
  key: keyof Pick<
    FragranceOil,
    "candleSafe" | "soapSafe" | "lotionSafe" | "perfumeSafe" | "roomSpraySafe" | "waxMeltSafe"
  >;
  label: string;
}> = [
  { key: "candleSafe", label: "Candle" },
  { key: "soapSafe", label: "Soap" },
  { key: "lotionSafe", label: "Lotion" },
  { key: "perfumeSafe", label: "Perfume" },
  { key: "roomSpraySafe", label: "Room Spray" },
  { key: "waxMeltSafe", label: "Wax Melt" },
];

export function DojoFragranceOilCard({
  oil,
  onSelect,
  isSelected = false,
  compact = false,
}: DojoFragranceOilCardProps) {
  const imageUrl = oil.thumbnailUrl ?? oil.imageUrl;

  const card = (
    <Card
      className={`border-border bg-card transition-all ${
        onSelect
          ? "cursor-pointer hover:border-primary/40" + (isSelected ? " border-primary ring-1 ring-primary/30" : "")
          : ""
      }`}
      onClick={onSelect ? () => onSelect(oil) : undefined}
    >
      <CardContent className={compact ? "p-4" : "p-5"}>
        <div className="flex gap-4">
          {imageUrl && (
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-border">
              <img
                src={imageUrl}
                alt={oil.name}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold text-foreground">{oil.name}</h3>
              <div className="flex shrink-0 items-center gap-1">
                {oil.rating > 0 && (
                  <>
                    <Star className="h-3 w-3 fill-primary text-primary" />
                    <span className="text-xs font-medium text-foreground">{oil.rating}</span>
                  </>
                )}
              </div>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="text-[10px]"
                style={{
                  backgroundColor: `${FAMILY_COLORS[oil.family]}18`,
                  color: FAMILY_COLORS[oil.family],
                  borderColor: `${FAMILY_COLORS[oil.family]}40`,
                }}
              >
                {oil.family}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                {oil.type}
              </Badge>
            </div>
            {!compact && oil.description && (
              <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{oil.description}</p>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="mt-3 flex flex-col gap-2">
          <div className="flex flex-wrap gap-1">
            {oil.topNotes.slice(0, 3).map((note) => (
              <Badge
                key={note}
                variant="outline"
                className="text-[10px] border-chart-1/30 px-1.5 py-0 text-chart-1"
              >
                T: {note}
              </Badge>
            ))}
            {oil.middleNotes.slice(0, 2).map((note) => (
              <Badge
                key={note}
                variant="outline"
                className="text-[10px] border-chart-2/30 px-1.5 py-0 text-chart-2"
              >
                M: {note}
              </Badge>
            ))}
            {oil.baseNotes.slice(0, 2).map((note) => (
              <Badge
                key={note}
                variant="outline"
                className="text-[10px] border-chart-3/30 px-1.5 py-0 text-chart-3"
              >
                B: {note}
              </Badge>
            ))}
          </div>

          {/* Applications */}
          <div className="flex flex-wrap gap-1.5">
            {APPLICATIONS.map(({ key, label }) => {
              const safe = oil[key];
              return (
                <span key={key} className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                  {safe ? (
                    <Check className="h-3 w-3 text-green-600" />
                  ) : (
                    <X className="h-3 w-3 text-muted-foreground/50" />
                  )}
                  {label}
                </span>
              );
            })}
          </div>

          {/* Max usage & Price */}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {oil.maxUsageCandle > 0 && (
              <span>Max candle: {oil.maxUsageCandle}%</span>
            )}
            {oil.price1oz > 0 && (
              <span className="font-mono">${oil.price1oz.toFixed(2)}/oz</span>
            )}
          </div>

          {!compact && oil.blendsWellWith.length > 0 && (
            <div className="mt-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Blends well with:
              </span>
              <div className="mt-1 flex flex-wrap gap-1">
                {oil.blendsWellWith.slice(0, 4).map((name) => (
                  <Badge key={name} variant="outline" className="text-[10px]">
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return card;
}
