import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookMarked, Plus } from "lucide-react"
import { MangaSyncNotionButton } from "@/components/verse-backoffice/manga-sync-notion-button"
import { MangaPublishShopifyButton } from "@/components/verse-backoffice/manga-publish-shopify-button"

export const dynamic = "force-dynamic"

export default async function MangaIssuesPage() {
  const supabase = await createClient()
  const { data: issues, error } = await supabase
    .from("mnky_issues")
    .select(`
      id, slug, title, issue_number, status, published_at, created_at,
      mnky_collections ( name, slug )
    `)
    .order("issue_number", { ascending: false })

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Manga / Issues</h1>
        <div className="flex gap-2">
          <MangaSyncNotionButton />
          <MangaPublishShopifyButton />
          <Button asChild size="sm">
            <Link href="/verse-backoffice/manga/new">
              <Plus className="mr-2 h-4 w-4" />
              New issue
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookMarked className="h-5 w-5" />
            Issues
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="text-destructive text-sm">Failed to load: {error.message}</p>
          )}
          {!error && (!issues || issues.length === 0) && (
            <p className="text-muted-foreground text-sm">No issues yet. Create one or sync from Notion.</p>
          )}
          {!error && issues && issues.length > 0 && (
            <ul className="divide-y">
              {issues.map((issue) => (
                <li key={issue.id} className="flex items-center justify-between py-3 first:pt-0">
                  <div>
                    <Link
                      href={`/verse-backoffice/manga/${issue.slug}`}
                      className="font-medium hover:underline"
                    >
                      {issue.title}
                    </Link>
                    <p className="text-muted-foreground text-sm">
                      {(issue.mnky_collections as { name?: string } | null)?.name ?? "—"} · Issue #{issue.issue_number}
                    </p>
                  </div>
                  <Badge variant={issue.status === "published" ? "default" : "secondary"}>
                    {issue.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
