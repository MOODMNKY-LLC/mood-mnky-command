import { NotionSyncPanel } from "@/components/notion/notion-sync-panel"

export default function NotionPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
          Notion Sync
        </h1>
        <p className="text-sm text-muted-foreground">
          Sync fragrance oils and collections from the MNKY_MIND
          Notion workspace
        </p>
      </div>
      <NotionSyncPanel />
    </div>
  )
}
