import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { getVerseSubscriptionStatus } from "@/lib/verse-subscription"
import { ChapterReaderClient } from "@/components/verse/chapter-reader-client"
import { VerseFreeTierBanner } from "@/components/verse/verse-free-tier-banner"
import { resolveGidToVerseUrl } from "@/lib/shopify/resolve-gid"

export const dynamic = "force-dynamic"

export default async function VerseChapterPage({
  params,
}: {
  params: Promise<{ slug: string; n: string }>
}) {
  const { slug, n } = await params
  const chapterOrder = parseInt(n, 10)
  if (Number.isNaN(chapterOrder) || chapterOrder < 1) notFound()

  const supabase = await createClient()
  const subscription = await getVerseSubscriptionStatus()
  const { data: issue } = await supabase
    .from("mnky_issues")
    .select("id")
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (!issue) notFound()

  const { data: chapter } = await supabase
    .from("mnky_chapters")
    .select("id, fragrance_name, chapter_order, setting")
    .eq("issue_id", issue.id)
    .eq("chapter_order", chapterOrder)
    .single()

  if (!chapter) notFound()

  const { data: panels } = await supabase
    .from("mnky_panels")
    .select("id, panel_number, script_text, asset_url")
    .eq("chapter_id", chapter.id)
    .order("panel_number")

  const { data: hotspots } = await supabase
    .from("mnky_hotspots")
    .select("id, panel_id, type, shopify_gid, x, y, label, tooltip")
  const hotspotsByPanel = (hotspots ?? []).reduce<Record<string, typeof hotspots>>((acc, h) => {
    const pid = (h as { panel_id: string }).panel_id
    if (!acc[pid]) acc[pid] = []
    acc[pid].push(h)
    return acc
  }, {})

  const hotspotType = (t: string): "product" | "variant" | "collection" | "bundle" =>
    ["product", "variant", "collection", "bundle"].includes(t) ? (t as "product" | "variant" | "collection" | "bundle") : "product"

  const hrefByHotspotId: Record<string, string> = {}
  for (const h of hotspots ?? []) {
    const hid = (h as { id: string }).id
    if (!hrefByHotspotId[hid]) {
      const result = await resolveGidToVerseUrl(
        (h as { shopify_gid: string }).shopify_gid,
        hotspotType((h as { type: string }).type)
      )
      hrefByHotspotId[hid] = result.ok ? result.url : "/dojo/products"
    }
  }

  const panelsWithHotspots = (panels ?? []).map((p) => ({
    ...p,
    hotspots: (hotspotsByPanel[p.id] ?? []).map((h) => ({
      ...h,
      href: hrefByHotspotId[(h as { id: string }).id] ?? "/dojo/products",
    })),
  }))

  return (
    <div className="verse-container mx-auto max-w-[var(--verse-page-width)] px-4 py-8 md:px-6">
      <VerseFreeTierBanner
        subscriptionTier={subscription.subscriptionTier}
        isAuthenticated={subscription.isAuthenticated}
        context="chapters and XP"
      />
      <div className="mb-6 flex items-center justify-between">
        <Link href={`/dojo/issues/${slug}`} className="text-primary text-sm underline">
          ← {slug}
        </Link>
        <span className="text-muted-foreground text-sm">
          Chapter {chapter.chapter_order}: {chapter.fragrance_name}
        </span>
      </div>

      <ChapterReaderClient
        issueId={issue.id}
        chapterId={chapter.id}
        panels={panelsWithHotspots}
        sessionId={`verse-${slug}-${n}-${Date.now()}`}
      />
    </div>
  )
}
