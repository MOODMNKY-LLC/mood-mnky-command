"use client";

import { Star, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NoteWithGlossaryTooltip } from "@/components/dojo/note-with-glossary-tooltip";
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
      <CardContent className={compact ? "p-1.5" : "p-4"}>
        <div className={compact ? "flex gap-1.5" : "flex gap-4"}>
          {imageUrl && (
            <div className={`relative shrink-0 overflow-hidden rounded border border-border ${compact ? "h-8 w-8" : "h-14 w-14"}`}>
              <img
                src={imageUrl}
                alt={oil.name}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-1">
              <h3 className={compact ? "text-xs font-semibold text-foreground leading-tight" : "text-sm font-semibold text-foreground"}>{oil.name}</h3>
              <div className="flex shrink-0 items-center gap-1">
                {oil.rating > 0 && (
                  <>
                    <Star className="h-3 w-3 fill-primary text-primary" />
                    <span className="text-xs font-medium text-foreground">{oil.rating}</span>
                  </>
                )}
              </div>
            </div>
            <div className={compact ? "mt-0.5 flex flex-wrap items-center gap-1" : "mt-1 flex flex-wrap items-center gap-2"}>
              <Badge
                variant="outline"
                className={compact ? "text-[9px] px-1 py-0" : "text-[10px]"}
                style={{
                  backgroundColor: `${FAMILY_COLORS[oil.family]}18`,
                  color: FAMILY_COLORS[oil.family],
                  borderColor: `${FAMILY_COLORS[oil.family]}40`,
                }}
              >
                {oil.family}
              </Badge>
              {!compact && (
                <Badge variant="secondary" className="text-[10px]">
                  {oil.type}
                </Badge>
              )}
            </div>
            {!compact && oil.description && (
              <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{oil.description}</p>
            )}
          </div>
        </div>

        {/* Notes - single line in compact */}
        <div className={compact ? "mt-0.5 flex flex-wrap gap-0.5" : "mt-2 flex flex-col gap-1.5"}>
          {compact ? (
            <div className="flex flex-wrap gap-x-1 gap-y-0">
              {oil.topNotes.slice(0, 1).map((n) => (
                <NoteWithGlossaryTooltip key={`t-${n}`} note={n} variant="top">
                  <span className="text-[9px] text-muted-foreground">{n}</span>
                </NoteWithGlossaryTooltip>
              ))}
              {oil.middleNotes.slice(0, 1).map((n) => (
                <NoteWithGlossaryTooltip key={`m-${n}`} note={n} variant="middle">
                  <span className="text-[9px] text-muted-foreground">{n}</span>
                </NoteWithGlossaryTooltip>
              ))}
              {oil.baseNotes.slice(0, 1).map((n) => (
                <NoteWithGlossaryTooltip key={`b-${n}`} note={n} variant="base">
                  <span className="text-[9px] text-muted-foreground">{n}</span>
                </NoteWithGlossaryTooltip>
              ))}
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-1">
                {oil.topNotes.slice(0, 2).map((note) => (
                  <NoteWithGlossaryTooltip key={note} note={note} variant="top">
                    <Badge variant="outline" className="text-[10px] border-chart-1/30 px-1.5 py-0 text-chart-1">
                      T: {note}
                    </Badge>
                  </NoteWithGlossaryTooltip>
                ))}
                {oil.middleNotes.slice(0, 1).map((note) => (
                  <NoteWithGlossaryTooltip key={note} note={note} variant="middle">
                    <Badge variant="outline" className="text-[10px] border-chart-2/30 px-1.5 py-0 text-chart-2">
                      M: {note}
                    </Badge>
                  </NoteWithGlossaryTooltip>
                ))}
                {oil.baseNotes.slice(0, 1).map((note) => (
                  <NoteWithGlossaryTooltip key={note} note={note} variant="base">
                    <Badge variant="outline" className="text-[10px] border-chart-3/30 px-1.5 py-0 text-chart-3">
                      B: {note}
                    </Badge>
                  </NoteWithGlossaryTooltip>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {APPLICATIONS.slice(0, 3).map(({ key, label }) => {
                  const safe = oil[key];
                  return (
                    <span key={key} className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      {safe ? <Check className="h-2.5 w-2.5 text-green-600 shrink-0" /> : <X className="h-2.5 w-2.5 text-muted-foreground/50 shrink-0" />}
                      {label}
                    </span>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {oil.maxUsageCandle > 0 && <span>Max {oil.maxUsageCandle}%</span>}
                {oil.price1oz > 0 && <span className="font-mono">${oil.price1oz.toFixed(2)}/oz</span>}
              </div>
            </>
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
      </CardContent>
    </Card>
  );

  return card;
}
