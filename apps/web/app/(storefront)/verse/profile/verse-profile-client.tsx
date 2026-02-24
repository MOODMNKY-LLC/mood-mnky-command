"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation";
import useSWR, { mutate as globalMutate } from "swr";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LogOut, FileAudio, Trash2, Loader2, User, Award, Link2, Music, ExternalLink, Key, Store, MessageCircle } from "lucide-react";
import { SiGithub } from "react-icons/si";
import { AGENT_DISPLAY_NAME } from "@/lib/verse-blog";
import { isAgentSlug } from "@/lib/agents";
import { VerseAudioDropzone } from "@/components/verse/verse-audio-dropzone";
import { BUCKETS } from "@/lib/supabase/storage";
import type { MediaAsset } from "@/lib/supabase/storage";
import { updateProfile } from "./actions";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const DISPLAY_NAMES: Record<string, string> = {
  mood_mnky: "MOOD MNKY",
  sage_mnky: "SAGE MNKY",
  code_mnky: "CODE MNKY",
};

const USERNAME_MIN_LENGTH = 3;
const AGENT_SLUGS = ["mood_mnky", "sage_mnky", "code_mnky"] as const;

function getAvatarDisplayUrl(
  supabase: ReturnType<typeof createClient>,
  avatarUrl: string | null | undefined,
): string | null {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith("http")) return avatarUrl;
  const { data } = supabase.storage.from(BUCKETS.userAvatars).getPublicUrl(avatarUrl);
  return data.publicUrl;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

