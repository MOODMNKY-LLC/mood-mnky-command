"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { FlaskConical, User, LogOut, Home, BookOpen, Bot, Swords } from "lucide-react";
import { VerseHeaderCartLink } from "./verse-header-cart-link";
import { VerseHeaderShopifyLink } from "./verse-header-shopify-link";
import { ShopAuthDialog } from "./shop-auth-dialog";
import { AppInfoDialog } from "@/components/app-info-dialog";
import { createClient } from "@/lib/supabase/client";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
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
    <header className="sticky top-0 z-50 verse-header glass-panel">
      <div className="mx-auto grid h-16 max-w-[var(--verse-page-width,1600px)] grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 md:px-6">
        {/* Left: Brand + Logo */}
        <div className="flex items-center gap-3">
          <Link
            href="/main"
            className="text-sm font-medium text-verse-text-muted transition-colors hover:text-verse-text"
            title="MOOD MNKY home"
          >
            MOOD MNKY
          </Link>
          <Link
            href="/verse"
            className="font-verse-heading text-xl font-semibold tracking-tight text-verse-text"
          >
            MNKY VERSE
          </Link>
        </div>
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
          {user && shopifyLinked ? (
            <Link
              href="/verse/products"
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
        {/* Right: User account, Link Shopify, Theme, Info */}
        <div className="flex items-center justify-end gap-2">
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
                  <Link href="/dojo/profile" className="flex items-center gap-2">
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
        redirectAfterAuth="/verse/products"
        onContinueAsGuest={() => router.push("/verse/products")}
      />
    </header>
  );
}
