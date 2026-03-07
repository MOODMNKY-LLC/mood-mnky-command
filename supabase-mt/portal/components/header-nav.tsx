"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, Settings, User } from "lucide-react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { SemanticSearchBar } from "@/components/semantic-search-bar";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

function getInitials(name: string | null | undefined, email: string | undefined): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "?";
}

export function HeaderNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: { full_name?: string } } | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: u } }) => setUser(u ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.id || !isSupabaseConfigured()) {
      setIsPlatformAdmin(false);
      return;
    }
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("platform_role")
      .eq("id", user.id)
      .single()
      .then(
        ({ data }) => setIsPlatformAdmin(data?.platform_role === "platform_admin"),
        () => setIsPlatformAdmin(false)
      );
  }, [user?.id]);

  const handleSignOut = async () => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full main-glass-nav">
      <div className="main-container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold shrink-0">
          MOOD MNKY Portal
        </Link>
        <div className="flex flex-1 items-center justify-center px-4 max-w-md gap-2">
          <SemanticSearchBar />
          <AnimatedThemeToggler
            className="h-6 w-6 shrink-0 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent [&_svg]:size-3.5"
            aria-label="Toggle theme"
          />
        </div>
        <nav className="flex items-center gap-4 shrink-0">
          {user && (
            <>
              <Link
                href="/dashboard"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === "/dashboard" ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <LayoutDashboard className="mr-1 inline h-4 w-4" />
                Dashboard
              </Link>
              {isPlatformAdmin && (
                <Link
                  href="/admin"
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === "/admin" ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  <Settings className="mr-1 inline h-4 w-4" />
                  Admin
                </Link>
              )}
            </>
          )}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={(user.user_metadata as { avatar_url?: string })?.avatar_url} alt={user.email} />
                    <AvatarFallback>
                      {getInitials(user.user_metadata?.full_name, user.email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.user_metadata?.full_name || "User"}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/auth/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/sign-up">Get started</Link>
              </Button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
