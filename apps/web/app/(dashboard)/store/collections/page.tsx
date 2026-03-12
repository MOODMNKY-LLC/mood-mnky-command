"use client"

import useSWR from "swr"
import { FolderOpen, Loader2, ExternalLink, Sparkles, Layers } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function StoreCollectionsPage() {
  const { data, isLoading, error, mutate } = useSWR("/api/shopify/collections", fetcher, {
    revalidateOnFocus: false,
  })

  const collections = data?.collections || []

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
            Collections
          </h1>
          <p className="text-sm text-muted-foreground">
            {collections.length} collections in your store
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => mutate()} className="bg-transparent">
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      ) : error ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-6 text-sm text-destructive">
            Failed to load collections.
          </CardContent>
        </Card>
      ) : collections.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <FolderOpen className="h-8 w-8" />
            <p className="text-sm">No collections found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {collections.map(
            (collection: {
              id: number
              title: string
              handle: string
              body_html: string
              collection_type: string
              published_at: string | null
              sort_order: string
              updated_at: string
            }) => (
              <Card key={collection.id} className="bg-card border-border hover:border-primary/30 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-medium text-foreground line-clamp-1">
                      {collection.title}
                    </CardTitle>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge
                        variant="secondary"
                        className="text-[10px] flex items-center gap-1"
                      >
                        {collection.collection_type === "smart" ? (
                          <>
                            <Sparkles className="h-2.5 w-2.5" /> Smart
                          </>
                        ) : (
                          <>
                            <Layers className="h-2.5 w-2.5" /> Custom
                          </>
                        )}
                      </Badge>
                      {collection.published_at && (
                        <Badge className="text-[10px] border-0 bg-success/10 text-success">
                          Published
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {collection.body_html ? (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {collection.body_html.replace(/<[^>]*>/g, "").slice(0, 120)}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mb-3 italic">No description</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-mono">
                      /{collection.handle}
                    </span>
                    <a
                      href={`https://${process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || ""}/admin/collections/${collection.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      Edit <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}
    </div>
  )
}
