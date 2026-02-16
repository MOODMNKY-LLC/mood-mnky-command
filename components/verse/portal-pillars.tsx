"use client";

import { Gift, Users, Cpu } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";
import { VerseCard, VerseCardContent } from "@/components/verse/ui/card";

const PILLARS = [
  {
    title: "THE EXPERIENCE",
    description:
      "Bespoke fragrances, self-care rituals, and curated products. Discover scents that reflect your mood.",
    Icon: Gift,
  },
  {
    title: "THE DOJO",
    description:
      "Wellness, learning, and community. Personalized dashboards, AI agents, and collaborative projects.",
    Icon: Users,
  },
  {
    title: "THE FOUNDATION",
    description:
      "The tech ecosystem powering MOOD MNKY—custom creation, learning paths, and reward systems.",
    Icon: Cpu,
  },
];

export function PortalPillars() {
  return (
    <BlurFade delay={0.3} inView inViewMargin="-20px">
      <section className="space-y-4">
        <h2 className="font-verse-heading text-xl font-semibold text-verse-text">
          The Three Pillars
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {PILLARS.map((pillar) => (
            <VerseCard
              key={pillar.title}
              className="transition-opacity hover:opacity-95"
            >
              <VerseCardContent className="flex flex-col gap-3 p-5">
                <pillar.Icon className="h-10 w-10 text-verse-text-muted" />
                <h3 className="font-verse-heading text-base font-semibold text-verse-text">
                  {pillar.title}
                </h3>
                <p className="text-sm text-verse-text-muted">
                  {pillar.description}
                </p>
              </VerseCardContent>
            </VerseCard>
          ))}
        </div>
      </section>
    </BlurFade>
  );
}
