import Link from "next/link";
import { headers } from "next/headers";
import { Suspense } from "react";
import { storefrontFetch } from "@/lib/shopify/storefront-client";
import {
  PRODUCTS_QUERY,
  COLLECTION_BY_HANDLE_QUERY,
  COLLECTIONS_QUERY,
  PRODUCT_SEARCH_QUERY,
  PRODUCTS_BY_IDS_QUERY,
  PRODUCTS_DEFAULT_QUERY,
} from "@/lib/shopify/storefront-queries";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { VerseProductCard } from "@/components/verse/product-card";
import { VerseShopHero } from "@/components/verse/verse-shop-hero";
import { VersePersonalizedBanner } from "@/components/verse/verse-personalized-banner";
import { VerseXPBanner } from "@/components/verse/verse-xp-banner";
import { VerseQuestBanner } from "@/components/verse/verse-quest-banner";
import { VerseProductFilters } from "@/components/verse/verse-product-filters";
import { VerseCollectionsPills } from "@/components/verse/verse-collections-pills";
import { VerseMangaProducts } from "@/components/verse/verse-manga-products";
import { Button } from "@/components/ui/button";
import { BlurFade } from "@/components/ui/blur-fade";

type ProductCardProduct = Parameters<typeof VerseProductCard>[0]["product"];

const PAGE_SIZE = 24;

const SORT_MAP = {
  "best-selling": { sortKey: "BEST_SELLING" as const, reverse: false },
  newest: { sortKey: "CREATED_AT" as const, reverse: true },
  title: { sortKey: "TITLE" as const, reverse: false },
  "title-desc": { sortKey: "TITLE" as const, reverse: true },
  price: { sortKey: "PRICE" as const, reverse: false },
  "price-desc": { sortKey: "PRICE" as const, reverse: true },
} as const;

const COLLECTION_SORT_MAP = {
  "best-selling": { sortKey: "BEST_SELLING" as const, reverse: false },
  newest: { sortKey: "CREATED" as const, reverse: true },
  title: { sortKey: "TITLE" as const, reverse: false },
  "title-desc": { sortKey: "TITLE" as const, reverse: true },
  price: { sortKey: "PRICE" as const, reverse: false },
  "price-desc": { sortKey: "PRICE" as const, reverse: true },
} as const;

function buildProductsQuery(
  tag?: string,
  type?: string
): string {
  let q = PRODUCTS_DEFAULT_QUERY;
  const parts: string[] = [q];
  if (tag?.trim()) parts.push(`tag:${tag.trim()}`);
  if (type?.trim()) parts.push(`product_type:${type.trim()}`);
  return parts.length > 1 ? parts.join(" AND ") : q;
}

