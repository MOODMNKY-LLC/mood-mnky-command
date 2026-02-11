import Link from "next/link"
import { BookOpen, FileCode } from "lucide-react"
import { cn } from "@/lib/utils"

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-2 text-3xl font-semibold tracking-tight">
        Documentation
      </h1>
      <p className="mb-8 text-muted-foreground">
        Guides and references for MOOD MNKY Lab.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/docs/guide"
          className={cn(
            "flex items-start gap-4 rounded-lg border border-border p-6 transition-colors",
            "hover:border-primary/50 hover:bg-muted/50"
          )}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">App Guide</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              How to use the app – Dashboard, Formulas, Product Builder, Studio, and more.
            </p>
          </div>
        </Link>

        <Link
          href="/docs/admin"
          className={cn(
            "flex items-start gap-4 rounded-lg border border-border p-6 transition-colors",
            "hover:border-primary/50 hover:bg-muted/50"
          )}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <FileCode className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Admin Docs</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Technical docs – CDN, APIs, n8n workflows, Supabase, sync.
            </p>
          </div>
        </Link>
      </div>
    </div>
  )
}