export function VerseProfileClient({
  userId,
  email,
  displayName: initialDisplayName,
  fullName,
  username: initialUsername,
  handle: initialHandle,
  website: initialWebsite,
  avatarUrl: initialAvatarUrl,
  bio: initialBio,
  lastSignInAt,
  createdAt,
  defaultAgentSlug = "mood_mnky",
  shopifyLinked = false,
  shopifyLinkedSuccess = false,
  storeAccountUrl,
  discordLinked = false,
  githubLinked = false,
  xpTotal = 0,
  level = 1,
  rewardClaimsCount = 0,
  savedBlendsCount = 0,
  hasFunnelSubmission = false,
  role,
}: {
  userId: string;
  email: string;
  displayName?: string | null;
  fullName?: string | null;
  username?: string | null;
  handle?: string | null;
  website?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  lastSignInAt?: string | null;
  createdAt?: string | null;
  defaultAgentSlug?: string;
  shopifyLinked?: boolean;
  shopifyLinkedSuccess?: boolean;
  storeAccountUrl?: string | null;
  discordLinked?: boolean;
  githubLinked?: boolean;
  xpTotal?: number;
  level?: number;
  rewardClaimsCount?: number;
  savedBlendsCount?: number;
  hasFunnelSubmission?: boolean;
  role?: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [displayNameValue, setDisplayNameValue] = useState(initialDisplayName ?? "");
  const [fullNameValue, setFullNameValue] = useState(fullName ?? initialDisplayName ?? "");
  const [usernameValue, setUsernameValue] = useState(initialUsername ?? "");
  const [handleValue, setHandleValue] = useState(initialHandle ?? "");
  const [websiteValue, setWebsiteValue] = useState(initialWebsite ?? "");
  const [bioValue, setBioValue] = useState(initialBio ?? "");
  const [avatarUrlValue, setAvatarUrlValue] = useState(initialAvatarUrl ?? "");
  const [defaultAgentValue, setDefaultAgentValue] = useState(defaultAgentSlug);
  const [profileSaving, setProfileSaving] = useState(false);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [shopifySuccessDismissed, setShopifySuccessDismissed] = useState(false);
  const [shopifyUnlinking, setShopifyUnlinking] = useState(false);
  const [flowiseKeyInput, setFlowiseKeyInput] = useState("");
  const [flowiseSaving, setFlowiseSaving] = useState(false);
  const [flowiseVerifying, setFlowiseVerifying] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const showShopifyLinkedSuccess = shopifyLinkedSuccess && !shopifySuccessDismissed;

  useEffect(() => {
    if (!showShopifyLinkedSuccess) return;
    const t = setTimeout(() => {
      setShopifySuccessDismissed(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("shopify");
      router.replace(url.pathname + url.search);
    }, 5000);
    return () => clearTimeout(t);
  }, [showShopifyLinkedSuccess, router]);

  const { data: shopifyConnection } = useSWR<{
    linked: boolean;
    needsReconnect?: boolean;
    email?: string;
  }>(shopifyLinked ? "/api/customer-account-api/connection" : null, fetcher);

  const canUseFlowiseKey = role === "admin" || role === "moderator" || role === "user";
  const { data: flowiseKeyStatus, mutate: mutateFlowiseKeyStatus } = useSWR<{
    hasKey: boolean;
    verifiedAt: string | null;
  }>(canUseFlowiseKey ? "/api/flowise/api-key/status" : null, fetcher);

  const avatarDisplayUrl = getAvatarDisplayUrl(supabase, avatarUrlValue || initialAvatarUrl);

  const verseTracksParams = new URLSearchParams();
  verseTracksParams.set("bucket", "mnky-verse-tracks");
  verseTracksParams.set("limit", "200");
  const { data: verseTracksData, mutate: mutateVerseTracks } = useSWR<{
    assets: MediaAsset[];
    count: number;
  }>(`/api/media?${verseTracksParams.toString()}`, fetcher);
  const myTracks = verseTracksData?.assets ?? []
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null)

  const defaultAgentName = isAgentSlug(defaultAgentValue)
    ? AGENT_DISPLAY_NAME[defaultAgentValue]
    : DISPLAY_NAMES[defaultAgentValue] ?? "MOOD MNKY";

  const handleSaveProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileError(null);
    const usernameTrimmed = usernameValue.trim();
    if (usernameTrimmed !== "" && usernameTrimmed.length < USERNAME_MIN_LENGTH) {
      setProfileError(`Username must be at least ${USERNAME_MIN_LENGTH} characters.`);
      return;
    }
    setProfileSaving(true);
    try {
      const formData = new FormData();
      formData.set("display_name", displayNameValue.trim() || "");
      formData.set("full_name", fullNameValue.trim() || "");
      formData.set("username", usernameTrimmed);
      formData.set("handle", handleValue.trim() || "");
      formData.set("website", websiteValue.trim() || "");
      formData.set("bio", bioValue.trim() || "");
      if (avatarUrlValue) formData.set("avatar_url", avatarUrlValue);
      const result = await updateProfile(formData);
      if (result.success) {
        if (shopifyLinked) {
          try {
            await fetch("/api/customer-account-api/profile", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                nickname: displayNameValue.trim() || null,
                bio: bioValue.trim() || null,
                verse_handle: handleValue.trim() || null,
              }),
            });
          } catch {
            // Sync is best-effort; profile save already succeeded
          }
        }
        router.refresh();
        globalMutate("/api/verse/profile");
      } else {
        setProfileError(result.error);
      }
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSavePreferences = async () => {
    setProfileError(null);
    setPrefsSaving(true);
    try {
      const formData = new FormData();
      formData.set("default_agent_slug", defaultAgentValue);
      const result = await updateProfile(formData);
      if (result.success) {
        router.refresh();
        globalMutate("/api/verse/profile");
      } else {
        setProfileError(result.error);
      }
    } finally {
      setPrefsSaving(false);
    }
  };

  const handleDeleteTrack = async (assetId: string) => {
    setDeletingAssetId(assetId)
    try {
      const res = await fetch(`/api/media/${assetId}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to delete")
      }
      mutateVerseTracks()
      globalMutate("/api/media")
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : "Failed to delete track")
    } finally {
      setDeletingAssetId(null)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  const handleShopifyUnlink = async () => {
    setShopifyUnlinking(true);
    try {
      const res = await fetch("/api/customer-account-api/unlink", {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setProfileError(data.error ?? "Failed to unlink");
        return;
      }
      globalMutate("/api/customer-account-api/connection");
      router.refresh();
    } finally {
      setShopifyUnlinking(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${userId}/avatar.${ext}`;
    setAvatarUploading(true);
    setProfileError(null);
    try {
      const { error: uploadError } = await supabase.storage
        .from(BUCKETS.userAvatars)
        .upload(path, file, { upsert: true });
      if (uploadError) {
        setProfileError(uploadError.message);
        return;
      }
      const formData = new FormData();
      formData.set("avatar_url", path);
      const result = await updateProfile(formData);
      if (result.success) {
        setAvatarUrlValue(path);
        router.refresh();
        globalMutate("/api/verse/profile");
      } else {
        setProfileError(result.error);
      }
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {showShopifyLinkedSuccess && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-verse-text">
          Shopify account linked. You can manage it in Linked accounts below.
        </div>
      )}
      <div>
        <h1 className="font-verse-heading text-2xl font-semibold text-verse-text">
          Profile
        </h1>
        <p className="mt-1 text-sm text-verse-text-muted">
          Account settings, preferences, and activity.
        </p>
      </div>

      {/* 1. Identity */}
      <Card className="border-verse-text/15 bg-verse-bg/60">
        <CardHeader>
          <h2 className="font-verse-heading text-lg font-medium text-verse-text">
            Identity
          </h2>
          <p className="text-sm text-verse-text-muted">
            Your public profile and avatar.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  {avatarDisplayUrl ? (
                    <img
                      src={avatarDisplayUrl}
                      alt="Avatar"
                      className="h-24 w-24 rounded-full border border-verse-text/15 object-cover"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full border border-verse-text/15 bg-verse-bg/40">
                      <User className="h-12 w-12 text-verse-text-muted" />
                    </div>
                  )}
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="absolute inset-0 cursor-pointer opacity-0"
                    onChange={handleAvatarChange}
                    disabled={avatarUploading}
                    aria-label="Upload avatar"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-verse-text"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={avatarUploading}
                >
                  {avatarUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Change photo"
                  )}
                </Button>
              </div>
              <div className="min-w-0 flex-1 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="display_name" className="text-verse-text">
                    Display name
                  </Label>
                  <Input
                    id="display_name"
                    name="display_name"
                    type="text"
                    value={displayNameValue}
                    onChange={(e) => setDisplayNameValue(e.target.value)}
                    className="border-verse-text/15 bg-verse-bg/40 text-verse-text placeholder:text-verse-text-muted"
                    placeholder="Name shown to others"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-verse-text">
                    Full name
                  </Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    type="text"
                    value={fullNameValue}
                    onChange={(e) => setFullNameValue(e.target.value)}
                    className="border-verse-text/15 bg-verse-bg/40 text-verse-text placeholder:text-verse-text-muted"
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-verse-text">
                    Username
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    value={usernameValue}
                    onChange={(e) => setUsernameValue(e.target.value)}
                    className="border-verse-text/15 bg-verse-bg/40 text-verse-text placeholder:text-verse-text-muted"
                    placeholder="At least 3 characters"
                    minLength={USERNAME_MIN_LENGTH}
                  />
                  <p className="text-xs text-verse-text-muted">
                    At least {USERNAME_MIN_LENGTH} characters. Leave blank to clear.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="handle" className="text-verse-text">
                    Handle
                  </Label>
                  <Input
                    id="handle"
                    name="handle"
                    type="text"
                    value={handleValue}
                    onChange={(e) => setHandleValue(e.target.value)}
                    className="border-verse-text/15 bg-verse-bg/40 text-verse-text placeholder:text-verse-text-muted"
                    placeholder="@handle"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website" className="text-verse-text">
                    Website
                  </Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    value={websiteValue}
                    onChange={(e) => setWebsiteValue(e.target.value)}
                    className="border-verse-text/15 bg-verse-bg/40 text-verse-text placeholder:text-verse-text-muted"
                    placeholder="https://"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-verse-text">
                    Bio
                  </Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={bioValue}
                    onChange={(e) => setBioValue(e.target.value)}
                    className="min-h-[80px] border-verse-text/15 bg-verse-bg/40 text-verse-text placeholder:text-verse-text-muted"
                    placeholder="A short bio"
                    rows={3}
                  />
                </div>
              </div>
            </div>
            {profileError && (
              <p className="text-sm text-destructive">{profileError}</p>
            )}
            <Button
              type="submit"
              size="sm"
              className="text-verse-text"
              disabled={profileSaving}
            >
              {profileSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save profile"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 2. Account */}
      <Card className="border-verse-text/15 bg-verse-bg/60">
        <CardHeader>
          <h2 className="font-verse-heading text-lg font-medium text-verse-text">
            Account
          </h2>
          <p className="text-sm text-verse-text-muted">
            Email, security, and sign out.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-verse-text-muted">
              Email
            </span>
            <p className="text-verse-text">{email}</p>
          </div>
          {lastSignInAt != null && (
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-verse-text-muted">
                Last sign-in
              </span>
              <p className="text-verse-text">{formatDate(lastSignInAt)}</p>
            </div>
          )}
          {createdAt != null && (
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-verse-text-muted">
                Member since
              </span>
              <p className="text-verse-text">{formatDate(createdAt)}</p>
            </div>
          )}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/auth/update-password">Update password</Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="gap-2 text-verse-text"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 3. Preferences */}
      <Card className="border-verse-text/15 bg-verse-bg/60">
        <CardHeader>
          <h2 className="font-verse-heading text-lg font-medium text-verse-text">
            Preferences
          </h2>
          <p className="text-sm text-verse-text-muted">
            Default agent for chat and voice.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="default-agent" className="text-verse-text">
              Default agent
            </Label>
            <Select
              value={defaultAgentValue}
              onValueChange={(v) => setDefaultAgentValue(v)}
            >
              <SelectTrigger
                id="default-agent"
                className="border-verse-text/15 bg-verse-bg/40 text-verse-text"
              >
                <SelectValue placeholder="Choose agent" />
              </SelectTrigger>
              <SelectContent>
                {AGENT_SLUGS.map((slug) => (
                  <SelectItem key={slug} value={slug}>
                    {isAgentSlug(slug) ? AGENT_DISPLAY_NAME[slug] : DISPLAY_NAMES[slug] ?? slug}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            size="sm"
            className="text-verse-text"
            onClick={handleSavePreferences}
            disabled={prefsSaving}
          >
            {prefsSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Save preferences"
            )}
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dojo/preferences">More preferences in Dojo</Link>
          </Button>
        </CardContent>
      </Card>

      {/* 4. Linked accounts */}
      <Card className="border-verse-text/15 bg-verse-bg/60">
        <CardHeader>
          <h2 className="font-verse-heading text-lg font-medium text-verse-text flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Linked accounts
          </h2>
          <p className="text-sm text-verse-text-muted">
            Services linked to your MNKY DOJO account.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 rounded-lg border border-verse-text/15 bg-verse-bg/40 px-3 py-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-verse-text flex items-center gap-2">
                <Store className="h-4 w-4 text-verse-text-muted" />
                Shopify
              </span>
              {shopifyLinked ? (
                <span className="text-xs font-medium uppercase tracking-wider text-verse-text-muted">
                  Linked
                </span>
              ) : (
                <Button variant="outline" size="sm" asChild>
                  <a href="/api/customer-account-api/auth">
                    Authenticate with Shopify
                  </a>
                </Button>
              )}
            </div>
            {shopifyLinked && (
              <>
                {shopifyConnection?.email && (
                  <p className="text-xs text-verse-text-muted">
                    Linked as {shopifyConnection.email}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {shopifyConnection?.needsReconnect && (
                    <Button variant="outline" size="sm" className="h-8 text-verse-text" asChild>
                      <a href="/api/customer-account-api/auth">Reconnect</a>
                    </Button>
                  )}
                  {storeAccountUrl && (
                    <Button variant="ghost" size="sm" className="h-8 text-verse-text" asChild>
                      <a href={storeAccountUrl} target="_blank" rel="noopener noreferrer">
                        Manage Shopify account
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-verse-text"
                    onClick={handleShopifyUnlink}
                    disabled={shopifyUnlinking}
                  >
                    {shopifyUnlinking ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Unlink"
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center justify-between rounded-lg border border-verse-text/15 bg-verse-bg/40 px-3 py-2">
            <span className="text-sm font-medium text-verse-text flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-verse-text-muted" />
              Discord
            </span>
            {discordLinked ? (
              <span className="text-xs font-medium uppercase tracking-wider text-verse-text-muted">
                Linked
              </span>
            ) : (
              <Button variant="outline" size="sm" asChild>
                <Link href="/verse/auth/discord/link">Link account</Link>
              </Button>
            )}
          </div>
          <div className="flex items-center justify-between rounded-lg border border-verse-text/15 bg-verse-bg/40 px-3 py-2">
            <span className="text-sm font-medium text-verse-text flex items-center gap-2">
              <SiGithub className="h-4 w-4 text-verse-text-muted" />
              GitHub
            </span>
            {githubLinked ? (
              <span className="text-xs font-medium uppercase tracking-wider text-verse-text-muted">
                Linked
              </span>
            ) : (
              <Button variant="outline" size="sm" asChild>
                <Link href="/verse/auth/github/link">Link account</Link>
              </Button>
            )}
          </div>
          {canUseFlowiseKey && (
            <div className="flex flex-col gap-2 rounded-lg border border-verse-text/15 bg-verse-bg/40 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-verse-text flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Flowise API key
                </span>
                <span className="text-xs text-verse-text-muted">
                  {flowiseKeyStatus?.hasKey
                    ? flowiseKeyStatus.verifiedAt
                      ? `Verified ${formatDate(flowiseKeyStatus.verifiedAt)}`
                      : "Stored"
                    : "Not set"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="password"
                  placeholder="Flowise API key"
                  value={flowiseKeyInput}
                  onChange={(e) => setFlowiseKeyInput(e.target.value)}
                  className="max-w-xs font-mono text-sm"
                  autoComplete="off"
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!flowiseKeyInput.trim() || flowiseSaving}
                  onClick={async () => {
                    setFlowiseSaving(true);
                    try {
                      const res = await fetch("/api/flowise/api-key", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ apiKey: flowiseKeyInput }),
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error ?? "Failed to save");
                      setFlowiseKeyInput("");
                      mutateFlowiseKeyStatus();
                    } catch (e) {
                      setProfileError(e instanceof Error ? e.message : "Failed to save key");
                    } finally {
                      setFlowiseSaving(false);
                    }
                  }}
                >
                  {flowiseSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!flowiseKeyStatus?.hasKey || flowiseVerifying}
                  onClick={async () => {
                    setFlowiseVerifying(true);
                    setProfileError(null);
                    try {
                      const res = await fetch("/api/flowise/verify-api-key", { method: "POST" });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error ?? "Verification failed");
                      mutateFlowiseKeyStatus();
                    } catch (e) {
                      setProfileError(e instanceof Error ? e.message : "Verification failed");
                    } finally {
                      setFlowiseVerifying(false);
                    }
                  }}
                >
                  {flowiseVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5. Activity / stats */}
      <Card className="border-verse-text/15 bg-verse-bg/60">
        <CardHeader>
          <h2 className="font-verse-heading text-lg font-medium text-verse-text flex items-center gap-2">
            <Award className="h-4 w-4" />
            Activity
          </h2>
          <p className="text-sm text-verse-text-muted">
            XP, rewards, and saved content.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="rounded-lg border border-verse-text/15 bg-verse-bg/40 px-4 py-3 min-w-[120px]">
              <p className="text-xs font-medium uppercase tracking-wider text-verse-text-muted">
                Level
              </p>
              <p className="text-xl font-semibold text-verse-text">{level}</p>
              <p className="text-xs text-verse-text-muted">{xpTotal.toLocaleString()} XP</p>
            </div>
            <div className="rounded-lg border border-verse-text/15 bg-verse-bg/40 px-4 py-3 min-w-[120px]">
              <p className="text-xs font-medium uppercase tracking-wider text-verse-text-muted">
                Reward claims
              </p>
              <p className="text-xl font-semibold text-verse-text">{rewardClaimsCount}</p>
            </div>
            <div className="rounded-lg border border-verse-text/15 bg-verse-bg/40 px-4 py-3 min-w-[120px]">
              <p className="text-xs font-medium uppercase tracking-wider text-verse-text-muted">
                Saved blends
              </p>
              <p className="text-xl font-semibold text-verse-text">{savedBlendsCount}</p>
            </div>
          </div>
          {hasFunnelSubmission && (
            <p className="text-sm text-verse-text-muted">
              Funnel submitted.
            </p>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href="/dojo">View Dojo</Link>
          </Button>
        </CardContent>
      </Card>

      {/* 6. Media */}
      <Card className="border-verse-text/15 bg-verse-bg/60">
        <CardHeader>
          <h2 className="font-verse-heading text-lg font-medium text-verse-text flex items-center gap-2">
            <Music className="h-4 w-4" />
            My Tracks
          </h2>
          <p className="text-sm text-verse-text-muted">
            Upload and manage your audio tracks (Suno, etc.). Max 50 MB per file.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <VerseAudioDropzone
            maxFiles={100}
            compact
            onUploadComplete={() => {
              mutateVerseTracks();
              globalMutate("/api/media");
            }}
          />
          {myTracks.length > 0 && (
            <div className="flex flex-col gap-2 pt-2 border-t border-verse-text/10">
              <span className="text-xs font-medium uppercase tracking-wider text-verse-text-muted">
                Your tracks ({myTracks.length})
              </span>
              <div
                className="flex flex-col gap-2 overflow-y-auto pr-1"
                style={{ maxHeight: "min(50vh, 400px)" }}
              >
                {myTracks.map((asset) => (
                  <div
                    key={asset.id}
                    className="flex flex-col gap-1 rounded-lg border border-verse-text/15 bg-verse-bg/40 p-2"
                  >
                    <div className="flex items-center gap-2">
                      {asset.cover_art_url ? (
                        <img
                          src={asset.cover_art_url}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <FileAudio className="h-4 w-4 shrink-0 text-verse-text-muted" />
                      )}
                      <div className="min-w-0 flex-1">
                        <span className="truncate text-sm font-medium text-verse-text">
                          {asset.audio_title || asset.file_name}
                        </span>
                        {asset.audio_artist && (
                          <p className="truncate text-xs text-verse-text-muted">
                            {asset.audio_artist}
                            {asset.audio_album ? ` · ${asset.audio_album}` : ""}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteTrack(asset.id)}
                        disabled={deletingAssetId === asset.id}
                        title="Delete track"
                      >
                        {deletingAssetId === asset.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {asset.public_url && (
                      <audio
                        controls
                        src={asset.public_url}
                        className="h-8 w-full text-verse-text"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 7. Dojo */}
      <Card className="border-verse-text/15 bg-verse-bg/60">
        <CardHeader>
          <h2 className="font-verse-heading text-lg font-medium text-verse-text flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Dojo
          </h2>
          <p className="text-sm text-verse-text-muted">
            Playlist and advanced preferences.
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dojo/preferences">Dojo preferences</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dojo">Open Dojo</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
