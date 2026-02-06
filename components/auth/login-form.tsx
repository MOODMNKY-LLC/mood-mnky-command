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

export function LoginForm() {
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
      router.push("/")
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleLogin} className="flex flex-col gap-4">
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
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">
            Password
          </Label>
          <Link
            href="/auth/forgot-password"
            className="text-xs text-muted-foreground hover:text-primary transition-colors"
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
          className="bg-secondary border-border"
          autoComplete="current-password"
        />
      </div>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign in"
        )}
      </Button>
      <div className="text-center text-xs text-muted-foreground">
        {"Don't have an account? "}
        <Link href="/auth/sign-up" className="text-primary hover:underline">
          Sign up
        </Link>
      </div>
    </form>
  )
}
