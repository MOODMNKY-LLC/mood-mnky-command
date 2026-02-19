import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = "force-dynamic"

export default async function VerseIssueSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: issue, error } = await supabase
    .from("mnky_issues")
    .select(`
      id, slug, title, issue_number, status, arc_summary, cover_asset_url,
      mnky_collections ( name, slug )
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (error || !issue) notFound()

  const { data: chapters } = await supabase
    .from("mnky_chapters")
    .select("id, fragrance_name, chapter_order")
    .eq("issue_id", issue.id)
    .order("chapter_order")

  return (
    <div className="verse-container mx-auto max-w-[var(--verse-page-width)] space-y-8 px-4 py-8 md:px-6">
      <Link href="/verse/issues" className="text-primary text-sm underline">
        ← All issues
      </Link>

      <Card className="overflow-hidden">
        {issue.cover_asset_url && (
          <div className="aspect-[3/4] max-h-[50vh] relative bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={issue.cover_asset_url}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <CardHeader>
          <CardTitle className="text-2xl">{issue.title}</CardTitle>
          <p className="text-muted-foreground">
            {(issue.mnky_collections as { name?: string } | null)?.name ?? "Issue"} · #{issue.issue_number}
          </p>
          {issue.arc_summary && (
            <p className="pt-2 text-sm">{issue.arc_summary}</p>
          )}
        </CardHeader>
        <CardContent>
          <h2 className="mb-4 font-semibold">Chapters</h2>
          <ul className="space-y-2">
            {chapters?.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/verse/issues/${slug}/chapters/${c.chapter_order}`}
                  className="block rounded-md border p-3 transition-colors hover:bg-muted/50"
                >
                  Chapter {c.chapter_order}: {c.fragrance_name}
                </Link>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
