"use client";

import Image from "next/image";
import Link from "next/link";
import { MagicCard } from "@/components/ui/magic-card";
import { VerseButton } from "@/components/verse/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageSquare, Mic, Volume2, Loader2 } from "lucide-react";
import { useVerseUser } from "@/components/verse/verse-user-context";
import { createClient } from "@/lib/supabase/client";
import { VOICE_PREVIEW_PHRASE } from "@/lib/voice-preview";
import { useCallback, useState } from "react";

interface AgentData {
  id: string;
  slug: string;
  display_name: string;
  blurb: string | null;
  image_path: string | null;
  openai_model: string;
  openai_voice: string;
  system_instructions?: string | null;
  tools: string[];
}

export function AgentProfilePageClient({ agent }: { agent: AgentData }) {
  const user = useVerseUser();
  const [settingDefault, setSettingDefault] = useState(false);
  const [defaultSet, setDefaultSet] = useState(false);
  const [previewingVoice, setPreviewingVoice] = useState(false);
  const [voicePreviewError, setVoicePreviewError] = useState<string | null>(null);

  const handleVoicePreview = useCallback(async () => {
    setPreviewingVoice(true);
    setVoicePreviewError(null);
    try {
      const res = await fetch("/api/audio/speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: VOICE_PREVIEW_PHRASE.replace("{voice}", agent.openai_voice),
          voice: agent.openai_voice,
          model: "gpt-4o-mini-tts",
          saveToLibrary: false,
        }),
      });
      if (!res.ok) {
        if (res.status === 401) {
          setVoicePreviewError("Sign in to preview voice");
          return;
        }
        const d = await res.json().catch(() => ({}));
        setVoicePreviewError((d as { error?: string }).error ?? "Preview failed");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      await audio.play();
      audio.onended = () => URL.revokeObjectURL(url);
    } catch {
      setVoicePreviewError("Preview failed");
    } finally {
      setPreviewingVoice(false);
    }
  }, [agent.openai_voice]);

  const handleSetDefault = useCallback(async () => {
    if (!user) return;
    setSettingDefault(true);
    try {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("preferences")
        .eq("id", user.id)
        .single();

      const prefs = (profile?.preferences as Record<string, unknown>) ?? {};
      const updated = {
        ...prefs,
        default_agent_slug: agent.slug,
      };

      const { error } = await supabase
        .from("profiles")
        .update({
          preferences: updated,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;
      setDefaultSet(true);
    } catch {
      setSettingDefault(false);
    } finally {
      setSettingDefault(false);
    }
  }, [user, agent.slug]);

  return (
    <div className="verse-container mx-auto max-w-[var(--verse-page-width)] px-4 py-10 md:px-6">
      <Link
        href="/verse/agents"
        className="mb-6 inline-flex items-center gap-2 text-sm text-verse-text-muted hover:text-verse-text"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to agents
      </Link>

      <div className="mx-auto max-w-2xl space-y-8">
        <MagicCard
          className="overflow-hidden rounded-xl border border-[var(--verse-border)] bg-[var(--verse-bg)] p-6"
          gradientFrom="var(--verse-button)"
          gradientTo="var(--verse-text-muted)"
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="relative aspect-square w-48 shrink-0 overflow-hidden rounded-lg bg-verse-text/5 sm:w-56">
              <Image
                src={agent.image_path ?? "/verse/mood-mnky-3d.png"}
                alt={agent.display_name}
                fill
                className="object-contain object-center p-4"
                sizes="224px"
              />
            </div>
            <div className="flex flex-1 flex-col gap-3">
              <h1 className="font-verse-heading text-2xl font-semibold tracking-tight text-verse-text md:text-3xl">
                {agent.display_name}
              </h1>
              <p className="text-verse-text-muted">
                {agent.blurb ?? ""}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{agent.openai_model}</Badge>
                <Badge variant="outline">Voice: {agent.openai_voice}</Badge>
                <VerseButton
                  variant="ghost"
                  size="sm"
                  onClick={handleVoicePreview}
                  disabled={previewingVoice}
                  className="gap-1.5 text-verse-text-muted hover:text-verse-text"
                >
                  {previewingVoice ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                  Listen to voice
                </VerseButton>
                {voicePreviewError && (
                  <span className="text-xs text-destructive">
                    {voicePreviewError}
                  </span>
                )}
              </div>
              {agent.tools?.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs font-medium uppercase tracking-wider text-verse-text-muted">
                    Capabilities
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.tools.map((t) => (
                      <Badge key={t} variant="outline" className="text-xs">
                        {typeof t === "string" ? t.replace(/_/g, " ") : String(t)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-3">
                <VerseButton asChild size="lg">
                  <Link href="/verse/chat" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Chat
                  </Link>
                </VerseButton>
                <VerseButton variant="outline" asChild size="lg">
                  <Link href="/verse/chat?mode=voice" className="gap-2">
                    <Mic className="h-4 w-4" />
                    Voice
                  </Link>
                </VerseButton>
                {user && (
                  <VerseButton
                    variant="outline"
                    size="lg"
                    onClick={handleSetDefault}
                    disabled={settingDefault || defaultSet}
                  >
                    {settingDefault ? "Saving…" : defaultSet ? "Default set" : "Set as default"}
                  </VerseButton>
                )}
              </div>
            </div>
          </div>
        </MagicCard>
      </div>
    </div>
  );
}
