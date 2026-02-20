import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

export default async function VerseIssuesPage() {
  const supabase = await createClient()
  const { data: issues } = await supabase
    .from("mnky_issues")
    .select(`
      id, slug, title, issue_number, status, cover_asset_url, arc_summary,
      mnky_collections ( name, slug )
    `)
    .eq("status", "published")
    .order("issue_number", { ascending: false })

  return (
    <div className="verse-container mx-auto max-w-[var(--verse-page-width)] space-y-8 px-4 py-8 md:px-6">
      <h1 className="text-2xl font-semibold md:text-3xl">Manga issues</h1>
      {(!issues || issues.length === 0) && (
        <p className="text-muted-foreground">No published issues yet.</p>
      )}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {issues?.map((issue) => (
          <Link key={issue.id} href={`/verse/issues/${issue.slug}`}>
            <Card className="overflow-hidden transition-shadow hover:shadow-md">
              {issue.cover_asset_url && (
                <div className="aspect-[3/4] relative bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={issue.cover_asset_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  {(issue.mnky_collections as { name?: string } | null)?.name ?? "Issue"} #{issue.issue_number}
                </CardTitle>
                <p className="text-muted-foreground text-sm font-normal">{issue.title}</p>
              </CardHeader>
              <CardContent>
                {issue.arc_summary && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">{issue.arc_summary}</p>
                )}
                <Badge variant="secondary" className="mt-2">Read</Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
