"use client"

import React from "react"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/confirm?next=/auth/update-password`,
      })
      if (error) throw error
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
          <CheckCircle2 className="h-6 w-6 text-success" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-foreground">Check your email</p>
          <p className="text-xs text-muted-foreground">
            {"We've sent a password reset link to"} <strong>{email}</strong>
          </p>
        </div>
        <Link href="/auth/login" className="text-xs text-primary hover:underline">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleReset} className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">
        {"Enter your email and we'll send you a link to reset your password."}
      </p>
      <div className="grid gap-1.5">
        <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@moodmnky.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-secondary border-border"
          autoComplete="email"
        />
      </div>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending...
          </>
        ) : (
          "Send reset link"
        )}
      </Button>
      <Link
        href="/auth/login"
        className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to sign in
      </Link>
    </form>
  )
}
