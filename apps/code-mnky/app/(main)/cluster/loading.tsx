export default function ClusterLoading() {
  return (
    <div className="main-container w-full flex-1 py-12 md:py-16">
      <div className="animate-pulse space-y-8">
        <div className="h-9 w-72 rounded-md bg-muted" />
        <div className="h-4 w-96 max-w-full rounded bg-muted" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="main-glass-panel-card h-28 rounded-lg border border-border/50 bg-muted/30" />
          ))}
        </div>
        <div>
          <div className="mb-4 h-6 w-24 rounded bg-muted" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="main-glass-panel-card h-32 rounded-lg border border-border/50 bg-muted/30" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
