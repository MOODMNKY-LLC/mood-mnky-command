"use client"

import { usePathname } from "next/navigation"
import { DocsNav } from "@/components/docs/docs-nav"

interface DocItem {
  slug: string
  title: string
  href: string
}

interface DocsNavClientProps {
  adminItems: DocItem[]
  guideItems: DocItem[]
}

export function DocsNavClient({ adminItems, guideItems }: DocsNavClientProps) {
  const pathname = usePathname()

  const isAdmin = pathname.startsWith("/docs/admin")
  const isGuide = pathname.startsWith("/docs/guide")

  const items = isAdmin ? adminItems : isGuide ? guideItems : []

  if (items.length === 0) return null

  return (
    <div className="flex flex-col gap-4">
      {isAdmin && (
        <div>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Admin Docs
          </p>
          <DocsNav items={adminItems} />
        </div>
      )}
      {isGuide && (
        <div>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            App Guide
          </p>
          <DocsNav items={guideItems} />
        </div>
      )}
    </div>
  )
}
