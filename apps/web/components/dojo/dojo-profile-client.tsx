"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR, { mutate as globalMutate } from "swr";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LogOut,
  FileAudio,
  Trash2,
  Loader2,
  User,
  Award,
  Link2,
  Music,
  ExternalLink,
  Key,
  Store,
  MessageCircle,
} from "lucide-react";
import { SiGithub } from "react-icons/si";
import { VerseAudioDropzone } from "@/components/verse/verse-audio-dropzone";
import { BUCKETS } from "@/lib/supabase/storage";
import type { MediaAsset } from "@/lib/supabase/storage";
import { updateProfile } from "@/app/(storefront)/verse/profile/actions";
import { DojoProfileSnapshot } from "@/components/dojo/dojo-profile-snapshot";
import { Alert, AlertDescription } from "@/components/ui/alert";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const USERNAME_MIN_LENGTH = 3;

function getAvatarDisplayUrl(
  supabase: ReturnType<typeof createClient>,
  avatarUrl: string | null | undefined
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

export interface DojoProfileClientProps {
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
  defaultChatflowId?: string | null;
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
}

export function DojoProfileClient({
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
  defaultChatflowId,
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
}: DojoProfileClientProps) {
  const router = useRouter();
  const supabase = createClient();

  const [displayNameValue, setDisplayNameValue] = useState(initialDisplayName ?? "");
  const [fullNameValue, setFullNameValue] = useState(fullName ?? initialDisplayName ?? "");
  const [usernameValue, setUsernameValue] = useState(initialUsername ?? "");
  const [handleValue, setHandleValue] = useState(initialHandle ?? "");
  const [websiteValue, setWebsiteValue] = useState(initialWebsite ?? "");
  const [bioValue, setBioValue] = useState(initialBio ?? "");
  const [avatarUrlValue, setAvatarUrlValue] = useState(initialAvatarUrl ?? "");
  const [defaultChatflowValue, setDefaultChatflowValue] = useState<string>(defaultChatflowId ?? "");
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

  type FlowiseAssignment = { id: string; chatflow_id: string; display_name: string | null };
  const { data: assignmentsData } = useSWR<{ assignments: FlowiseAssignment[] }>(
    "/api/flowise/assignments",
    fetcher,
    { revalidateOnFocus: false }
  );
  const assignments = assignmentsData?.assignments ?? [];
  const { data: chatflowsList } = useSWR<{ id: string; name?: string }[]>(
    assignments.length > 0 ? "/api/flowise/chatflows" : null,
    async (url) => {
      const r = await fetch(url, { credentials: "same-origin" });
      if (!r.ok) return [];
      const json = await r.json();
      return Array.isArray(json) ? json : [];
    },
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );
  const chatflows = chatflowsList ?? [];
  useEffect(() => {
    setDefaultChatflowValue(defaultChatflowId ?? "");
  }, [defaultChatflowId]);

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
  const myTracks = verseTracksData?.assets ?? [];
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);

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
            // best-effort
          }
        }
        router.refresh();
        globalMutate("/api/verse/profile");
      } else {
        setProfileError(result.error ?? null);
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
        setProfileError(result.error ?? null);
      }
    } finally {
      setPrefsSaving(false);
    }
  };

  const handleDeleteTrack = async (assetId: string) => {
    setDeletingAssetId(assetId);
    try {
      const res = await fetch(`/api/media/${assetId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || "Failed to delete");
      }
      mutateVerseTracks();
      globalMutate("/api/media");
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Failed to delete track");
    } finally {
      setDeletingAssetId(null);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  const handleShopifyUnlink = async () => {
    setShopifyUnlinking(true);
    try {
      const res = await fetch("/api/customer-account-api/unlink", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setProfileError((data as { error?: string }).error ?? "Failed to unlink");
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
        setProfileError(result.error ?? null);
      }
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Account settings, preferences, and activity.
        </p>
      </div>
      {showShopifyLinkedSuccess && (
        <Alert className="border-green-500/30 bg-green-500/10">
          <AlertDescription>
            Shopify account linked. You can manage it in Linked accounts below.
          </AlertDescription>
        </Alert>
      )}

      {/* Hero: profile snapshot */}
      <DojoProfileSnapshot
        displayName={(displayNameValue || initialDisplayName) ?? null}
        avatarUrl={(avatarUrlValue || initialAvatarUrl) ?? null}
        email={email}
        xpTotal={xpTotal}
        level={level}
        handle={(handleValue || initialHandle) ?? null}
        shopifyLinked={shopifyLinked}
        showProfileLink={false}
      />

      {/* Section grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* Identity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Identity</CardTitle>
            <CardDescription>Your public profile and avatar.</CardDescription>
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
                        className="h-24 w-24 rounded-full border border-border object-cover"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full border border-border bg-muted">
                        <User className="h-12 w-12 text-muted-foreground" />
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
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={avatarUploading}
                  >
                    {avatarUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Change photo"}
                  </Button>
                </div>
                <div className="min-w-0 flex-1 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dojo_display_name">Display name</Label>
                    <Input
                      id="dojo_display_name"
                      name="display_name"
                      value={displayNameValue}
                      onChange={(e) => setDisplayNameValue(e.target.value)}
                      placeholder="Name shown to others"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dojo_full_name">Full name</Label>
                    <Input
                      id="dojo_full_name"
                      name="full_name"
                      value={fullNameValue}
                      onChange={(e) => setFullNameValue(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dojo_username">Username</Label>
                    <Input
                      id="dojo_username"
                      name="username"
                      value={usernameValue}
                      onChange={(e) => setUsernameValue(e.target.value)}
                      placeholder={`At least ${USERNAME_MIN_LENGTH} characters`}
                      minLength={USERNAME_MIN_LENGTH}
                    />
                    <p className="text-xs text-muted-foreground">
                      At least {USERNAME_MIN_LENGTH} characters. Leave blank to clear.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dojo_handle">Handle</Label>
                    <Input
                      id="dojo_handle"
                      name="handle"
                      value={handleValue}
                      onChange={(e) => setHandleValue(e.target.value)}
                      placeholder="@handle"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dojo_website">Website</Label>
                    <Input
                      id="dojo_website"
                      name="website"
                      type="url"
                      value={websiteValue}
                      onChange={(e) => setWebsiteValue(e.target.value)}
                      placeholder="https://"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dojo_bio">Bio</Label>
                    <Textarea
                      id="dojo_bio"
                      name="bio"
                      value={bioValue}
                      onChange={(e) => setBioValue(e.target.value)}
                      placeholder="A short bio"
                      rows={3}
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
              </div>
              {profileError && <p className="text-sm text-destructive">{profileError}</p>}
              <Button type="submit" size="sm" disabled={profileSaving}>
                {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account</CardTitle>
            <CardDescription>Email, security, and sign out.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Email
              </span>
              <p className="text-sm font-medium">{email}</p>
            </div>
            {lastSignInAt != null && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Last sign-in
                </span>
                <p className="text-sm">{formatDate(lastSignInAt)}</p>
              </div>
            )}
            {createdAt != null && (
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Member since
                </span>
                <p className="text-sm">{formatDate(createdAt)}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-3 pt-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/auth/update-password">Update password</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-2">
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preferences</CardTitle>
            <CardDescription>Default chatflow for Dojo chat.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dojo_default_chatflow">Default chatflow</Label>
              {assignments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No chatflows assigned. An admin can assign chatflows in Members.
                </p>
              ) : (
                <Select
                  value={defaultChatflowValue || "__none__"}
                  onValueChange={(v) => setDefaultChatflowValue(v === "__none__" ? "" : v)}
                >
                  <SelectTrigger id="dojo_default_chatflow">
                    <SelectValue placeholder="Choose chatflow" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No default</SelectItem>
                    {assignments.map((a) => (
                      <SelectItem key={a.id} value={a.chatflow_id}>
                        {a.display_name?.trim() ||
                          chatflows.find((c) => c.id === a.chatflow_id)?.name ||
                          a.chatflow_id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <Button
              size="sm"
              onClick={handleSavePreferences}
              disabled={prefsSaving || assignments.length === 0}
            >
              {prefsSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save preferences"}
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dojo/preferences">More preferences in Dojo</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Linked accounts */}
        <Card className="md:col-span-2 xl:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Link2 className="h-4 w-4" />
              Linked accounts
            </CardTitle>
            <CardDescription>Services linked to your MNKY VERSE account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-2 rounded-lg border bg-muted/50 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  Shopify
                </span>
                {shopifyLinked ? (
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Linked
                  </span>
                ) : (
                  <Button variant="outline" size="sm" asChild>
                    <a href="/api/customer-account-api/auth">Authenticate with Shopify</a>
                  </Button>
                )}
              </div>
              {shopifyLinked && (
                <>
                  {shopifyConnection?.email && (
                    <p className="text-xs text-muted-foreground">
                      Linked as {shopifyConnection.email}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {shopifyConnection?.needsReconnect && (
                      <Button variant="outline" size="sm" className="h-8" asChild>
                        <a href="/api/customer-account-api/auth">Reconnect</a>
                      </Button>
                    )}
                    {storeAccountUrl && (
                      <Button variant="ghost" size="sm" className="h-8" asChild>
                        <a href={storeAccountUrl} target="_blank" rel="noopener noreferrer">
                          Manage Shopify account
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={handleShopifyUnlink}
                      disabled={shopifyUnlinking}
                    >
                      {shopifyUnlinking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Unlink"}
                    </Button>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-3 py-2">
              <span className="flex items-center gap-2 text-sm font-medium">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                Discord
              </span>
              {discordLinked ? (
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Linked
                </span>
              ) : (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/verse/auth/discord/link">Link account</Link>
                </Button>
              )}
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-3 py-2">
              <span className="flex items-center gap-2 text-sm font-medium">
                <SiGithub className="h-4 w-4 text-muted-foreground" />
                GitHub
              </span>
              {githubLinked ? (
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Linked
                </span>
              ) : (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/verse/auth/github/link">Link account</Link>
                </Button>
              )}
            </div>
            {canUseFlowiseKey && (
              <div className="flex flex-col gap-2 rounded-lg border bg-muted/50 px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Key className="h-4 w-4" />
                    Flowise API key
                  </span>
                  <span className="text-xs text-muted-foreground">
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
                        if (!res.ok) throw new Error((data as { error?: string }).error ?? "Failed to save");
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
                        if (!res.ok) throw new Error((data as { error?: string }).error ?? "Verification failed");
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

        {/* Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-4 w-4" />
              Activity
            </CardTitle>
            <CardDescription>XP, rewards, and saved content.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <div className="min-w-[120px] rounded-lg border bg-muted/50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Level
                </p>
                <p className="text-xl font-semibold">{level}</p>
                <p className="text-xs text-muted-foreground">{xpTotal.toLocaleString()} XP</p>
              </div>
              <div className="min-w-[120px] rounded-lg border bg-muted/50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Reward claims
                </p>
                <p className="text-xl font-semibold">{rewardClaimsCount}</p>
              </div>
              <div className="min-w-[120px] rounded-lg border bg-muted/50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Saved blends
                </p>
                <p className="text-xl font-semibold">{savedBlendsCount}</p>
              </div>
            </div>
            {hasFunnelSubmission && <p className="text-sm text-muted-foreground">Funnel submitted.</p>}
            <Button variant="outline" size="sm" asChild>
              <Link href="/dojo">View Dojo</Link>
            </Button>
          </CardContent>
        </Card>

        {/* My Tracks */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Music className="h-4 w-4" />
              My Tracks
            </CardTitle>
            <CardDescription>
              Upload and manage your audio tracks (Suno, etc.). Max 50 MB per file.
            </CardDescription>
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
              <div className="flex flex-col gap-2 border-t pt-2">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Your tracks ({myTracks.length})
                </span>
                <div
                  className="flex flex-col gap-2 overflow-y-auto pr-1"
                  style={{ maxHeight: "min(50vh, 400px)" }}
                >
                  {myTracks.map((asset) => (
                    <div
                      key={asset.id}
                      className="flex flex-col gap-1 rounded-lg border bg-muted/50 p-2"
                    >
                      <div className="flex items-center gap-2">
                        {asset.cover_art_url ? (
                          <img
                            src={asset.cover_art_url}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded object-cover"
                          />
                        ) : (
                          <FileAudio className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <div className="min-w-0 flex-1">
                          <span className="truncate text-sm font-medium">
                            {asset.audio_title || asset.file_name}
                          </span>
                          {asset.audio_artist && (
                            <p className="truncate text-xs text-muted-foreground">
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
                        <audio controls src={asset.public_url} className="h-8 w-full" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dojo links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ExternalLink className="h-4 w-4" />
              Dojo
            </CardTitle>
            <CardDescription>Playlist and advanced preferences.</CardDescription>
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
    </div>
  );
}
