"use client";

import Link from "next/link";
import { FlaskConical, Sun, Moon, User, LogOut, Home, BookOpen, Bot, Swords } from "lucide-react";
import { useRouter } from "next/navigation";
import { VerseHeaderCartLink } from "./verse-header-cart-link";
import { createClient } from "@/lib/supabase/client";
import { useVerseTheme } from "./verse-theme-provider";
import { VerseButton } from "@/components/verse/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { VerseUser } from "./verse-storefront-shell";

export function VerseHeader({
  isAdmin = false,
  user = null,
}: {
  isAdmin?: boolean;
  user?: VerseUser;
}) {
  const router = useRouter();
  const { theme, toggleTheme } = useVerseTheme();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    if (user?.id?.startsWith("gid://")) {
      // Redirect to logout API: clears cookie and redirects to Shopify SSO logout, then /verse
      window.location.href = "/api/customer-account-api/logout";
      return;
    }
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 verse-header glass-panel">
      <div className="mx-auto grid h-16 max-w-[var(--verse-page-width,1600px)] grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 md:px-6">
        {/* Left: Logo */}
        <Link
          href="/verse"
          className="font-verse-heading text-xl font-semibold tracking-tight text-verse-text"
        >
          MNKY VERSE
        </Link>
        {/* Center: Nav links (Lab, Home, Explore, Blog, Agents, Shop, Cart) */}
        <nav className="flex min-w-0 shrink items-center justify-center gap-2 md:gap-6">
          {isAdmin && (
            <>
              <Link
                href="/"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 text-sm font-medium text-verse-text transition-colors hover:opacity-90"
                title="MOOD MNKY LABZ"
              >
                <FlaskConical className="h-4 w-4" />
                <span className="hidden sm:inline">Lab</span>
              </Link>
              <div className="h-4 w-px border-l border-[var(--verse-border)]" aria-hidden />
            </>
          )}
          <Link
            href="/verse"
            className="hidden min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 text-sm font-medium text-verse-text transition-colors hover:opacity-90 sm:flex"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
          <Link
            href="/verse/explore"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center text-sm font-medium text-verse-text transition-colors hover:opacity-90"
          >
            Explore
          </Link>
          <Link
            href="/verse/blog"
            className="hidden min-h-[44px] min-w-[44px] items-center justify-center gap-1 text-sm font-medium text-verse-text transition-colors hover:opacity-90 sm:flex"
          >
            <BookOpen className="h-4 w-4" />
            Blog
          </Link>
          <Link
            href="/verse/agents"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 text-sm font-medium text-verse-text transition-colors hover:opacity-90"
          >
            <Bot className="h-4 w-4" />
            Agents
          </Link>
          <Link
            href="/verse/products"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center text-sm font-medium text-verse-text transition-colors hover:opacity-90"
          >
            Shop
          </Link>
          {user && (
            <>
              <div className="h-4 w-px border-l border-[var(--verse-border)]" aria-hidden />
              <Link
                href="/dojo"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 text-sm font-medium text-verse-text transition-colors hover:opacity-90"
                title="Your Dojo"
              >
                <Swords className="h-4 w-4" />
                <span className="hidden sm:inline">Dojo</span>
              </Link>
            </>
          )}
          <div className="h-4 w-px border-l border-[var(--verse-border)]" aria-hidden />
          <VerseHeaderCartLink />
        </nav>
        {/* Right: Theme + Auth */}
        <div className="flex items-center justify-end gap-2">
          <VerseButton
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-11 w-11 min-h-[44px] min-w-[44px]"
            title={theme === "light" ? "Switch to dark" : "Switch to light"}
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </VerseButton>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <VerseButton variant="ghost" size="sm" className="min-h-[44px] gap-2 px-3">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {user.displayName || user.email?.split("@")[0] || "Account"}
                  </span>
                </VerseButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="verse-dropdown">
                <DropdownMenuItem asChild>
                  <Link href="/verse/profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                {!user.id.startsWith("gid://") && (
                  <DropdownMenuItem asChild>
                    <Link href="/auth/update-password">Account</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleSignOut} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <VerseButton variant="outline" size="sm" className="min-h-[44px]" asChild>
              <Link href="/auth/login">Sign in</Link>
            </VerseButton>
          )}
        </div>
      </div>
    </header>
  );
}
