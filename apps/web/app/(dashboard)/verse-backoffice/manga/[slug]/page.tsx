import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { MangaPublishShopifyButton } from "@/components/verse-backoffice/manga-publish-shopify-button"

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
      id, slug, title, issue_number, status, arc_summary, cover_asset_url, published_at,
      mnky_collections ( id, name, slug )
    `)
    .eq("slug", slug)
    .single()

  if (error || !issue) notFound()

  const { data: chapters } = await supabase
    .from("mnky_chapters")
    .select("id, fragrance_name, chapter_order, shopify_product_gid")
    .eq("issue_id", issue.id)
    .order("chapter_order")

  const col = issue.mnky_collections as { id: string; name?: string; slug?: string } | null

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

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Collection: {col?.name ?? "—"}</p>
          <p>Issue # {issue.issue_number}</p>
          {issue.arc_summary && <p>{issue.arc_summary}</p>}
          {issue.published_at && (
            <p className="text-muted-foreground">Published {new Date(issue.published_at).toLocaleDateString()}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chapters</CardTitle>
        </CardHeader>
        <CardContent>
          {(!chapters || chapters.length === 0) && (
            <p className="text-muted-foreground text-sm">No chapters. Add in Notion and sync, or insert into mnky_chapters.</p>
          )}
          {chapters && chapters.length > 0 && (
            <ul className="divide-y">
              {chapters.map((c) => (
                <li key={c.id} className="py-2 first:pt-0">
                  #{c.chapter_order} {c.fragrance_name}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
