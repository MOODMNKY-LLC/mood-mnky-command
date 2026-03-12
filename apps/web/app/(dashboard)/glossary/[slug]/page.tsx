"use client"

import { use } from "react"
import useSWR from "swr"
import Link from "next/link"
import { ArrowLeft, Loader2, Droplets } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function GlossaryNotePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const { data, error, isLoading } = useSWR<{
    note: {
      id: string
      name: string
      slug: string
      descriptionShort: string
      olfactiveProfile: string
      facts: string
    }
    fragranceOils: Array<{
      id: string
      name: string
      family: string
      topNotes: string[]
      middleNotes: string[]
      baseNotes: string[]
    }>
  }>(`/api/fragrance-notes/${slug}`, fetcher, {
    revalidateOnFocus: false,
  })

  if (error || (!isLoading && !data?.note)) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Button variant="ghost" size="sm" className="w-fit gap-1.5" asChild>
          <Link href="/glossary">
            <ArrowLeft className="h-4 w-4" />
            Back to Glossary
          </Link>
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Note not found. It may not exist in the glossary yet.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const note = data?.note
  const fragranceOils = data?.fragranceOils ?? []

  return (
    <div className="flex flex-col gap-6 p-6">
      <Button variant="ghost" size="sm" className="w-fit gap-1.5" asChild>
        <Link href="/glossary">
          <ArrowLeft className="h-4 w-4" />
          Back to Glossary
        </Link>
      </Button>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : note ? (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {note.name}
            </h1>
            {note.descriptionShort && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {note.descriptionShort
                  .split(",")
                  .map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs font-normal"
                    >
                      {tag.trim()}
                    </Badge>
                  ))}
              </div>
            )}
          </div>

          {note.olfactiveProfile && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  Olfactive Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-foreground">
                  {note.olfactiveProfile}
                </p>
              </CardContent>
            </Card>
          )}

          {note.facts && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Facts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {note.facts}
                </p>
              </CardContent>
            </Card>
          )}

          {fragranceOils.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  Fragrances with this note
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {fragranceOils.map((oil) => (
                    <Link
                      key={oil.id}
                      href={`/fragrances?oil=${encodeURIComponent(oil.id)}`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary/50 px-2.5 py-1.5 text-sm text-foreground hover:bg-secondary transition-colors"
                    >
                      <Droplets className="h-3.5 w-3.5 text-primary" />
                      {oil.name}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  )
}
