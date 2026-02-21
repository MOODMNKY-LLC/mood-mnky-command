"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateProfile } from "@/app/(storefront)/verse/profile/actions";
import { BUCKETS } from "@/lib/supabase/storage";

const USERNAME_MIN_LENGTH = 3;

type ProfileData = {
  display_name?: string | null;
  full_name?: string | null;
  username?: string | null;
  handle?: string | null;
  website?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
};

export function DojoProfileDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [handle, setHandle] = useState("");
  const [website, setWebsite] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setLoading(true);
    fetch("/api/verse/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: ProfileData | null) => {
        if (data) {
          setDisplayName(data.display_name ?? "");
          setFullName(data.full_name ?? "");
          setUsername(data.username ?? "");
          setHandle(data.handle ?? "");
          setWebsite(data.website ?? "");
          setBio(data.bio ?? "");
          setAvatarUrl(data.avatar_url ?? "");
        }
      })
      .finally(() => setLoading(false));
  }, [open]);

  const avatarDisplayUrl = avatarUrl
    ? avatarUrl.startsWith("http")
      ? avatarUrl
      : supabase.storage.from(BUCKETS.userAvatars).getPublicUrl(avatarUrl).data.publicUrl
    : null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const usernameTrimmed = username.trim();
    if (usernameTrimmed !== "" && usernameTrimmed.length < USERNAME_MIN_LENGTH) {
      setError(`Username must be at least ${USERNAME_MIN_LENGTH} characters.`);
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.set("display_name", displayName.trim() || "");
      formData.set("full_name", fullName.trim() || "");
      formData.set("username", usernameTrimmed);
      formData.set("handle", handle.trim() || "");
      formData.set("website", website.trim() || "");
      formData.set("bio", bio.trim() || "");
      if (avatarUrl) formData.set("avatar_url", avatarUrl);
      const result = await updateProfile(formData);
      if (result.success) {
        router.refresh();
        onOpenChange(false);
      } else {
        setError(result.error);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setAvatarUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKETS.userAvatars)
        .upload(path, file, { upsert: true });
      if (uploadError) {
        setError(uploadError.message);
        return;
      }
      const formData = new FormData();
      formData.set("avatar_url", path);
      const result = await updateProfile(formData);
      if (result.success) {
        setAvatarUrl(path);
        router.refresh();
      } else {
        setError(result.error);
      }
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Update your display name, bio, and other profile details.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  {avatarDisplayUrl ? (
                    <img
                      src={avatarDisplayUrl}
                      alt="Avatar"
                      className="h-20 w-20 rounded-full border border-border object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border border-border bg-muted">
                      <User className="h-10 w-10 text-muted-foreground" />
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
                  {avatarUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Change photo"
                  )}
                </Button>
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="dojo-dialog-display_name">Display name</Label>
                  <Input
                    id="dojo-dialog-display_name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Name shown to others"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dojo-dialog-full_name">Full name</Label>
                  <Input
                    id="dojo-dialog-full_name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dojo-dialog-username">Username</Label>
                  <Input
                    id="dojo-dialog-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={`At least ${USERNAME_MIN_LENGTH} characters`}
                    minLength={USERNAME_MIN_LENGTH}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dojo-dialog-handle">Handle</Label>
                  <Input
                    id="dojo-dialog-handle"
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="@handle"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dojo-dialog-website">Website</Label>
                  <Input
                    id="dojo-dialog-website"
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dojo-dialog-bio">Bio</Label>
              <Textarea
                id="dojo-dialog-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A short bio"
                rows={3}
                className="resize-none"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Save profile"
                )}
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dojo/profile" onClick={() => onOpenChange(false)}>
                  View full profile
                </Link>
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
