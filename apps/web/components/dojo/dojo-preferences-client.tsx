"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useVerseUser } from "@/components/verse/verse-user-context";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Save, Store, RefreshCw, Check, FlaskConical, Heart, Shirt, Download, AlertTriangle, X } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";

interface AgentSummary {
  slug: string;
  display_name: string;
}

interface ShopProfileStatus {
  linked: boolean;
  needsReconnect: boolean;
  metafields: {
    nickname?: string;
    bio?: string;
    fragrance_preferences?: string;
    wishlist?: string;
    size_preferences?: string;
    scent_personality?: string;
  } | null;
  hasConflict?: boolean;
  conflicts?: Array<{ field: string; supabase: string | null; shopify: string | null }>;
}

interface DojoProfileData {
  savedBlendsCount?: number;
  funnelProfile?: Record<string, unknown> | null;
}

type SavedBlend = {
  id: string;
  name: string;
  product_type: string;
  fragrances?: Array<{ oilName?: string }>;
  created_at: string;
};

const SCENT_PERSONALITIES = [
  { value: "", label: "None" },
  { value: "gourmand_explorer", label: "Gourmand Explorer" },
  { value: "woody_adventurer", label: "Woodsy Adventurer" },
  { value: "floral_dreamer", label: "Floral Dreamer" },
  { value: "fresh_citrus", label: "Fresh & Citrus" },
  { value: "spicy_warmth", label: "Spicy Warmth" },
] as const;

