"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { VerseButton } from "@/components/verse/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useVerseUser } from "@/components/verse/verse-user-context";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Save } from "lucide-react";

interface AgentSummary {
  slug: string;
  display_name: string;
}

export function DojoPageClient() {
  const user = useVerseUser();
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [defaultSlug, setDefaultSlug] = useState<string>("mood_mnky");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [agentsRes, profileRes] = await Promise.all([
        fetch("/api/verse/agents"),
        user ? fetch("/api/verse/profile") : Promise.resolve(null),
      ]);

      const agentsData = await agentsRes.json();
      setAgents(agentsData.agents ?? []);

      if (user && profileRes?.ok) {
        const profileData = await profileRes.json();
        const slug = profileData?.preferences?.default_agent_slug;
        if (slug) setDefaultSlug(slug);
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

  if (loading) {
    return (
      <div className="verse-container mx-auto flex min-h-[40vh] max-w-[var(--verse-page-width)] items-center justify-center px-4 py-12 md:px-6">
        <Loader2 className="h-8 w-8 animate-spin text-verse-text-muted" />
      </div>
    );
  }

  return (
    <div className="verse-container mx-auto max-w-[var(--verse-page-width)] px-4 py-12 md:px-6">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <h1 className="font-verse-heading text-3xl font-semibold tracking-tight text-verse-text md:text-4xl">
            The Dojo
          </h1>
          <p className="mt-2 text-lg text-verse-text-muted">
            Your personal space—wellness, learning, and projects.
          </p>
        </div>

        {user ? (
          <Card className="border-[var(--verse-border)] bg-[var(--verse-bg)]">
            <CardHeader>
              <CardTitle className="text-verse-text">Preferences</CardTitle>
              <CardDescription className="text-verse-text-muted">
                Customize your Verse experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-agent">Default agent</Label>
                <Select
                  value={defaultSlug}
                  onValueChange={(v) => {
                    setDefaultSlug(v);
                    setSaved(false);
                  }}
                >
                  <SelectTrigger
                    id="default-agent"
                    className="border-[var(--verse-border)] bg-[var(--verse-bg)]"
                  >
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
                <p className="text-xs text-verse-text-muted">
                  This agent will be used when you start a chat or voice session
                  (unless you switch manually).
                </p>
              </div>
              <VerseButton
                onClick={handleSave}
                disabled={saving}
                className="gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save preferences
              </VerseButton>
              {saved && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  Preferences saved.
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-[var(--verse-border)] bg-[var(--verse-bg)]">
            <CardContent className="py-8 text-center">
              <p className="text-verse-text-muted">
                Sign in to customize your Dojo and set your default agent.
              </p>
              <VerseButton asChild className="mt-4">
                <Link href="/auth/login">Sign in</Link>
              </VerseButton>
            </CardContent>
          </Card>
        )}

        <VerseButton variant="outline" asChild>
          <Link href="/verse">Back to Home</Link>
        </VerseButton>
      </div>
    </div>
  );
}
