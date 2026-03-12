import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect(params.redirect ?? "/dashboard");
  }

  const redirectTo = params.redirect ?? "/dashboard";
  const fflogsEnabled =
    process.env.NEXT_PUBLIC_FFLOGS_ENABLED === "true" ||
    !!process.env.FFLOGS_CLIENT_ID;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Sign in to access the Hydaelyn dashboard and create stream sessions.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {params.error && (
            <div className="space-y-1 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <p>{params.error}</p>
              {params.error.toLowerCase().includes("invalid") && params.error.toLowerCase().includes("credential") && (
                <p className="text-muted-foreground">
                  Use the correct password or{" "}
                  <Link href="/auth/forgot-password" className="underline hover:text-foreground">
                    reset your password
                  </Link>
                  .
                </p>
              )}
            </div>
          )}
          {params.message && (
            <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-foreground">
              {params.message}
            </p>
          )}

          {/* Email + password (default) */}
          <form
            action="/auth/signin/password"
            method="post"
            className="flex flex-col gap-4"
          >
            <input type="hidden" name="redirect" value={redirectTo} />
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            <Button type="submit">Sign in</Button>
          </form>

          {fflogsEnabled && (
            <div className="flex flex-col gap-2">
              <Button variant="outline" asChild className="w-full">
                <Link href="/auth/fflogs/authorize?intent=signin">
                  Sign in with FFLogs
                </Link>
              </Button>
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          {/* Magic link */}
          <form
            action="/auth/signin/email"
            method="post"
            className="flex flex-col gap-2"
          >
            <input type="hidden" name="redirect" value={redirectTo} />
            <Label htmlFor="magic-email" className="text-muted-foreground text-xs">
              Email magic link (no password)
            </Label>
            <div className="flex gap-2">
              <Input
                id="magic-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="flex-1"
              />
              <Button type="submit" variant="secondary">
                Send link
              </Button>
            </div>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href={`/auth/signup?redirect=${encodeURIComponent(redirectTo)}`}
              className="underline hover:text-foreground"
            >
              Create account
            </Link>
          </p>

          <Button variant="outline" asChild>
            <Link href="/">Back to home</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
