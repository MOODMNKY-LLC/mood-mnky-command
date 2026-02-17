"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MagicCard } from "@/components/ui/magic-card";
import { VerseButton } from "@/components/verse/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import {
  getFallbackAgentProfile,
  isAgentSlug,
} from "@/lib/agents";

interface AgentSummary {
  id: string;
  slug: string;
  display_name: string;
  blurb: string | null;
  image_path: string | null;
  openai_model: string;
  openai_voice: string;
  tools: unknown[];
}

export function AgentsPageClient() {
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch("/api/verse/agents");
      const data = await res.json();
      const list = data.agents ?? [];
      if (list.length > 0) {
        setAgents(list);
      } else {
        setAgents(
          ["mood_mnky", "sage_mnky", "code_mnky"]
            .filter(isAgentSlug)
            .map((slug) => {
              const a = getFallbackAgentProfile(slug);
              return {
                id: a.id,
                slug: a.slug,
                display_name: a.display_name,
                blurb: a.blurb,
                image_path: a.image_path,
                openai_model: a.openai_model,
                openai_voice: a.openai_voice,
                tools: a.tools,
              };
            })
        );
      }
    } catch {
      setAgents(
        ["mood_mnky", "sage_mnky", "code_mnky"]
          .filter(isAgentSlug)
          .map((slug) => {
            const a = getFallbackAgentProfile(slug);
            return {
              id: a.id,
              slug: a.slug,
              display_name: a.display_name,
              blurb: a.blurb,
              image_path: a.image_path,
              openai_model: a.openai_model,
              openai_voice: a.openai_voice,
              tools: a.tools,
            };
          })
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  if (loading) {
    return (
      <div className="verse-container mx-auto flex min-h-[40vh] max-w-[var(--verse-page-width)] items-center justify-center px-4 py-10 md:px-6">
        <Loader2 className="h-8 w-8 animate-spin text-verse-text-muted" />
      </div>
    );
  }

  return (
    <div className="verse-container mx-auto max-w-[var(--verse-page-width)] px-4 py-10 md:px-6">
      <div className="space-y-8">
        <div>
          <h1 className="font-verse-heading text-3xl font-semibold tracking-tight text-verse-text md:text-4xl">
            Agents
          </h1>
          <p className="mt-2 text-verse-text-muted">
            Meet MOOD MNKY, SAGE MNKY, and CODE MNKY—your guides across the verse.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <MagicCard
              key={agent.slug}
              className="overflow-hidden rounded-lg border border-[var(--verse-border)] bg-[var(--verse-bg)]"
              gradientFrom="var(--verse-button)"
              gradientTo="var(--verse-text-muted)"
            >
              <Link href={`/verse/agents/${agent.slug}`} className="block">
                <div className="relative aspect-square w-full overflow-hidden bg-verse-text/5">
                  <Image
                    src={agent.image_path ?? "/verse/mood-mnky-3d.png"}
                    alt={agent.display_name}
                    fill
                    className="object-contain object-center p-4"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="flex flex-col gap-2 p-5 pt-0">
                  <h2 className="font-verse-heading text-xl font-semibold text-verse-text">
                    {agent.display_name}
                  </h2>
                  <p className="text-sm text-verse-text-muted">
                    {agent.blurb ?? ""}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="text-xs">
                      {agent.openai_model}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {agent.openai_voice}
                    </Badge>
                  </div>
                  <span className="mt-2 inline-flex">
                    <span className="inline-flex h-9 items-center justify-center rounded-md border border-[var(--verse-border)] bg-transparent px-4 py-2 text-sm font-medium text-verse-text hover:bg-verse-button/10">
                      View profile
                    </span>
                  </span>
                </div>
              </Link>
            </MagicCard>
          ))}
        </div>
      </div>
    </div>
  );
}
