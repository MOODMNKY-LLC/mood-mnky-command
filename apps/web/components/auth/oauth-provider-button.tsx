"use client"

import React, { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

export type OAuthProvider = "discord" | "github"

export interface OAuthProviderButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  provider: OAuthProvider
  /** Callback path or full URL (e.g. /verse/auth/callback?next=/verse). Built with origin on client. */
  redirectTo: string
  children: React.ReactNode
}

/**
 * Initiates OAuth in the browser so Supabase can set the flow-state cookie.
 * Prevents "OAuth state parameter missing" in local dev when using server-side
 * redirect (browser never hits Supabase and never gets the cookie).
 */
export function OAuthProviderButton({
  provider,
  redirectTo,
  children,
  className,
  disabled,
  ...rest
}: OAuthProviderButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (isLoading || disabled) return
    setIsLoading(true)
    setError(null)
    try {
      const fullRedirectTo = redirectTo.startsWith("http")
        ? redirectTo
        : `${window.location.origin}${redirectTo}`
      const supabase = createClient()
      const { data, error: err } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: fullRedirectTo },
      })
      if (err) {
        setError(err.message)
        return
      }
      if (data?.url) {
        window.location.href = data.url
        return
      }
      setError("No redirect URL returned")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isLoading}
        className={cn(className)}
        {...rest}
      >
        {isLoading ? "Redirecting…" : children}
      </button>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
