export default function MainLoading() {
  return (
    <div className="main-container flex min-h-[50vh] items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden />
      <span className="sr-only">Loading…</span>
    </div>
  )
}
