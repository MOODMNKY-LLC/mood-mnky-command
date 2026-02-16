"use client";

import Link from "next/link";
import { ShoppingCart, FlaskConical, Sun, Moon, User, LogOut, Home, MessageCircle, BookOpen } from "lucide-react";
import { useCart } from "@shopify/hydrogen-react";
import { useRouter } from "next/navigation";
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
  const { totalQuantity } = useCart();
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
      <div className="mx-auto flex h-16 max-w-[var(--verse-page-width,1600px)] items-center justify-between gap-4 px-4 md:px-6">
        <Link
          href="/verse"
          className="font-verse-heading text-xl font-semibold tracking-tight text-verse-text"
        >
          MNKY VERSE
        </Link>
        <nav className="flex items-center gap-6">
          {isAdmin && (
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm font-medium text-verse-text transition-colors hover:opacity-90"
              title="MOOD MNKY LABZ"
            >
              <FlaskConical className="h-4 w-4" />
              Lab
            </Link>
          )}
          <Link
            href="/verse"
            className="hidden items-center gap-1.5 text-sm font-medium text-verse-text transition-colors hover:opacity-90 sm:flex"
          >
            <Home className="h-4 w-4" />
            Home
          </Link>
          <Link
            href="/verse/explore"
            className="text-sm font-medium text-verse-text transition-colors hover:opacity-90"
          >
            Explore
          </Link>
          <Link
            href="/verse/blog"
            className="hidden items-center gap-1 text-sm font-medium text-verse-text transition-colors hover:opacity-90 sm:flex"
          >
            <BookOpen className="h-4 w-4" />
            Blog
          </Link>
          <Link
            href="/verse/products"
            className="text-sm font-medium text-verse-text transition-colors hover:opacity-90"
          >
            Shop
          </Link>
          <Link
            href="/verse/chat"
            className="hidden items-center gap-1 text-sm font-medium text-verse-text transition-colors hover:opacity-90 sm:flex"
          >
            <MessageCircle className="h-4 w-4" />
            Chat
          </Link>
          <Link
            href="/verse/cart"
            className="relative flex items-center gap-1 text-sm font-medium text-verse-text transition-colors hover:opacity-90"
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="hidden sm:inline">Cart</span>
            {totalQuantity != null && totalQuantity > 0 && (
              <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-verse-button px-1 text-xs font-medium text-verse-button-text">
                {totalQuantity}
              </span>
            )}
          </Link>
          <VerseButton
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9"
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
                <VerseButton variant="ghost" size="sm" className="gap-2">
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
            <VerseButton variant="outline" size="sm" asChild>
              <Link href="/auth/login">Sign in</Link>
            </VerseButton>
          )}
        </nav>
      </div>
    </header>
  );
}
