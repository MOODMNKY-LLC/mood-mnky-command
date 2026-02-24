"use client";

import React from "react";
import Link from "next/link";
import { SiDiscord } from "react-icons/si";
import { Store } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { OAuthProviderButton } from "@/components/auth/oauth-provider-button";
import { VerseButton } from "@/components/verse/ui/button";
import { useVerseTheme } from "./verse-theme-provider";
import { cn } from "@/lib/utils";

const SHOPIFY_ERROR_MESSAGES: Record<string, string> = {
  shopify_auth_failed: "Shopify sign-in was cancelled or failed.",
  missing_params: "Missing authorization details. Please try again.",
  config: "Store configuration error. Please try again later.",
  invalid_state: "Session expired. Please try linking again.",
  shopify_session_mismatch: "Session mismatch. Please sign in again.",
  discovery_failed: "Could not connect to Shopify. Please try again.",
  token_exchange_failed: "Could not complete Shopify sign-in.",
  storage_failed: "Could not save your connection. Please try again.",
  callback_failed: "Something went wrong. Please try again.",
};

export interface ShopAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Supabase user – null when not signed in */
  user: { id: string; email?: string; displayName?: string } | null;
  /** Whether Shopify Customer Account is linked */
  shopifyLinked?: boolean;
  /** Error code from callback (e.g. shopify_auth_failed) */
  shopifyError?: string | null;
  /** Redirect after Supabase sign-in */
  redirectAfterAuth?: string;
  /** Initial tab when showing sign in/up */
  initialTab?: "signin" | "signup";
  /** Callback when user chooses "Continue as guest" – typically navigate and close */
  onContinueAsGuest?: () => void;
}

export function ShopAuthDialog({
  open,
  onOpenChange,
  user,
  shopifyLinked = false,
  shopifyError,
  redirectAfterAuth = "/dojo/products",
  initialTab = "signin",
  onContinueAsGuest,
}: ShopAuthDialogProps) {
  const verseRedirectTo = redirectAfterAuth;
  const [activeTab, setActiveTab] = React.useState<"signin" | "signup">(initialTab);
  const { theme } = useVerseTheme();
  const errorMessage = shopifyError ? SHOPIFY_ERROR_MESSAGES[shopifyError] ?? "Something went wrong. Please try again." : null;

  const handleContinueAsGuest = () => {
    onContinueAsGuest?.();
    onOpenChange(false);
  };

  const showSignIn = !user;
  const showLinkShopify = user && !shopifyLinked;
  const showAllSet = user && shopifyLinked;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-verse-theme={theme}
        className={cn(
          "verse-dropdown border-[var(--verse-border,rgba(15,23,42,0.08))]",
          "bg-[rgba(var(--verse-bg-rgb,241,245,249),0.98)] backdrop-blur-xl",
          "shadow-[0_8px_32px_rgba(0,0,0,0.15)]"
        )}
        aria-describedby="shop-auth-dialog-description"
      >
        <DialogHeader>
          <DialogTitle className="text-[var(--verse-text)]">
            {showAllSet
              ? "You're all set"
              : showLinkShopify
                ? "Link your Shopify account"
                : "Sign in to the MNKY VERSE Store"}
          </DialogTitle>
          <DialogDescription
            id="shop-auth-dialog-description"
            className="text-[var(--verse-text-muted)]"
          >
            {showAllSet
              ? "Your account is linked. Browse the store anytime."
              : showLinkShopify
                ? "Connect your Shopify account for checkout, orders, and saved cart."
                : "Sign in to browse the full store experience, save your cart, and checkout."}
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div
            role="alert"
            className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {errorMessage}
          </div>
        )}

        {showAllSet && (
          <div className="flex flex-col gap-4">
            <VerseButton asChild className="w-full">
              <Link href={redirectAfterAuth} onClick={() => onOpenChange(false)}>
                Continue to Shop
              </Link>
            </VerseButton>
          </div>
        )}

        {showLinkShopify && (
          <Card className="border-[var(--verse-border)] bg-[rgba(var(--verse-bg-rgb),0.85)] shadow-none">
            <CardContent className="pt-6">
              <VerseButton
                asChild
                className="inline-flex w-full items-center justify-center gap-2 bg-[var(--verse-button)] text-[var(--verse-button-text)] hover:opacity-90"
              >
                <a href="/api/customer-account-api/auth" title="Link your Shopify account">
                  <Store className="h-4 w-4 shrink-0" aria-hidden />
                  Link Shopify Account
                </a>
              </VerseButton>
              <p className="mt-3 text-center text-xs text-[var(--verse-text-muted)]">
                You'll be redirected to Shopify to sign in securely.
              </p>
            </CardContent>
          </Card>
        )}

        {showSignIn && (
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "signin" | "signup")}
            className="w-full"
          >
            <TabsList className="mb-4 grid w-full grid-cols-2 border-[var(--verse-border)] bg-transparent p-1">
              <TabsTrigger
                value="signin"
                className="data-[state=active]:bg-[var(--verse-button)] data-[state=active]:text-[var(--verse-button-text)] data-[state=inactive]:text-[var(--verse-text-muted)]"
              >
                Sign in
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="data-[state=active]:bg-[var(--verse-button)] data-[state=active]:text-[var(--verse-button-text)] data-[state=inactive]:text-[var(--verse-text-muted)]"
              >
                Sign up
              </TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <Card className="border-[var(--verse-border)] bg-[rgba(var(--verse-bg-rgb),0.85)] shadow-[0_8px_32px_rgba(0,0,0,0.1)] backdrop-blur-xl">
                <CardContent className="flex flex-col gap-4 pt-6">
                  <OAuthProviderButton
                    provider="discord"
                    redirectTo={`/dojo/auth/callback?next=${encodeURIComponent(verseRedirectTo)}`}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[var(--verse-button)] px-4 text-sm font-medium text-[var(--verse-button-text)] transition-opacity hover:opacity-90"
                  >
                    <SiDiscord className="size-5 shrink-0" aria-hidden />
                    Login with Discord
                  </OAuthProviderButton>
                  <LoginForm
                    redirectTo={verseRedirectTo}
                    onSuccess={() => onOpenChange(false)}
                  />
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleContinueAsGuest}
                      className="text-xs text-[var(--verse-text-muted)] transition-colors hover:text-[var(--verse-text)] hover:underline"
                    >
                      Continue as guest
                    </button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="signup">
              <Card className="border-[var(--verse-border)] bg-[rgba(var(--verse-bg-rgb),0.85)] shadow-[0_8px_32px_rgba(0,0,0,0.1)] backdrop-blur-xl">
                <CardContent className="flex flex-col gap-4 pt-6">
                  <SignUpForm
                    redirectTo="/auth/sign-up-success"
                    emailRedirectTo={`/auth/confirm?next=${encodeURIComponent(verseRedirectTo)}`}
                  />
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleContinueAsGuest}
                      className="text-xs text-[var(--verse-text-muted)] transition-colors hover:text-[var(--verse-text)] hover:underline"
                    >
                      Continue as guest
                    </button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
