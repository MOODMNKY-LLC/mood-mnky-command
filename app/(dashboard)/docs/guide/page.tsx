import Link from "next/link"
import { getDocSlugs, getDocBySlug, slugToTitle } from "@/lib/docs"
import { cn } from "@/lib/utils"

export default function GuideDocsPage() {
  const slugs = getDocSlugs("guide")
  const items = slugs.map((slug) => {
    const doc = getDocBySlug(slug, "guide")
    return {
      slug,
      title: doc?.meta?.title ?? slugToTitle(slug),
      description: doc?.meta?.description as string | undefined,
    }
  })

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-2 text-3xl font-semibold tracking-tight">
        App Guide
      </h1>
      <p className="mb-8 text-muted-foreground">
        How to use MOOD MNKY Lab – step-by-step guides for every feature.
      </p>
      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item.slug}>
            <Link
              href={`/docs/guide/${item.slug}`}
              className={cn(
                "block rounded-lg border border-border p-4 transition-colors",
                "hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <h2 className="font-medium">{item.title}</h2>
              {item.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.description}
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