export function DojoPreferencesClient() {
  const user = useVerseUser();
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [defaultSlug, setDefaultSlug] = useState<string>("mood_mnky");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [shopLinked, setShopLinked] = useState(false);
  const [shopMetafields, setShopMetafields] = useState<{ nickname?: string; bio?: string } | null>(null);
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [shopSaved, setShopSaved] = useState(false);
  const [shopSaving, setShopSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const [savedBlends, setSavedBlends] = useState<SavedBlend[]>([]);
  const [funnelProfile, setFunnelProfile] = useState<Record<string, unknown> | null>(null);
  const [favoriteNotes, setFavoriteNotes] = useState<string>("");

  const [wishlist, setWishlist] = useState<string[]>([]);
  const [wishlistGid, setWishlistGid] = useState("");
  const [sizePreferences, setSizePreferences] = useState<{ clothing?: string; candle?: string; soap?: string }>({});
  const [scentPersonality, setScentPersonality] = useState<string>("");
  const [hasConflict, setHasConflict] = useState(false);
  const [conflicts, setConflicts] = useState<Array<{ field: string; supabase: string | null; shopify: string | null }>>([]);
  const [pulling, setPulling] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [agentsRes, profileRes, shopProfileRes, dojoProfileRes, savedBlendsRes] = await Promise.all([
        fetch("/api/verse/agents"),
        user ? fetch("/api/verse/profile") : Promise.resolve(null),
        user ? fetch("/api/customer-account-api/profile?compare=1") : Promise.resolve(null),
        user ? fetch("/api/dojo/profile") : Promise.resolve(null),
        user ? fetch("/api/dojo/saved-blends") : Promise.resolve(null),
      ]);

      const agentsData = await agentsRes.json();
      setAgents(agentsData.agents ?? []);

      let profileData: { display_name?: string; bio?: string; preferences?: { default_agent_slug?: string }; shopify_metafields_synced_at?: string } | null = null;
      if (user && profileRes?.ok) {
        profileData = await profileRes.json();
        const slug = profileData?.preferences?.default_agent_slug;
        if (slug) setDefaultSlug(slug);
        setNickname(profileData?.display_name ?? "");
        setBio(profileData?.bio ?? "");
        setSyncStatus(profileData?.shopify_metafields_synced_at ?? null);
        const prefs = (profileData?.preferences ?? {}) as Record<string, unknown>;
        const notes = prefs.favorite_notes;
        setFavoriteNotes(
          Array.isArray(notes) ? notes.join(", ") : typeof notes === "string" ? notes : ""
        );
        setWishlist(Array.isArray(prefs.wishlist) ? prefs.wishlist : []);
        setSizePreferences((prefs.size_preferences as { clothing?: string; candle?: string; soap?: string }) ?? {});
        setScentPersonality(String(prefs.scent_personality ?? ""));
      }

      if (user && dojoProfileRes?.ok) {
        const dojoData = (await dojoProfileRes.json()) as DojoProfileData;
        setFunnelProfile(dojoData.funnelProfile ?? null);
        if (!profileData?.preferences?.favorite_notes && dojoData.funnelProfile) {
          const fp = dojoData.funnelProfile;
          const notes =
            (fp.preferred_notes as string) ??
            (fp.fragrance_hints as string) ??
            (Array.isArray(fp.preferred_notes) ? (fp.preferred_notes as string[]).join(", ") : "");
          if (notes) setFavoriteNotes(typeof notes === "string" ? notes : String(notes));
        }
      }

      if (user && savedBlendsRes?.ok) {
        const blendsData = (await savedBlendsRes.json()) as { blends?: SavedBlend[] };
        setSavedBlends(blendsData.blends ?? []);
      }

      if (user && shopProfileRes?.ok) {
        const shopData = (await shopProfileRes.json()) as ShopProfileStatus;
        setShopLinked(shopData.linked && !shopData.needsReconnect);
        setShopMetafields(shopData.metafields ?? null);
        setHasConflict(shopData.hasConflict ?? false);
        setConflicts(shopData.conflicts ?? []);
        if (shopData.metafields?.wishlist) {
          try {
            const arr = JSON.parse(shopData.metafields.wishlist) as string[];
            if (Array.isArray(arr)) setWishlist(arr);
          } catch { /* ignore */ }
        }
        if (shopData.metafields?.size_preferences) {
          try {
            const sp = JSON.parse(shopData.metafields.size_preferences) as Record<string, string>;
            if (sp && typeof sp === "object") setSizePreferences(sp);
          } catch { /* ignore */ }
        }
        if (shopData.metafields?.scent_personality) setScentPersonality(shopData.metafields.scent_personality);
        if (shopData.metafields?.fragrance_preferences && !profileData?.preferences?.favorite_notes) {
          try {
            const fp = JSON.parse(shopData.metafields.fragrance_preferences) as { favorite_notes?: string[] };
            if (Array.isArray(fp.favorite_notes) && fp.favorite_notes.length > 0) {
              setFavoriteNotes(fp.favorite_notes.join(", "));
            }
          } catch {
            /* ignore */
          }
        }
      }
    } catch {
      setAgents([
        { slug: "mood_mnky", display_name: "MOOD MNKY" },
        { slug: "sage_mnky", display_name: "SAGE MNKY" },
        { slug: "code_mnky", display_name: "CODE MNKY" },
      ]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    setSaved(false);
    try {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("preferences")
        .eq("id", user.id)
        .single();

      const prefs = (profile?.preferences as Record<string, unknown>) ?? {};
      const updated = { ...prefs, default_agent_slug: defaultSlug };

      const { error } = await supabase
        .from("profiles")
        .update({
          preferences: updated,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;
      setSaved(true);
    } catch {
      // Could show error toast
    } finally {
      setSaving(false);
    }
  }, [user, defaultSlug]);

  const handleShopSave = useCallback(async () => {
    if (!user || !shopLinked) return;
    setShopSaving(true);
    setShopSaved(false);
    try {
      const notesList = favoriteNotes
        .split(/[,;]/)
        .map((n) => n.trim())
        .filter(Boolean);
      const fragrancePrefs =
        notesList.length > 0 || savedBlends.length > 0
          ? JSON.stringify({
              favorite_notes: notesList,
              saved_blends_count: savedBlends.length,
              recent_blends: savedBlends.slice(0, 5).map((b) => ({ name: b.name, product_type: b.product_type })),
            })
          : null;

      const supabase = createClient();
      const prefs = (await supabase.from("profiles").select("preferences").eq("id", user.id).single()).data
        ?.preferences as Record<string, unknown> | undefined;
      const updatedPrefs = {
        ...(prefs ?? {}),
        favorite_notes: notesList,
        wishlist: wishlist.length > 0 ? wishlist : undefined,
        size_preferences: Object.keys(sizePreferences).length > 0 ? sizePreferences : undefined,
        scent_personality: scentPersonality || undefined,
      };
      await supabase.from("profiles").update({ preferences: updatedPrefs, updated_at: new Date().toISOString() }).eq("id", user.id);

      const res = await fetch("/api/customer-account-api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: nickname || null,
          bio: bio || null,
          fragrance_preferences: fragrancePrefs,
          wishlist: wishlist.length > 0 ? wishlist : null,
          size_preferences: Object.keys(sizePreferences).length > 0 ? sizePreferences : null,
          scent_personality: scentPersonality || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? "Sync failed");
      }
      setShopSaved(true);
      setSyncStatus(new Date().toISOString());
    } catch {
      // Could show error toast
    } finally {
      setShopSaving(false);
    }
  }, [user, shopLinked, nickname, bio, favoriteNotes, savedBlends, wishlist, sizePreferences, scentPersonality]);

  const handlePullFromShopify = useCallback(async () => {
    if (!user || !shopLinked) return;
    setPulling(true);
    try {
      const res = await fetch("/api/customer-account-api/profile/pull", { method: "POST" });
      if (!res.ok) throw new Error("Pull failed");
      setHasConflict(false);
      setConflicts([]);
      fetchData();
    } catch {
      // Could show error toast
    } finally {
      setPulling(false);
    }
  }, [user, shopLinked, fetchData]);

  const handleSyncNow = useCallback(async () => {
    if (!user || !shopLinked) return;
    setSyncing(true);
    try {
      const notesList = favoriteNotes
        .split(/[,;]/)
        .map((n) => n.trim())
        .filter(Boolean);
      const fragrancePrefs =
        notesList.length > 0 || savedBlends.length > 0
          ? JSON.stringify({
              favorite_notes: notesList,
              saved_blends_count: savedBlends.length,
              recent_blends: savedBlends.slice(0, 5).map((b) => ({ name: b.name, product_type: b.product_type })),
            })
          : null;
      const res = await fetch("/api/customer-account-api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname,
          bio,
          fragrance_preferences: fragrancePrefs,
          wishlist: wishlist.length > 0 ? wishlist : null,
          size_preferences: Object.keys(sizePreferences).length > 0 ? sizePreferences : null,
          scent_personality: scentPersonality || null,
        }),
      });
      if (!res.ok) throw new Error("Sync failed");
      setSyncStatus(new Date().toISOString());
      fetchData();
    } catch {
      // Could show error toast
    } finally {
      setSyncing(false);
    }
  }, [user, shopLinked, nickname, bio, favoriteNotes, savedBlends, wishlist, sizePreferences, scentPersonality, fetchData]);

  function formatSyncDate(iso: string | null): string {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium", timeStyle: "short" });
    } catch {
      return "—";
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="relative min-h-full w-full overflow-hidden">
      <div
        className="fixed inset-0 -z-10 overflow-hidden"
        aria-hidden
      >
        <AnimatedGridPattern
          numSquares={50}
          maxOpacity={0.2}
          duration={4}
          repeatDelay={0.5}
          width={40}
          height={40}
          className="fill-muted-foreground/15 stroke-muted-foreground/15"
        />
      </div>
      <div className="relative z-10 mx-auto max-w-2xl space-y-8 p-6">
        <BlurFade delay={0.05} inView inViewMargin="-20px">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Preferences
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Customize your Verse experience.
            </p>
          </div>
        </BlurFade>

        <BlurFade delay={0.1} inView inViewMargin="-20px">
          <Card className="dojo-glass-panel">
        <CardHeader>
          <CardTitle>Default agent</CardTitle>
          <CardDescription>
            This agent will be used when you start a chat or voice session
            (unless you switch manually).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="default-agent">Choose your default agent</Label>
            <Select
              value={defaultSlug}
              onValueChange={(v) => {
                setDefaultSlug(v);
                setSaved(false);
              }}
            >
              <SelectTrigger id="default-agent">
                <SelectValue placeholder="Choose your default agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((a) => (
                  <SelectItem key={a.slug} value={a.slug}>
                    {a.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save preferences
          </Button>
          {saved && (
            <p className="text-sm text-green-600 dark:text-green-400">
              Preferences saved.
            </p>
          )}
        </CardContent>
          </Card>
        </BlurFade>

        <BlurFade delay={0.15} inView inViewMargin="-20px">
          <Card className="dojo-glass-panel">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Fragrance profile
          </CardTitle>
          <CardDescription>
            Favorite notes and saved blends summary. Syncs to Shopify when you save shop preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="favorite-notes">Favorite notes</Label>
            <Input
              id="favorite-notes"
              value={favoriteNotes}
              onChange={(e) => {
                setFavoriteNotes(e.target.value);
                setShopSaved(false);
              }}
              placeholder="e.g. vanilla, sandalwood, bergamot (comma-separated)"
            />
          </div>
          <div className="space-y-2">
            <Label>Saved blends</Label>
            <p className="text-sm text-muted-foreground">
              {savedBlends.length === 0 ? (
                "No saved blends yet."
              ) : (
                <>
                  <span className="font-medium">{savedBlends.length}</span> blend{savedBlends.length !== 1 ? "s" : ""} saved.
                  {savedBlends.slice(0, 3).map((b) => (
                    <span key={b.id} className="ml-1 inline-block rounded-md bg-muted px-1.5 py-0.5 text-xs">
                      {b.name}
                    </span>
                  ))}
                </>
              )}
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dojo/crafting/saved">View saved blends</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
        </BlurFade>

      {shopLinked && (
        <BlurFade delay={0.2} inView inViewMargin="-20px">
          <h2 className="text-xl font-semibold tracking-tight">
            Shopper Profile &amp; Shopify Sync
          </h2>
          <Card className="dojo-glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Shop preferences
            </CardTitle>
            <CardDescription>
              Sync your nickname and bio to your Shopify account for checkout personalization and email flows.{" "}
              <Link href="/dojo/profile" className="underline hover:no-underline">
                Edit full profile
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasConflict && (
              <div className="rounded-lg border border-amber-500/50 bg-amber-50 dark:bg-amber-950/30 p-4 space-y-2">
                <p className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-200">
                  <AlertTriangle className="h-4 w-4" />
                  Profile values differ between Supabase and Shopify
                </p>
                <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                  {conflicts.map((c) => (
                    <li key={c.field}>
                      {c.field}: Supabase &quot;{c.supabase ?? "—"}&quot; vs Shopify &quot;{c.shopify ?? "—"}&quot;
                    </li>
                  ))}
                </ul>
                <Button variant="outline" size="sm" onClick={handlePullFromShopify} disabled={pulling} className="gap-2">
                  {pulling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Pull from Shopify
                </Button>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname</Label>
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  setShopSaved(false);
                }}
                placeholder="Preferred display name"
                maxLength={255}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => {
                  setBio(e.target.value);
                  setShopSaved(false);
                }}
                placeholder="Short bio for personalization"
                rows={3}
              />
            </div>
            {syncStatus && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-green-600" />
                Synced to Shopify at {formatSyncDate(syncStatus)}
              </p>
            )}
            {!syncStatus && shopLinked && (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Not yet synced. Save below to sync to your Shopify account.
              </p>
            )}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Wishlist (product GIDs)
              </Label>
              <div className="flex gap-2">
                <Input
                  value={wishlistGid}
                  onChange={(e) => setWishlistGid(e.target.value)}
                  placeholder="gid://shopify/Product/123"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const gid = wishlistGid.trim();
                      if (gid && !wishlist.includes(gid)) {
                        setWishlist([...wishlist, gid]);
                        setWishlistGid("");
                        setShopSaved(false);
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const gid = wishlistGid.trim();
                    if (gid && !wishlist.includes(gid)) {
                      setWishlist([...wishlist, gid]);
                      setWishlistGid("");
                      setShopSaved(false);
                    }
                  }}
                >
                  Add
                </Button>
              </div>
              {wishlist.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {wishlist.map((gid) => (
                    <span
                      key={gid}
                      className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs"
                    >
                      {gid.split("/").pop()}
                      <button
                        type="button"
                        onClick={() => {
                          setWishlist(wishlist.filter((w) => w !== gid));
                          setShopSaved(false);
                        }}
                        className="hover:text-destructive"
                        aria-label="Remove"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Shirt className="h-4 w-4" />
                Size preferences
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="size-clothing" className="text-xs">Clothing</Label>
                  <Select
                    value={sizePreferences.clothing ?? ""}
                    onValueChange={(v) => {
                      setSizePreferences({ ...sizePreferences, clothing: v || undefined });
                      setShopSaved(false);
                    }}
                  >
                    <SelectTrigger id="size-clothing">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">—</SelectItem>
                      <SelectItem value="XS">XS</SelectItem>
                      <SelectItem value="S">S</SelectItem>
                      <SelectItem value="M">M</SelectItem>
                      <SelectItem value="L">L</SelectItem>
                      <SelectItem value="XL">XL</SelectItem>
                      <SelectItem value="XXL">XXL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="size-candle" className="text-xs">Candle</Label>
                  <Select
                    value={sizePreferences.candle ?? ""}
                    onValueChange={(v) => {
                      setSizePreferences({ ...sizePreferences, candle: v || undefined });
                      setShopSaved(false);
                    }}
                  >
                    <SelectTrigger id="size-candle">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">—</SelectItem>
                      <SelectItem value="4oz">4 oz</SelectItem>
                      <SelectItem value="8oz">8 oz</SelectItem>
                      <SelectItem value="12oz">12 oz</SelectItem>
                      <SelectItem value="16oz">16 oz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="size-soap" className="text-xs">Soap</Label>
                  <Select
                    value={sizePreferences.soap ?? ""}
                    onValueChange={(v) => {
                      setSizePreferences({ ...sizePreferences, soap: v || undefined });
                      setShopSaved(false);
                    }}
                  >
                    <SelectTrigger id="size-soap">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">—</SelectItem>
                      <SelectItem value="bar">Bar</SelectItem>
                      <SelectItem value="sample">Sample</SelectItem>
                      <SelectItem value="travel">Travel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="scent-personality">Scent personality</Label>
              <Select
                value={scentPersonality || ""}
                onValueChange={(v) => {
                  setScentPersonality(v);
                  setShopSaved(false);
                }}
              >
                <SelectTrigger id="scent-personality">
                  <SelectValue placeholder="Select designer profile" />
                </SelectTrigger>
                <SelectContent>
                  {SCENT_PERSONALITIES.map((p) => (
                    <SelectItem key={p.value || "none"} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleShopSave}
                disabled={shopSaving}
                className="gap-2"
              >
                {shopSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save &amp; sync to Shopify
              </Button>
              {syncStatus && (
                <Button
                  variant="outline"
                  onClick={handleSyncNow}
                  disabled={syncing}
                  className="gap-2"
                >
                  {syncing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Sync now
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handlePullFromShopify}
                disabled={pulling}
                className="gap-2"
                title="Update Supabase from Shopify metafields"
              >
                {pulling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Pull from Shopify
              </Button>
            </div>
            {shopSaved && (
              <p className="text-sm text-green-600 dark:text-green-400">
                Shop preferences synced to Shopify.
              </p>
            )}
          </CardContent>
        </Card>
        </BlurFade>
      )}

        <BlurFade delay={0.25} inView inViewMargin="-20px">
      <Button variant="outline" asChild>
        <Link href="/dojo">Back to Dojo</Link>
      </Button>
        </BlurFade>
      </div>
    </div>
  );
}
