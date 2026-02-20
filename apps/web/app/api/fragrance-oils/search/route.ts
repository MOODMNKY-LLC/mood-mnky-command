import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getThumbnailUrlFromPublicUrl } from "@/lib/supabase/storage";
import {
  getExpandedSearchTerms,
  oilMatchesTerms,
} from "@/lib/fragrance-search";
import {
  type FragranceOil,
  type FragranceFamily,
  FRAGRANCE_FAMILIES,
} from "@/lib/types";

function dbRowToFragranceOil(row: {
  id: string;
  notion_id: string;
  name: string;
  description: string | null;
  family: string | null;
  type: string | null;
  subfamilies: string[] | null;
  top_notes: string[] | null;
  middle_notes: string[] | null;
  base_notes: string[] | null;
  alternative_branding: string[] | null;
  blends_well_with: string[] | null;
  suggested_colors: string[] | null;
  candle_safe: boolean;
  soap_safe: boolean;
  lotion_safe: boolean;
  perfume_safe: boolean;
  room_spray_safe: boolean;
  wax_melt_safe: boolean;
  max_usage_candle: number;
  max_usage_soap: number;
  max_usage_lotion: number;
  price_1oz: number;
  price_4oz: number;
  price_16oz: number;
  rating: number;
  review_count: number;
  notion_url: string | null;
  image_url: string | null;
  image_source: string | null;
  allergen_statement?: string | null;
}): FragranceOil {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    family: (row.family ?? "Floral") as FragranceFamily,
    subfamilies: (row.subfamilies ?? []) as FragranceFamily[],
    topNotes: row.top_notes ?? [],
    middleNotes: row.middle_notes ?? [],
    baseNotes: row.base_notes ?? [],
    type:
      row.type === "Blending Element"
        ? ("Blending Element" as const)
        : ("Fragrance Oil" as const),
    candleSafe: row.candle_safe ?? true,
    soapSafe: row.soap_safe ?? false,
    lotionSafe: row.lotion_safe ?? false,
    perfumeSafe: row.perfume_safe ?? false,
    roomSpraySafe: row.room_spray_safe ?? false,
    waxMeltSafe: row.wax_melt_safe ?? false,
    maxUsageCandle: Number(row.max_usage_candle) ?? 0,
    maxUsageSoap: Number(row.max_usage_soap) ?? 0,
    maxUsageLotion: Number(row.max_usage_lotion) ?? 0,
    price1oz: Number(row.price_1oz) ?? 0,
    price4oz: Number(row.price_4oz) ?? 0,
    price16oz: Number(row.price_16oz) ?? 0,
    rating: Number(row.rating) ?? 0,
    reviewCount: Number(row.review_count) ?? 0,
    blendsWellWith: row.blends_well_with ?? [],
    alternativeBranding: row.alternative_branding ?? [],
    suggestedColors: row.suggested_colors ?? [],
    notionUrl: row.notion_url ?? null,
    notionId: row.notion_id ?? null,
    imageUrl: row.image_url ?? null,
    imageSource: row.image_source ?? null,
    allergenStatement:
      "allergen_statement" in row ? row.allergen_statement ?? null : undefined,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const familyParam = searchParams.get("family")?.trim();
  const family: FragranceFamily | null =
    familyParam && FRAGRANCE_FAMILIES.includes(familyParam as FragranceFamily)
      ? (familyParam as FragranceFamily)
      : null;
  const limit = Math.min(
    500,
    Math.max(1, parseInt(searchParams.get("limit") ?? "200", 10))
  );

  const terms = getExpandedSearchTerms(q, family);
  const hasSearch = terms.length > 0;

  const supabase = createAdminClient();

  // Fetch enough rows for semantic search across notes/arrays
  const fetchLimit = hasSearch ? 500 : limit;

  // Always fetch enough rows; semantic search requires filtering notes/arrays in app
  // (single-term ilike on name/family/description misses oils with term only in notes)
  const query = supabase
    .from("fragrance_oils")
    .select("*, notion_url, image_url, image_source, allergen_statement")
    .order("name")
    .limit(fetchLimit);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let oils = (data ?? []).map(dbRowToFragranceOil) as FragranceOil[];

  if (hasSearch) {
    oils = oils.filter((oil) => oilMatchesTerms(oil, terms));
  }

  const total = oils.length;
  oils = oils.slice(0, limit);

  const enriched = oils.map((oil) => {
    if (oil.imageUrl) {
      try {
        const thumbnailUrl = getThumbnailUrlFromPublicUrl(supabase, oil.imageUrl);
        return { ...oil, thumbnailUrl };
      } catch {
        return oil;
      }
    }
    return oil;
  });

  return NextResponse.json({
    fragranceOils: enriched,
    total,
  });
}
