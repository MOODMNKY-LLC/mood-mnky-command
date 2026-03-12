"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";
import { VerseButton } from "@/components/verse/ui/button";
import { VerseAgentCard } from "@/components/verse/verse-agent-card";
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

const VALUE_PILLARS = [
  {
    name: "MOOD MNKY",
    desc: "Your personal guide through the world of custom fragrances and self-care",
    href: "/verse/agents/mood_mnky",
  },
  {
    name: "SAGE MNKY",
    desc: "Your mentor and guide through personalized learning experiences",
    href: "/verse/agents/sage_mnky",
  },
  {
    name: "CODE MNKY",
    desc: "Your technical companion for development and infrastructure",
    href: "/verse/agents/code_mnky",
  },
];

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
      <div className="space-y-12">
        {/* Hero */}
        <BlurFade delay={0.05} inView inViewMargin="-20px">
          <section className="space-y-4 text-center">
            <h1 className="font-verse-heading text-3xl font-semibold tracking-tight text-verse-text md:text-4xl lg:text-5xl">
              Meet Your AI Guides
            </h1>
            <p className="mx-auto max-w-2xl text-base text-verse-text-muted md:text-lg">
              The MNKY DOJO is brought to life by specialized AI companions
              that enhance different aspects of your experience.
            </p>
            <div className="pt-2">
              <VerseButton asChild size="lg">
                <a href="#agent-cards">Explore agents</a>
              </VerseButton>
            </div>
          </section>
        </BlurFade>

        {/* Value section */}
        <BlurFade delay={0.1} inView inViewMargin="-20px">
          <section className="space-y-6">
            <div className="text-center">
              <h2 className="font-verse-heading text-xl font-semibold text-verse-text md:text-2xl">
                Our AI Companions
              </h2>
              <p className="mt-2 max-w-xl mx-auto text-sm text-verse-text-muted">
                Each companion brings expertise and personality to help you
                explore fragrances, learning, and technical creation.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {VALUE_PILLARS.map((pillar) => (
                <Link
                  key={pillar.name}
                  href={pillar.href}
                  className="rounded-lg border border-[var(--verse-border)] p-4 transition-colors hover:bg-verse-text/[0.03]"
                >
                  <h3 className="font-verse-heading font-semibold text-verse-text">
                    {pillar.name}
                  </h3>
                  <p className="mt-1 text-sm text-verse-text-muted">
                    {pillar.desc}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        </BlurFade>

        {/* Agent cards grid */}
        <BlurFade delay={0.15} inView inViewMargin="-20px">
          <section id="agent-cards" className="space-y-6">
            <h2 className="font-verse-heading text-xl font-semibold text-verse-text">
              Your Guides
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {agents.map((agent) => (
                <VerseAgentCard
                  key={agent.slug}
                  slug={agent.slug}
                  displayName={agent.display_name}
                  blurb={agent.blurb}
                  imagePath={agent.image_path}
                  openaiModel={agent.openai_model}
                  openaiVoice={agent.openai_voice}
                />
              ))}
            </div>
          </section>
        </BlurFade>
      </div>
    </div>
  );
}
