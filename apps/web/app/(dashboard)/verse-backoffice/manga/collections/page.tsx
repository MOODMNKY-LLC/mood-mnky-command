import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function MangaCollectionsPage() {
  const supabase = await createClient()
  const { data: collections, error } = await supabase
    .from("mnky_collections")
    .select("id, name, slug")
    .order("name")

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/verse-backoffice/manga" className="text-primary text-sm underline">
          ← Manga / Issues
        </Link>
        <h1 className="text-2xl font-semibold">Manga Collections</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Collections</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="text-destructive text-sm">Failed to load: {error.message}</p>}
          {!error && (!collections || collections.length === 0) && (
            <p className="text-muted-foreground text-sm">No collections yet. Sync from Notion or add via Supabase.</p>
          )}
          {!error && collections && collections.length > 0 && (
            <ul className="divide-y">
              {collections.map((c) => (
                <li key={c.id} className="py-3 first:pt-0">
                  <Link href={`/verse-backoffice/manga/collections/${c.id}`} className="font-medium hover:underline">
                    {c.name}
                  </Link>
                  <p className="text-muted-foreground text-sm">{c.slug}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
