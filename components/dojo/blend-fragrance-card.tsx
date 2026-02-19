"use client";

import { Star, CheckCircle, XCircle, DollarSign, Palette } from "lucide-react";
import { NoteWithGlossaryTooltip } from "@/components/dojo/note-with-glossary-tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FragranceOil } from "@/lib/types";
import {
  FAMILY_COLORS,
  FAMILY_KINDRED,
  FAMILY_COMPLEMENTARY,
  FAMILY_SEASONS,
} from "@/lib/types";

const SAFETY_ITEMS: Array<{
  key: keyof Pick<
    FragranceOil,
    | "candleSafe"
    | "soapSafe"
    | "lotionSafe"
    | "perfumeSafe"
    | "roomSpraySafe"
    | "waxMeltSafe"
  >;
  label: string;
  maxKey?: keyof Pick<
    FragranceOil,
    "maxUsageCandle" | "maxUsageSoap" | "maxUsageLotion"
  >;
}> = [
  { key: "candleSafe", label: "Candle", maxKey: "maxUsageCandle" },
  { key: "soapSafe", label: "Soap", maxKey: "maxUsageSoap" },
  { key: "lotionSafe", label: "Lotion", maxKey: "maxUsageLotion" },
  { key: "perfumeSafe", label: "Perfume" },
  { key: "roomSpraySafe", label: "Room Spray" },
  { key: "waxMeltSafe", label: "Wax Melt" },
];

interface BlendFragranceCardProps {
  oil: FragranceOil;
  onAddToBlend?: () => void;
}

