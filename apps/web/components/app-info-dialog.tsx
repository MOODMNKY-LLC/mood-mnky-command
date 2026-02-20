"use client";

import { useState } from "react";
import { Info, Users, Box, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerseButton } from "@/components/verse/ui/button";
import { useVerseTheme } from "@/components/verse/verse-theme-provider";
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
  const { theme: verseTheme } = useVerseTheme();

  const isVerse = variant === "verse";
  const TriggerButton = isVerse ? VerseButton : Button;

  const contentClasses = {
    title: isVerse ? "text-verse-text" : "text-foreground",
    muted: isVerse ? "text-verse-text-muted" : "text-muted-foreground",
    strong: isVerse ? "text-verse-text" : "text-foreground",
    tabsList: isVerse ? "bg-verse-text/10 text-verse-text" : "bg-muted/80 text-foreground",
    tabsTriggerActive: isVerse ? "data-[state=active]:bg-verse-text/15 data-[state=active]:text-verse-text" : "data-[state=active]:bg-accent data-[state=active]:text-accent-foreground",
  };

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
            "max-w-2xl max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden",
            "rounded-2xl shadow-2xl duration-300",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            isVerse
              ? "verse-storefront border-[var(--verse-border)] bg-[var(--verse-bg)]/95 text-[var(--verse-text)] shadow-black/20 backdrop-blur-2xl [&>button]:opacity-80 [&>button:hover]:opacity-100"
              : "border border-border/60 shadow-black/5 dark:shadow-black/20 backdrop-blur-2xl bg-background/90 text-foreground dark:bg-background/90"
          )}
          {...(isVerse ? { "data-verse-theme": verseTheme } : {})}
        >
        <BlurFade inView={false} delay={0} duration={0.35} blur="8px" offset={4} className="shrink-0">
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className={cn("text-lg font-semibold tracking-tight", contentClasses.title)}>
              About & Roadmap
            </DialogTitle>
          </DialogHeader>
        </BlurFade>
        <Tabs defaultValue="about-us" className="flex flex-col flex-1 min-h-0 px-6 pb-6">
          <BlurFade inView={false} delay={0.06} duration={0.35} blur="6px" offset={3} className="shrink-0">
            <TabsList className={cn("w-full grid grid-cols-3 shrink-0 rounded-xl p-1.5", contentClasses.tabsList)}>
              <TabsTrigger value="about-us" className={cn("gap-1.5 rounded-lg text-xs sm:text-sm", contentClasses.tabsTriggerActive)}>
                <Users className="h-3.5 w-3.5 shrink-0" />
                About Us
              </TabsTrigger>
              <TabsTrigger value="about-app" className={cn("gap-1.5 rounded-lg text-xs sm:text-sm", contentClasses.tabsTriggerActive)}>
                <Box className="h-3.5 w-3.5 shrink-0" />
                About the App
              </TabsTrigger>
              <TabsTrigger value="roadmap" className={cn("gap-1.5 rounded-lg text-xs sm:text-sm", contentClasses.tabsTriggerActive)}>
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                Roadmap
              </TabsTrigger>
            </TabsList>
          </BlurFade>

          <BlurFade inView={false} delay={0.12} duration={0.4} blur="6px" offset={4} className="mt-4 flex min-h-0 flex-1 flex-col">
          <ScrollArea className="min-h-[240px] max-h-[50vh] flex-1">
            <TabsContent value="about-us" className="mt-0 space-y-3">
              <p className={cn("text-sm", contentClasses.muted)}>
                <strong className={contentClasses.strong}>MOOD MNKY</strong> is bespoke fragrance in the MNKY VERSE. We believe in sensory journeys, extreme personalization, and “Always scentsing the MOOD.”
              </p>
              <p className={cn("text-sm", contentClasses.muted)}>
                <strong className={contentClasses.strong}>The Experience</strong> — custom and bespoke. <strong className={contentClasses.strong}>The Dojo</strong> — your private portal in the MNKY VERSE (preferences, default agent). <strong className={contentClasses.strong}>Community</strong> — Discord, store blog, MNKY VERSE blog. <strong className={contentClasses.strong}>The Foundation</strong> — the Blending Lab.
              </p>
            </TabsContent>

            <TabsContent value="about-app" className="mt-0 space-y-3">
              <p className={cn("text-sm", contentClasses.strong)}>
                This app is a monorepo containing:
              </p>
              <ul className={cn("list-disc list-inside space-y-1 text-sm", contentClasses.muted)}>
                <li><strong className={contentClasses.strong}>Next.js app</strong> — MNKY VERSE storefront (catalog, cart, blog, Dojo, community), MNKY LABZ dashboard, and Blending Lab; deployed on Vercel.</li>
                <li><strong className={contentClasses.strong}>Shopify theme</strong> — Liquid theme (Dawn-derived) for the store; links to the app for MNKY VERSE, Dojo, and Community.</li>
                <li><strong className={contentClasses.strong}>Theme app extension</strong> — app blocks (Blending CTA, Fragrance Finder, Subscription CTA) and app embed.</li>
                <li><strong className={contentClasses.strong}>Supabase</strong> — backend for MNKY VERSE blog, auth, and other data.</li>
              </ul>
              <p className={cn("text-sm", contentClasses.muted)}>
                The store and the app share the same Shopify catalog via the Storefront API. The MNKY VERSE storefront is built with Next.js and Hydrogen React (Shopify’s “bring your own stack” path).
              </p>
            </TabsContent>

            <TabsContent value="roadmap" className="mt-0 space-y-4">
              <div>
                <h3 className={cn("text-sm font-semibold mb-2", contentClasses.strong)}>APIs in scope</h3>
                <ul className={cn("list-disc list-inside space-y-1 text-sm", contentClasses.muted)}>
                  <li><strong className={contentClasses.strong}>Storefront API</strong> — Catalog, cart, checkout; Verse products, collections, cart.</li>
                  <li><strong className={contentClasses.strong}>Customer Account API</strong> — Identity, orders, profile; OAuth PKCE link, tokens in Supabase.</li>
                  <li><strong className={contentClasses.strong}>Admin API</strong> — LABZ products, media, theme, webhooks.</li>
                  <li><strong className={contentClasses.strong}>Webhooks</strong> — Order/paid → Inngest → XP; profile resolution.</li>
                </ul>
              </div>
              <div>
                <h3 className={cn("text-sm font-semibold mb-2", contentClasses.strong)}>Phased initiatives</h3>
                <ul className={cn("space-y-2 text-sm", contentClasses.muted)}>
                  <li><strong className={contentClasses.strong}>Phase 1 (current):</strong> Header Shopify link + tooltip; profile link/unlink.</li>
                  <li><strong className={contentClasses.strong}>Phase 2:</strong> Verse “My orders” / order status; optional reconnect flow.</li>
                  <li><strong className={contentClasses.strong}>Phase 3:</strong> LABZ dashboards (Admin API); optional webhook expansion.</li>
                  <li><strong className={contentClasses.strong}>Phase 4:</strong> Agent/MCP tools; personalized Verse (recommendations, prefill).</li>
                  <li><strong className={contentClasses.strong}>Phase 5:</strong> Theme/app extension features; optional Oxygen or multi-store.</li>
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
