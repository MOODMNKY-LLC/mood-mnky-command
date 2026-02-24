import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getVerseSubscriptionStatus } from "@/lib/verse-subscription"
import {
  BoxFrame,
  BoxHero,
  BoxGrid,
  BoxCard,
  BoxCTA,
} from "@/components/mnky-box"
import { VerseFreeTierBanner } from "@/components/verse/verse-free-tier-banner"

export const dynamic = "force-dynamic"

type BoxProduct = {
  id: string
  fragrance_name: string
  shopify_product_gid: string
  setting?: string
  chapter_order: number
  card_image_url?: string
}

export default async function VerseDropSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  const subscription = await getVerseSubscriptionStatus()

  const { data: issueRow, error: issueError } = await supabase
    .from("mnky_issues")
    .select(
      `id, title, slug, issue_number, arc_summary, cover_asset_url, hero_asset_url, lore_override, accent_primary, accent_secondary, mnky_collections ( id, name, slug )`
    )
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (issueError || !issueRow) notFound()

  const { data: chapters } = await supabase
    .from("mnky_chapters")
    .select("id, fragrance_name, shopify_product_gid, setting, chapter_order")
    .eq("issue_id", issueRow.id)
    .order("chapter_order", { ascending: true })

  const chapterIds = (chapters ?? []).map((c) => c.id)
  const { data: firstPanels } = await supabase
    .from("mnky_panels")
    .select("chapter_id, asset_url")
    .in("chapter_id", chapterIds)
    .eq("panel_number", 1)
  const panelByChapter = new Map(
    (firstPanels ?? []).map((p) => [p.chapter_id, p.asset_url])
  )

  const issue = {
    id: issueRow.id,
    title: issueRow.title,
    slug: issueRow.slug,
    issue_number: issueRow.issue_number,
    arc_summary: issueRow.arc_summary,
    cover_asset_url: issueRow.cover_asset_url,
    hero_asset_url: issueRow.hero_asset_url ?? issueRow.cover_asset_url,
    lore_override: issueRow.lore_override ?? issueRow.arc_summary,
    accent_primary: issueRow.accent_primary ?? "#B7F0FF",
    accent_secondary: issueRow.accent_secondary ?? "#F6D1A7",
  }
  const collection = issueRow.mnky_collections as
    | { id: string; name: string; slug: string }
    | null
  const products: BoxProduct[] = (chapters ?? []).map((ch) => ({
    id: ch.id,
    fragrance_name: ch.fragrance_name,
    shopify_product_gid: ch.shopify_product_gid,
    setting: ch.setting ?? undefined,
    chapter_order: ch.chapter_order,
    card_image_url: panelByChapter.get(ch.id) ?? undefined,
  }))

  return (
    <div className="verse-storefront min-h-screen">
      <div className="verse-container mx-auto max-w-[var(--verse-page-width)] px-4 pt-4 md:px-6">
        <VerseFreeTierBanner
          subscriptionTier={subscription.subscriptionTier}
          isAuthenticated={subscription.isAuthenticated}
          context="this drop and manga"
        />
      </div>
      <div
        className="mnky-box"
        style={
          {
            "--mnky-box-accent-primary": issue.accent_primary,
            "--mnky-box-accent-secondary": issue.accent_secondary,
          } as React.CSSProperties
        }
      >
        <BoxFrame>
          <BoxHero
            kicker="MNKY BOX"
            title={issue.title.toUpperCase()}
            subhead={
              collection
                ? `${collection.name} · Issue #${issue.issue_number}`
                : `Issue #${issue.issue_number}`
            }
            lore={issue.lore_override ?? issue.arc_summary}
          >
            {issue.hero_asset_url ? (
              <div className="relative mx-auto max-w-4xl overflow-hidden border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={issue.hero_asset_url}
                  alt=""
                  className="w-full object-contain"
                />
              </div>
            ) : null}
          </BoxHero>

          <BoxGrid>
            {products.map((product) => (
              <BoxCard
                key={product.id}
                title={product.fragrance_name}
                body={product.setting}
                meta="Signature Blend"
                href={`/verse/issues/${issue.slug}/chapters/${product.chapter_order}`}
                cta="Explore"
                media={
                  product.card_image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={product.card_image_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-mnkyBox-text-muted text-sm">
                      {product.fragrance_name}
                    </span>
                  )
                }
              />
            ))}
          </BoxGrid>

          <BoxCTA
            title="Enter the MNKY DOJO"
            href="/verse/join"
            label="Unlock Members Access"
          />
        </BoxFrame>
      </div>

      <div className="verse-container mx-auto max-w-[var(--verse-page-width)] px-4 py-4 md:px-6">
        <Link
          href={`/verse/issues/${issue.slug}`}
          className="text-primary text-sm underline"
        >
          ← Read as manga
        </Link>
      </div>
    </div>
  )
}
