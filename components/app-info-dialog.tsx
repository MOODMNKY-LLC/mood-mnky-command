"use client";

import { useState } from "react";
import { Info, Users, Box, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerseButton } from "@/components/verse/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BlurFade } from "@/components/ui/blur-fade";
import { cn } from "@/lib/utils";

export function AppInfoDialog({
  variant = "labz",
}: {
  variant?: "verse" | "labz";
}) {
  const [open, setOpen] = useState(false);

  const isVerse = variant === "verse";
  const TriggerButton = isVerse ? VerseButton : Button;

  return (
    <>
      <TriggerButton
        variant="ghost"
        size="icon"
        className={cn(
          "h-11 w-11 min-h-[44px] min-w-[44px]",
          isVerse ? "text-verse-text" : "text-foreground"
        )}
        onClick={() => setOpen(true)}
        aria-label="About and roadmap"
      >
        <Info className="h-4 w-4" />
      </TriggerButton>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className={cn(
            "max-w-2xl max-h-[85vh] flex flex-col gap-0 p-0",
            "rounded-2xl border border-border/60 shadow-2xl shadow-black/5 dark:shadow-black/20",
            "backdrop-blur-2xl bg-background/90 text-foreground",
            "dark:bg-background/90",
            "duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          )}
        >
        <BlurFade inView={false} delay={0} duration={0.35} blur="8px" offset={4} className="shrink-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
              About & Roadmap
            </DialogTitle>
          </DialogHeader>
        </BlurFade>
        <Tabs defaultValue="about-us" className="flex flex-col flex-1 min-h-0 px-6 pb-6">
          <BlurFade inView={false} delay={0.06} duration={0.35} blur="6px" offset={3} className="shrink-0">
            <TabsList className="w-full grid grid-cols-3 shrink-0 rounded-xl bg-muted/80 p-1.5 text-foreground">
              <TabsTrigger value="about-us" className="gap-1.5 rounded-lg text-xs sm:text-sm">
                <Users className="h-3.5 w-3.5 shrink-0" />
                About Us
              </TabsTrigger>
              <TabsTrigger value="about-app" className="gap-1.5 rounded-lg text-xs sm:text-sm">
                <Box className="h-3.5 w-3.5 shrink-0" />
                About the App
              </TabsTrigger>
              <TabsTrigger value="roadmap" className="gap-1.5 rounded-lg text-xs sm:text-sm">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                Roadmap
              </TabsTrigger>
            </TabsList>
          </BlurFade>

          <BlurFade inView={false} delay={0.12} duration={0.4} blur="6px" offset={4} className="mt-4 flex min-h-0 flex-1 flex-col">
          <ScrollArea className="min-h-[240px] max-h-[50vh] flex-1">
            <TabsContent value="about-us" className="mt-0 space-y-3">
              <p className={"text-sm text-muted-foreground"}>
                <strong className="text-foreground">MOOD MNKY</strong> is bespoke fragrance in the MNKY VERSE. We believe in sensory journeys, extreme personalization, and “Always scentsing the MOOD.”
              </p>
              <p className={"text-sm text-muted-foreground"}>
                <strong className="text-foreground">The Experience</strong> — custom and bespoke. <strong className="text-foreground">The Dojo</strong> — your private portal in the MNKY VERSE (preferences, default agent). <strong className="text-foreground">Community</strong> — Discord, store blog, MNKY VERSE blog. <strong className="text-foreground">The Foundation</strong> — the Blending Lab.
              </p>
            </TabsContent>

            <TabsContent value="about-app" className="mt-0 space-y-3">
              <p className={"text-sm text-foreground"}>
                This app is a monorepo containing:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li><strong className="text-foreground">Next.js app</strong> — MNKY VERSE storefront (catalog, cart, blog, Dojo, community), MNKY LABZ dashboard, and Blending Lab; deployed on Vercel.</li>
                <li><strong className="text-foreground">Shopify theme</strong> — Liquid theme (Dawn-derived) for the store; links to the app for MNKY VERSE, Dojo, and Community.</li>
                <li><strong className="text-foreground">Theme app extension</strong> — app blocks (Blending CTA, Fragrance Finder, Subscription CTA) and app embed.</li>
                <li><strong className="text-foreground">Supabase</strong> — backend for MNKY VERSE blog, auth, and other data.</li>
              </ul>
              <p className={"text-sm text-muted-foreground"}>
                The store and the app share the same Shopify catalog via the Storefront API. The MNKY VERSE storefront is built with Next.js and Hydrogen React (Shopify’s “bring your own stack” path).
              </p>
            </TabsContent>

            <TabsContent value="roadmap" className="mt-0 space-y-4">
              <div>
                <h3 className={"text-sm font-semibold mb-2 text-foreground"}>APIs in scope</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li><strong className="text-foreground">Storefront API</strong> — Catalog, cart, checkout; Verse products, collections, cart.</li>
                  <li><strong className="text-foreground">Customer Account API</strong> — Identity, orders, profile; OAuth PKCE link, tokens in Supabase.</li>
                  <li><strong className="text-foreground">Admin API</strong> — LABZ products, media, theme, webhooks.</li>
                  <li><strong className="text-foreground">Webhooks</strong> — Order/paid → Inngest → XP; profile resolution.</li>
                </ul>
              </div>
              <div>
                <h3 className={"text-sm font-semibold mb-2 text-foreground"}>Phased initiatives</h3>
                <ul className={"space-y-2 text-sm text-muted-foreground"}>
                  <li><strong className="text-foreground">Phase 1 (current):</strong> Header Shopify link + tooltip; profile link/unlink.</li>
                  <li><strong className="text-foreground">Phase 2:</strong> Verse “My orders” / order status; optional reconnect flow.</li>
                  <li><strong className="text-foreground">Phase 3:</strong> LABZ dashboards (Admin API); optional webhook expansion.</li>
                  <li><strong className="text-foreground">Phase 4:</strong> Agent/MCP tools; personalized Verse (recommendations, prefill).</li>
                  <li><strong className="text-foreground">Phase 5:</strong> Theme/app extension features; optional Oxygen or multi-store.</li>
                </ul>
              </div>
            </TabsContent>
          </ScrollArea>
          </BlurFade>
        </Tabs>
      </DialogContent>
      </Dialog>
    </>
  );
}
