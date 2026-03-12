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

export interface SignUpFormProps {
  /** Redirect path after successful sign-up (or to sign-up-success). */
  redirectTo?: string
  /** Redirect path for email confirmation link. Default uses redirectTo or "/". */
  emailRedirectTo?: string
}

export function SignUpForm({ redirectTo = "/auth/sign-up-success", emailRedirectTo }: SignUpFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [referralCode, setReferralCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    const supabase = createClient()
    const confirmUrl = emailRedirectTo
      ? emailRedirectTo.startsWith("http")
        ? emailRedirectTo
        : `${window.location.origin}${emailRedirectTo}`
      : `${window.location.origin}/auth/confirm?next=${encodeURIComponent(redirectTo.startsWith("/") ? redirectTo : "/")}`
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: confirmUrl,
          data: {
            display_name: displayName || email.split("@")[0],
          },
        },
      })
      if (error) throw error
      const code = referralCode.trim().toUpperCase()
      if (code) {
        try {
          await fetch("/api/referral/record-signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ code }),
          })
        } catch {
          // Non-blocking: referral record failed, still redirect
        }
      }
      router.push(redirectTo.startsWith("/") ? redirectTo : "/auth/sign-up-success")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSignUp} className="flex flex-col gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="display-name" className="text-xs font-medium text-muted-foreground">
          Display name
        </Label>
        <Input
          id="display-name"
          type="text"
          placeholder="Your name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="bg-secondary border-border"
          autoComplete="name"
        />
      </div>
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
      <div className="grid gap-1.5">
        <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-secondary border-border"
          autoComplete="new-password"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="confirm-password" className="text-xs font-medium text-muted-foreground">
          Confirm password
        </Label>
        <Input
          id="confirm-password"
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="bg-secondary border-border"
          autoComplete="new-password"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="referral-code" className="text-xs font-medium text-muted-foreground">
          Referral code <span className="font-normal">(optional)</span>
        </Label>
        <Input
          id="referral-code"
          type="text"
          placeholder="e.g. MNKY-XXXXXX"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
          className="bg-secondary border-border font-mono text-sm uppercase"
          autoComplete="off"
        />
      </div>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create account"
        )}
      </Button>
      <div className="text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </form>
  )
}
