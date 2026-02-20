"use client"

import React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface LoginFormProps {
  variant?: "default" | "light"
  /** Redirect path after successful sign-in. Default "/" (LABZ). Use "/verse" for Verse tab. */
  redirectTo?: string
  /** Called after successful sign-in, before redirect. Use to close dialogs. */
  onSuccess?: () => void
}

export function LoginForm({ variant = "default", redirectTo = "/", onSuccess }: LoginFormProps) {
  const isLight = variant === "light"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      onSuccess?.()
      router.push(redirectTo)
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred"
      const cause = err instanceof Error && "cause" in err ? (err.cause as Error) : null
      const isFetchError =
        (typeof message === "string" && (message.includes("fetch") || message.includes("Fetch"))) ||
        (cause?.message?.includes("self-signed") ?? false) ||
        (cause as { code?: string })?.code === "DEPTH_ZERO_SELF_SIGNED_CERT"

      if (isFetchError) {
        setError(
          "Self-signed certificate. Run: pnpm supabase:tls-setup, then supabase stop && supabase start. Or visit https://127.0.0.1:54321 and accept the certificate."
        )
      } else {
        setError(message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-4">
      <div className="grid gap-1.5">
        <Label
          htmlFor="email"
          className={cn(
            "text-xs font-medium",
            isLight ? "text-gray-700" : "text-muted-foreground"
          )}
        >
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="you@moodmnky.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={cn(
            isLight
              ? "border-gray-200 bg-white text-gray-900 placeholder:text-gray-500 focus-visible:ring-gray-400"
              : "bg-secondary border-border"
          )}
          autoComplete="email"
        />
      </div>
      <div className="grid gap-1.5">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="password"
            className={cn(
              "text-xs font-medium",
              isLight ? "text-gray-700" : "text-muted-foreground"
            )}
          >
            Password
          </Label>
          <Link
            href="/auth/forgot-password"
            className={cn(
              "text-xs transition-colors",
              isLight
                ? "text-gray-600 hover:text-gray-900"
                : "text-muted-foreground hover:text-primary"
            )}
          >
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={cn(
            isLight
              ? "border-gray-200 bg-white text-gray-900 placeholder:text-gray-500 focus-visible:ring-gray-400"
              : "bg-secondary border-border"
          )}
          autoComplete="current-password"
        />
      </div>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
      <Button
        type="submit"
        className={cn(
          "w-full",
          isLight && "bg-gray-900 text-white hover:bg-gray-800 focus-visible:ring-gray-600"
        )}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign in"
        )}
      </Button>
      <div
        className={cn(
          "text-center text-xs",
          isLight ? "text-gray-600" : "text-muted-foreground"
        )}
      >
        {"Don't have an account? "}
        <Link
          href="/auth/sign-up"
          className={cn(
            "transition-colors hover:underline",
            isLight ? "text-gray-900 hover:text-gray-700" : "text-primary"
          )}
        >
          Sign up
        </Link>
      </div>
    </form>
  )
}
