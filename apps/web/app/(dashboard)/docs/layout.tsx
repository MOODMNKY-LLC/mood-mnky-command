import Link from "next/link"
import { getDocSlugs, getDocBySlug, slugToTitle } from "@/lib/docs"
import { DocsNav } from "@/components/docs/docs-nav"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DocsNavClient } from "@/components/docs/docs-nav-client"

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const adminSlugs = getDocSlugs("admin")
  const guideSlugs = getDocSlugs("guide")

  const adminItems = adminSlugs.map((slug) => {
    const doc = getDocBySlug(slug, "admin")
    return {
      slug,
      title: doc?.meta?.title ?? slugToTitle(slug),
      href: `/docs/admin/${slug}`,
    }
  })

  const guideItems = guideSlugs.map((slug) => {
    const doc = getDocBySlug(slug, "guide")
    return {
      slug,
      title: doc?.meta?.title ?? slugToTitle(slug),
      href: `/docs/guide/${slug}`,
    }
  })

  return (
    <div className="flex h-full flex-1">
      <aside className="hidden w-56 shrink-0 border-r border-border md:block">
        <div className="sticky top-0 h-[calc(100vh-3.5rem)] py-4">
          <div className="px-3 pb-2">
            <Link
              href="/docs"
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Docs
            </Link>
          </div>
          <ScrollArea className="h-[calc(100vh-6rem)]">
            <div className="px-2">
              <DocsNavClient adminItems={adminItems} guideItems={guideItems} />
            </div>
          </ScrollArea>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
