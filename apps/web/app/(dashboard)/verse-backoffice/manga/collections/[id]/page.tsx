import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import { MangaCollectionEditForm } from "@/components/verse-backoffice/manga-collection-edit-form"

export const dynamic = "force-dynamic"

export default async function MangaCollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: collection, error } = await supabase
    .from("mnky_collections")
    .select("id, name, slug, notion_id")
    .eq("id", id)
    .single()

  if (error || !collection) notFound()

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Link href="/verse-backoffice/manga/collections" className="text-primary text-sm underline">
          ← Collections
        </Link>
        <h1 className="text-2xl font-semibold">{collection.name}</h1>
      </div>

      <MangaCollectionEditForm
        collectionId={collection.id}
        initialName={collection.name}
        initialSlug={collection.slug ?? ""}
        hasNotionId={!!collection.notion_id}
      />
    </div>
  )
}