export function BlendFragranceCard({
  oil,
  onAddToBlend,
}: BlendFragranceCardProps) {
  const kindred = FAMILY_KINDRED[oil.family] ?? [];
  const complementary = FAMILY_COMPLEMENTARY[oil.family];
  const season = FAMILY_SEASONS[oil.family] ?? "All Season";
  const imageUrl = oil.thumbnailUrl ?? oil.imageUrl;
  const familyColor = FAMILY_COLORS[oil.family];

  return (
    <Card
      className="h-full border-border bg-card text-foreground rounded-lg overflow-hidden"
      style={{
        borderLeftWidth: "4px",
        borderLeftColor: familyColor,
      }}
    >
      <CardHeader
        className="pb-2 pt-3 px-4 border-b border-border"
        style={{ backgroundColor: `${familyColor}08` }}
      >
        <div className="flex gap-3">
          {imageUrl ? (
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 border-border">
              <img
                src={imageUrl}
                alt={oil.name}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div
              className="h-14 w-14 shrink-0 rounded-lg border-2 border-border"
              style={{ backgroundColor: `${familyColor}25` }}
            />
          )}
          <div className="min-w-0 flex-1">
            <CardTitle className="text-sm font-semibold leading-tight text-foreground">
              {oil.name}
            </CardTitle>
            <div className="mt-1.5 flex flex-wrap gap-1">
              <Badge
                variant="outline"
                className="text-xs font-medium"
                style={{
                  borderColor: `${familyColor}80`,
                  color: familyColor,
                  backgroundColor: `${familyColor}15`,
                }}
              >
                {oil.family}
              </Badge>
              {oil.subfamilies?.map((sub) => (
                <Badge
                  key={sub}
                  variant="outline"
                  className="text-[10px]"
                  style={{
                    borderColor: `${FAMILY_COLORS[sub as keyof typeof FAMILY_COLORS] ?? "#888"}60`,
                    color: FAMILY_COLORS[sub as keyof typeof FAMILY_COLORS] ?? "#888",
                  }}
                >
                  {sub}
                </Badge>
              ))}
              <Badge variant="secondary" className="text-[10px] text-muted-foreground">
                {oil.type}
              </Badge>
            </div>
            {oil.rating > 0 && (
              <div className="mt-1 flex items-center gap-1 text-xs text-foreground">
                <Star className="h-4 w-4 fill-primary text-primary shrink-0" />
                <span className="font-medium">{oil.rating}</span>
                {oil.reviewCount > 0 && (
                  <span className="text-muted-foreground">({oil.reviewCount} reviews)</span>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-4 text-foreground overflow-y-auto">
        {oil.description && (
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">
            {oil.description}
          </p>
        )}

        {/* Notes - all notes, color-matched by variant */}
        <div className="space-y-2">
          {oil.topNotes.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-medium text-muted-foreground w-10 shrink-0">
                Top:
              </span>
              {oil.topNotes.map((note) => (
                <NoteWithGlossaryTooltip key={note} note={note} variant="top">
                  <NoteBadge note={note} variant="top" />
                </NoteWithGlossaryTooltip>
              ))}
            </div>
          )}
          {oil.middleNotes.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-medium text-muted-foreground w-10 shrink-0">
                Mid:
              </span>
              {oil.middleNotes.map((note) => (
                <NoteWithGlossaryTooltip key={note} note={note} variant="middle">
                  <NoteBadge note={note} variant="middle" />
                </NoteWithGlossaryTooltip>
              ))}
            </div>
          )}
          {oil.baseNotes.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-medium text-muted-foreground w-10 shrink-0">
                Base:
              </span>
              {oil.baseNotes.map((note) => (
                <NoteWithGlossaryTooltip key={note} note={note} variant="base">
                  <NoteBadge note={note} variant="base" />
                </NoteWithGlossaryTooltip>
              ))}
            </div>
          )}
        </div>

        {/* Safety - full grid, theme colors */}
        <div>
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Applications
          </span>
          <div className="mt-1 grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1">
            {SAFETY_ITEMS.map(({ key, label, maxKey }) => {
              const safe = oil[key];
              const max = maxKey ? oil[maxKey] : 0;
              return (
                <span
                  key={key}
                  className="flex items-center gap-1.5 text-xs"
                  title={label}
                >
                  {safe ? (
                    <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-500 shrink-0" />
                  ) : (
                    <XCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                  <span className="text-foreground">{label}</span>
                  {safe && max > 0 && (
                    <span className="text-muted-foreground text-[10px]">({max}%)</span>
                  )}
                </span>
              );
            })}
          </div>
        </div>

        {/* Pricing */}
        {(oil.price1oz > 0 || oil.price4oz > 0 || oil.price16oz > 0) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <DollarSign className="h-4 w-4 shrink-0 text-foreground" />
            {[
              oil.price1oz > 0 && `1 oz $${oil.price1oz.toFixed(2)}`,
              oil.price4oz > 0 && `4 oz $${oil.price4oz.toFixed(2)}`,
              oil.price16oz > 0 && `16 oz $${oil.price16oz.toFixed(2)}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </div>
        )}

        {/* Blends well with */}
        {oil.blendsWellWith.length > 0 && (
          <div>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Blends well with
            </span>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {oil.blendsWellWith.join(", ")}
            </p>
          </div>
        )}

        {/* Suggested colors */}
        {oil.suggestedColors?.length > 0 && (
          <div>
            <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              <Palette className="h-3 w-3" />
              Suggested colors
            </span>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {oil.suggestedColors.join(", ")}
            </p>
          </div>
        )}

        {/* Alternative branding */}
        {oil.alternativeBranding?.length > 0 && (
          <div>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Also known as
            </span>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {oil.alternativeBranding.join(", ")}
            </p>
          </div>
        )}

        {/* Allergen statement */}
        {oil.allergenStatement && (
          <div className="rounded-md border border-border bg-muted/30 px-3 py-2">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              Allergen
            </span>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {oil.allergenStatement}
            </p>
          </div>
        )}

        {/* Wheel guidance - color-matched badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border">
          <span className="text-[10px] font-medium text-muted-foreground">
            {season}
          </span>
          {kindred.length > 0 && (
            <>
              <span className="text-muted-foreground/60">·</span>
              <span className="text-[10px] text-muted-foreground">Kindred:</span>
              {kindred.map((f) => (
                <Badge
                  key={f}
                  variant="outline"
                  className="text-[10px] py-0 px-1.5"
                  style={{
                    borderColor: `${FAMILY_COLORS[f]}60`,
                    color: FAMILY_COLORS[f],
                  }}
                >
                  {f}
                </Badge>
              ))}
            </>
          )}
          {complementary && (
            <>
              <span className="text-muted-foreground/60">·</span>
              <span className="text-[10px] text-muted-foreground">Complementary:</span>
              <Badge
                variant="outline"
                className="text-[10px] py-0 px-1.5"
                style={{
                  borderColor: `${FAMILY_COLORS[complementary]}60`,
                  color: FAMILY_COLORS[complementary],
                }}
              >
                {complementary}
              </Badge>
            </>
          )}
        </div>

        {onAddToBlend && (
          <Button
            size="sm"
            className="w-full mt-3 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={onAddToBlend}
          >
            Add to blend
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/** Note badge - will be enriched with glossary tooltip in todo 7 */
function NoteBadge({
  note,
  variant,
}: {
  note: string;
  variant: "top" | "middle" | "base";
}) {
  const colorClass =
    variant === "top"
      ? "border-chart-1/40 text-chart-1"
      : variant === "middle"
        ? "border-chart-2/40 text-chart-2"
        : "border-chart-3/40 text-chart-3";

  return (
    <Badge
      variant="outline"
      className={`text-[10px] ${colorClass}`}
    >
      {note}
    </Badge>
  );
}