export default async function VerseProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const collection = typeof params.collection === "string" ? params.collection : undefined;
  const tag = typeof params.tag === "string" ? params.tag : undefined;
  const type = typeof params.type === "string" ? params.type : undefined;
  const sort = typeof params.sort === "string" ? params.sort : "best-selling";
  const q = typeof params.q === "string" ? params.q?.trim() : undefined;
  const cursor = typeof params.cursor === "string" ? params.cursor : undefined;

  const sortConfig = SORT_MAP[sort as keyof typeof SORT_MAP] ?? SORT_MAP["best-selling"];
  const collSortConfig =
    COLLECTION_SORT_MAP[sort as keyof typeof COLLECTION_SORT_MAP] ??
    COLLECTION_SORT_MAP["best-selling"];

  const h = await headers();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: { display_name?: string } | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();
    profile = data;
  }

  const isAuthenticated = !!user;

  const adminClient = createAdminClient();

  const [
    shopifyResult,
    collectionsResult,
    xpRulesData,
    funnelData,
    questData,
    mangaChaptersRes,
  ] = await Promise.all([
    fetchProductsOrCollection({
      collection,
      tag,
      type,
      sortKey: sortConfig.sortKey,
      reverse: sortConfig.reverse,
      collSortKey: collSortConfig.sortKey,
      collReverse: collSortConfig.reverse,
      q,
      cursor,
      h,
    }),
    storefrontFetch<{ collections?: { edges: Array<{ node: { id: string; title: string; handle: string; image?: { url: string; altText?: string } | null } }> } }>(
      COLLECTIONS_QUERY,
      { first: 20 },
      { headers: h }
    ),
    adminClient
      .from("config_xp_rules")
      .select("key, value")
      .eq("key", "purchase")
      .maybeSingle(),
    isAuthenticated && user
      ? fetchFunnelSubmission(supabase, user.id)
      : Promise.resolve(null),
    isAuthenticated && user
      ? fetchQuestProgress(adminClient, user.id)
      : Promise.resolve({ quests: [], progress: {} }),
    fetchMangaProducts(h),
  ]);

  const collections = collectionsResult?.collections?.edges?.map((e) => e.node) ?? [];
  const { products, hasNextPage, endCursor, collectionTitle } = shopifyResult;

  const purchaseRules = xpRulesData.data?.value as { tiers?: Array<{ subtotal_min: number; xp: number }> } | undefined;
  const purchaseTiers = purchaseRules?.tiers ?? [];

  const mappedAnswers = funnelData?.mappedAnswers as Record<string, unknown> | undefined;

  const quests = (questData?.quests ?? []) as Array<{
    id: string;
    title: string;
    rule?: { requirements?: Array<{ type?: string }> };
    xp_reward: number | null;
  }>;
  const progress = (questData?.progress ?? {}) as Record<string, boolean>;
  const hasPurchaseRequirement = (q: (typeof quests)[0]) =>
    (q.rule?.requirements ?? []).some((r) => r?.type === "purchase");
  const incompletePurchaseQuest =
    quests.find((q) => !progress[q.id] && hasPurchaseRequirement(q)) ??
    quests.find((q) => !progress[q.id]);

  const mangaProducts = mangaChaptersRes;

  return (
    <div className="verse-container mx-auto max-w-[var(--verse-page-width)] space-y-8 px-4 py-8 md:px-6 md:py-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-verse-heading text-3xl font-bold tracking-tight text-verse-text">
            {collection ? collectionTitle ?? "Products" : "Products"}
          </h1>
          <p className="text-verse-text-muted">
            {collection
              ? `Filtered by ${collection}`
              : "Browse all products"}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="border-verse-text/20 text-verse-text">
          <Link href="/verse/cart">View cart</Link>
        </Button>
      </header>

      <VerseShopHero />
      <VersePersonalizedBanner
        displayName={profile?.display_name}
        mappedAnswers={mappedAnswers}
      />
      <VerseXPBanner
        isAuthenticated={isAuthenticated}
        purchaseTiers={purchaseTiers}
      />
      <VerseQuestBanner quest={incompletePurchaseQuest ?? null} />

      <Suspense fallback={null}>
        <VerseProductFilters
          collections={collections}
          currentCollection={collection}
          currentTag={tag}
          currentType={type}
          currentSort={sort}
          currentQ={q}
        />
      </Suspense>

      <VerseCollectionsPills collections={collections} maxItems={6} />
      <VerseMangaProducts products={mangaProducts} />

      <BlurFade delay={0.15} inView inViewMargin="-20px">
        <section>
          <h2 className="font-verse-heading mb-4 text-xl font-semibold text-verse-text">
            {collection ? collectionTitle : "All products"}
          </h2>
          {products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {products.map((product: ProductCardProduct) => (
                  <VerseProductCard key={product.id} product={product} />
                ))}
              </div>
              {hasNextPage && endCursor && (
                <div className="mt-6 flex justify-center">
                  <Button variant="outline" asChild className="border-verse-text/20 text-verse-text">
                    <Link
                      href={buildLoadMoreUrl({
                        collection,
                        tag,
                        type,
                        sort,
                        q,
                        cursor: endCursor,
                      })}
                    >
                      Load more
                    </Link>
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-verse-text/20 p-8 text-center text-verse-text-muted">
              {q
                ? "No products match your search. Try different keywords."
                : "No products found. Publish products to the Headless channel in Shopify Admin."}
            </div>
          )}
        </section>
      </BlurFade>
    </div>
  );
}

async function fetchFunnelSubmission(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<{ mappedAnswers?: Record<string, unknown> } | null> {
  const since = new Date();
  since.setHours(since.getHours() - 168);

  const { data: run } = await supabase
    .from("funnel_runs")
    .select("id, funnel_id")
    .eq("user_id", userId)
    .eq("status", "submitted")
    .gte("submitted_at", since.toISOString())
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!run) return null;

  const { data: answers } = await supabase
    .from("funnel_answers")
    .select("question_key, answer")
    .eq("run_id", run.id);

  const answersMap = (answers ?? []).reduce(
    (acc, { question_key, answer }) => {
      acc[question_key] = (answer as { text?: string })?.text ?? answer;
      return acc;
    },
    {} as Record<string, unknown>
  );

  const { data: funnel } = await supabase
    .from("funnel_definitions")
    .select("question_mapping")
    .eq("id", run.funnel_id)
    .single();

  const mapping = (funnel?.question_mapping ?? {}) as Record<string, string>;
  if (Object.keys(mapping).length === 0) return { mappedAnswers: undefined };

  const mappedAnswers: Record<string, unknown> = {};
  for (const [semanticKey, qKey] of Object.entries(mapping)) {
    const val = answersMap[qKey];
    if (val !== undefined && val !== null && val !== "") {
      mappedAnswers[semanticKey] = val;
    }
  }
  return { mappedAnswers };
}

