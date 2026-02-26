"use client";

/**
 * Verse (MNKY DOJO storefront) header. Nav: Home (/main), Discover (Explore, Blog, Agents), Shop, Rewards, Dashboard (/dojo/me).
 * Dojo entry points: brand "MNKY DOJO" and "Dashboard" link → /dojo/me. Main site "Enter the Dojo" → /verse (storefront).
 */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { FlaskConical, User, LogOut, Home, BookOpen, Bot, Swords, Gift, ChevronDown } from "lucide-react";
import { VerseHeaderCartLink } from "./verse-header-cart-link";
import { VerseHeaderShopifyLink } from "./verse-header-shopify-link";
import { VerseHeaderXp } from "./verse-header-xp";
import { ShopAuthDialog } from "./shop-auth-dialog";
import { AppInfoDialog } from "@/components/app-info-dialog";
import { createClient } from "@/lib/supabase/client";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { ThemePaletteSwitcher } from "@/components/theme-palette-switcher";
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
  shopifyLinked = false,
}: {
  isAdmin?: boolean;
  user?: VerseUser;
  shopifyLinked?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [shopAuthOpen, setShopAuthOpen] = useState(false);

  const shopifyError = searchParams.get("error");

  useEffect(() => {
    if (shopifyError) setShopAuthOpen(true);
  }, [shopifyError]);

  const handleShopAuthOpenChange = useCallback(
    (open: boolean) => {
      setShopAuthOpen(open);
      if (!open && shopifyError && typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("error");
        router.replace(url.pathname + url.search, { scroll: false });
      }
    },
    [router, shopifyError]
  );

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Clear Shopify session cookie and optionally redirect to Shopify logout
    window.location.href = "/api/customer-account-api/logout";
  };

  return (
    <header className="sticky top-0 z-50 verse-header glass-panel pt-[env(safe-area-inset-top)]">
      <div className="mx-auto grid h-16 max-w-[var(--verse-page-width,1600px)] grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 md:gap-4 md:px-6">
        {/* Left: Brand + Logo */}
        <div className="flex min-w-0 shrink items-center gap-2 md:gap-3">
          <Link
            href="/main"
            className="text-sm font-medium text-verse-text-muted transition-colors hover:text-verse-text"
            title="MOOD MNKY home"
          >
            MOOD MNKY
          </Link>
          <Link
            href="/dojo/me"
            className="font-verse-heading text-xl font-semibold tracking-tight text-verse-text"
          >
            MNKY DOJO
          </Link>
        </div>
        {/* Center: Nav links (Lab, Home, Explore, Blog, Agents, Shop, Cart) - scroll on narrow */}
        <nav className="flex min-w-0 shrink items-center justify-center gap-1 overflow-x-auto overflow-y-hidden md:gap-6" style={{ WebkitOverflowScrolling: "touch" }}>
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
            href="/main"
            className="hidden min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 text-sm font-medium text-verse-text transition-colors hover:opacity-90 sm:flex"
            title="MOOD MNKY home"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <VerseButton
                variant="ghost"
                size="sm"
                className="min-h-[44px] min-w-[44px] gap-1 font-medium text-verse-text hover:opacity-90"
                aria-label="Discover menu"
              >
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Discover</span>
                <ChevronDown className="h-4 w-4" />
              </VerseButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="verse-dropdown min-w-[10rem]">
              <DropdownMenuItem asChild>
                <Link href="/dojo/explore" className="flex items-center gap-2">
                  Explore
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dojo/blog" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Blog
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dojo/agents" className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  Agents
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {user && shopifyLinked ? (
            <Link
              href="/dojo/products"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center text-sm font-medium text-verse-text transition-colors hover:opacity-90"
            >
              Shop
            </Link>
          ) : (
            <VerseButton
              variant="ghost"
              size="sm"
              className="min-h-[44px] min-w-[44px] font-medium text-verse-text hover:opacity-90"
              onClick={() => setShopAuthOpen(true)}
            >
              Shop
            </VerseButton>
          )}
          {user && (
            <>
              <div className="h-4 w-px border-l border-[var(--verse-border)]" aria-hidden />
              <Link
                href="/dojo/rewards"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 text-sm font-medium text-verse-text transition-colors hover:opacity-90"
                title="MNKY Rewards"
              >
                <Gift className="h-4 w-4" />
                <span className="hidden sm:inline">Rewards</span>
              </Link>
              <Link
                href="/dojo/me"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 text-sm font-medium text-verse-text transition-colors hover:opacity-90"
                title="Dashboard"
              >
                <Swords className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            </>
          )}
          <div className="h-4 w-px border-l border-[var(--verse-border)]" aria-hidden />
          <VerseHeaderCartLink />
        </nav>
        {/* Right: XP, User account, Link Shopify, Theme, Info */}
        <div className="flex items-center justify-end gap-2">
          {user && <VerseHeaderXp />}
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
                  <Link href="/dojo/me/profile" className="flex items-center gap-2">
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
          {user && (
            <VerseHeaderShopifyLink userId={user.id} />
          )}
          <ThemePaletteSwitcher
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-[var(--verse-text)] hover:opacity-80"
          />
          <AnimatedThemeToggler
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-verse-text hover:bg-verse-bg-hover hover:text-verse-text"
            aria-label="Toggle theme"
          />
          <AppInfoDialog variant="verse" />
        </div>
      </div>
      <ShopAuthDialog
        open={shopAuthOpen}
        onOpenChange={handleShopAuthOpenChange}
        user={user}
        shopifyLinked={shopifyLinked}
        shopifyError={shopifyError}
        redirectAfterAuth="/dojo/products"
        onContinueAsGuest={() => router.push("/dojo/products")}
      />
    </header>
  );
}
