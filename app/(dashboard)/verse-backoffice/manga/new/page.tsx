import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

export default function MangaNewPage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">New issue</h1>
      <Alert>
        <AlertDescription>
          Create issues via Notion (MNKY_Issues, MNKY_Chapters, MNKY_Panels) and sync to Supabase, or insert directly into <code className="rounded bg-muted px-1">mnky_issues</code> / <code className="rounded bg-muted px-1">mnky_collections</code>. A full create form can be added here later.
        </AlertDescription>
      </Alert>
      <Card>
        <CardHeader>
          <CardTitle>Collections</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Ensure a collection exists (e.g. World Traveler Series) in <code className="rounded bg-muted px-1">mnky_collections</code>, then add an issue linked to it.
          </p>
          <Link href="/verse-backoffice/manga" className="text-primary text-sm underline mt-2 inline-block">
            ← Back to issues
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