async function fetchQuestProgress(
  supabase: ReturnType<typeof createAdminClient>,
  profileId: string
): Promise<{ quests: Array<{ id: string; title: string; rule?: { type?: string }; xp_reward: number | null }>; progress: Record<string, boolean> }> {
  const [questsRes, progressRes] = await Promise.all([
    supabase
      .from("quests")
      .select("id, title, rule, xp_reward")
      .eq("active", true)
      .order("title"),
    supabase
      .from("quest_progress")
      .select("quest_id, completed_at")
      .eq("profile_id", profileId),
  ]);

  const quests = questsRes.data ?? [];
  const progressRows = progressRes.data ?? [];
  const progress: Record<string, boolean> = {};
  for (const p of progressRows) {
    progress[p.quest_id] = p.completed_at != null;
  }

  return {
    quests: quests.map((q) => ({
      id: q.id,
      title: q.title,
      rule: q.rule as { type?: string } | undefined,
      xp_reward: q.xp_reward,
    })),
    progress,
  };
}

function buildLoadMoreUrl(params: {
  collection?: string;
  tag?: string;
  type?: string;
  sort?: string;
  q?: string;
  cursor: string;
}): string {
  const sp = new URLSearchParams();
  if (params.collection) sp.set("collection", params.collection);
  if (params.tag) sp.set("tag", params.tag);
  if (params.type) sp.set("type", params.type);
  if (params.sort) sp.set("sort", params.sort);
  if (params.q) sp.set("q", params.q);
  sp.set("cursor", params.cursor);
  return `/verse/products?${sp.toString()}`;
}

async function fetchProductsOrCollection({
  collection,
  tag,
  type,
  sortKey,
  reverse,
  collSortKey,
  collReverse,
  q,
  cursor,
  h,
}: {
  collection?: string;
  tag?: string;
  type?: string;
  sortKey: string;
  reverse: boolean;
  collSortKey: string;
  collReverse: boolean;
  q?: string;
  cursor?: string;
  h: Headers;
}): Promise<{
  products: ProductCardProduct[];
  hasNextPage: boolean;
  endCursor?: string;
  collectionTitle?: string;
}> {
  const vars = {
    first: PAGE_SIZE,
    after: cursor || undefined,
  };

  if (q) {
    const searchData = await storefrontFetch<{
      search?: {
        edges: Array<{ node: ProductCardProduct }>;
      };
    }>(PRODUCT_SEARCH_QUERY, { query: q, first: PAGE_SIZE }, { headers: h });
    const edges = searchData?.search?.edges ?? [];
    return {
      products: edges.map((e) => e.node).filter(Boolean),
      hasNextPage: false,
    };
  }

  if (collection) {
    const filters: Array<{ tag?: string; productType?: string }> = [];
    if (tag) filters.push({ tag });
    if (type) filters.push({ productType: type });
    const data = await storefrontFetch<{
      collectionByHandle?: {
        title: string;
        products?: {
          pageInfo?: { hasNextPage?: boolean; endCursor?: string };
          edges?: Array<{ node: ProductCardProduct }>;
        };
      };
    }>(
      COLLECTION_BY_HANDLE_QUERY,
      {
        handle: collection,
        first: PAGE_SIZE,
        after: cursor || undefined,
        filters: filters.length > 0 ? filters : undefined,
        sortKey: collSortKey,
        reverse: collReverse,
      },
      { headers: h }
    );
    const coll = data?.collectionByHandle;
    const products = coll?.products?.edges?.map((e) => e.node) ?? [];
    return {
      products,
      hasNextPage: coll?.products?.pageInfo?.hasNextPage ?? false,
      endCursor: coll?.products?.pageInfo?.endCursor,
      collectionTitle: coll?.title,
    };
  }

  const queryStr = buildProductsQuery(tag, type);
  const data = await storefrontFetch<{
    products?: {
      pageInfo?: { hasNextPage?: boolean; endCursor?: string };
      edges?: Array<{ node: ProductCardProduct }>;
    };
  }>(
    PRODUCTS_QUERY,
    {
      ...vars,
      query: queryStr,
      sortKey,
      reverse,
    },
    { headers: h }
  );
  const products = data?.products?.edges?.map((e) => e.node) ?? [];
  return {
    products,
    hasNextPage: data?.products?.pageInfo?.hasNextPage ?? false,
    endCursor: data?.products?.pageInfo?.endCursor,
  };
}

async function fetchMangaProducts(h: Headers): Promise<ProductCardProduct[]> {
  const supabase = await createClient();
  const { data: chapters } = await supabase
    .from("mnky_chapters")
    .select("shopify_product_gid");

  if (!chapters?.length) return [];

  const gids = [
    ...new Set(
      chapters
        .map((c) => c.shopify_product_gid)
        .filter((gid): gid is string => !!gid?.trim())
        .map((gid) => (gid.startsWith("gid://") ? gid : `gid://shopify/Product/${gid}`))
    ),
  ].slice(0, 12);

  if (gids.length === 0) return [];

  try {
    const data = await storefrontFetch<{ nodes: (ProductCardProduct | null)[] }>(
      PRODUCTS_BY_IDS_QUERY,
      { ids: gids },
      { headers: h }
    );
    return (data?.nodes ?? []).filter((n): n is ProductCardProduct => n != null);
  } catch {
    return [];
  }
}
