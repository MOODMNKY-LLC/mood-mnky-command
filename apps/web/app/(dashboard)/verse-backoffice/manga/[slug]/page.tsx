import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { MangaPublishShopifyButton } from "@/components/verse-backoffice/manga-publish-shopify-button"
import { MangaCoverUpload } from "@/components/verse-backoffice/manga-cover-upload"
import { MangaIssueEditForm } from "@/components/verse-backoffice/manga-issue-edit-form"
import {
  MangaChaptersPanels,
  type ChapterWithPanels,
} from "@/components/verse-backoffice/manga-chapters-panels"

export const dynamic = "force-dynamic"

export default async function MangaIssueSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: issue, error } = await supabase
    .from("mnky_issues")
    .select(`
      id, slug, title, issue_number, status, arc_summary, cover_asset_url, published_at, notion_id,
      mnky_collections ( id, name, slug )
    `)
    .eq("slug", slug)
    .single()

  if (error || !issue) notFound()

  const { data: chapters } = await supabase
    .from("mnky_chapters")
    .select(`
      id, fragrance_name, chapter_order, shopify_product_gid,
      mnky_panels ( id, panel_number, script_text, asset_url )
    `)
    .eq("issue_id", issue.id)
    .order("chapter_order")

  const col = issue.mnky_collections as { id: string; name?: string; slug?: string } | null

  const chaptersWithPanels: ChapterWithPanels[] = (chapters ?? []).map((c) => {
    const rawPanels = (c as { mnky_panels?: { id: string; panel_number: number; script_text: string | null; asset_url: string | null }[] }).mnky_panels ?? []
    const panels = [...rawPanels].sort((a, b) => a.panel_number - b.panel_number)
    return {
      id: c.id,
      fragrance_name: c.fragrance_name,
      chapter_order: c.chapter_order,
      panels,
    }
  })

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/verse-backoffice/manga" className="text-primary text-sm underline">
          ← Issues
        </Link>
        <h1 className="text-2xl font-semibold">{issue.title}</h1>
        <Badge variant={issue.status === "published" ? "default" : "secondary"}>
          {issue.status}
        </Badge>
        <MangaPublishShopifyButton issueSlug={slug} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <MangaCoverUpload issueId={issue.id} currentCoverUrl={issue.cover_asset_url} />
        <MangaIssueEditForm
          issueId={issue.id}
          initialTitle={issue.title}
          initialSlug={issue.slug}
          initialStatus={issue.status === "published" ? "published" : "draft"}
          initialArcSummary={issue.arc_summary}
          initialPublishedAt={issue.published_at}
          collectionName={col?.name}
          issueNumber={issue.issue_number}
          hasNotionId={!!issue.notion_id}
        />
      </div>

      <MangaChaptersPanels chaptersWithPanels={chaptersWithPanels} />
    </div>
  )
}
