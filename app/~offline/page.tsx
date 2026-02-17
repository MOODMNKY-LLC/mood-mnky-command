"use client"

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          You&apos;re offline
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Check your connection and try again.
        </p>
      </div>
      <button
        onClick={handleRetry}
        className="min-h-[44px] min-w-[44px] rounded-md bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:bg-primary/90"
      >
        Try again
      </button>
    </div>
  )
}
