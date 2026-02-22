"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MainGlassCard } from "./main-glass-card"
import { cn } from "@/lib/utils"

export function MainWaitlistForm({ className }: { className?: string }) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")
    setErrorMessage("")
    try {
      const res = await fetch("/api/main/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "main" }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setStatus("error")
        setErrorMessage((data as { error?: string }).error ?? "Something went wrong.")
        return
      }
      setStatus("success")
      setEmail("")
    } catch {
      setStatus("error")
      setErrorMessage("Network error. Please try again.")
    }
  }

  return (
    <MainGlassCard className={cn("max-w-md", className)}>
      <h3 className="font-semibold text-foreground">Get early access</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Join the waitlist for updates and early access to the MNKY VERSE.
      </p>
      {status === "success" ? (
        <p className="mt-4 text-sm text-green-600 dark:text-green-400">
          You&apos;re on the list. We&apos;ll be in touch.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label htmlFor="waitlist-email" className="sr-only">
              Email
            </Label>
            <Input
              id="waitlist-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={status === "loading"}
              className="h-10"
            />
          </div>
          <Button type="submit" disabled={status === "loading"} className="shrink-0">
            {status === "loading" ? "Joining…" : "Join"}
          </Button>
        </form>
      )}
      {errorMessage && status === "error" && (
        <p className="mt-2 text-sm text-destructive">{errorMessage}</p>
      )}
    </MainGlassCard>
  )
}
