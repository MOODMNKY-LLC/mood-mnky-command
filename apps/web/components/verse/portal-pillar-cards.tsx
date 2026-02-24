"use client";

import { User, ShoppingBag } from "lucide-react";
import { VerseLogoHairIcon } from "@/components/verse/verse-logo-hair-icon";
import { VersePortalCard } from "./verse-portal-card";
import { BlurFade } from "@/components/ui/blur-fade";
import { cn } from "@/lib/utils";

const PILLAR_CARDS = [
  {
    name: "The Dojo",
    description: "Your personal space—wellness, learning, and projects.",
    href: "/dojo",
    cta: "Enter",
    Icon: User,
    className: "col-span-3 lg:col-span-1",
  },
  {
    name: "Agent Chat",
    description: "Meet MOOD MNKY, SAGE MNKY—AI assistants for discovery.",
    href: "/dojo/chat",
    cta: "Chat",
    Icon: ({ className }: { className?: string }) => (
      <VerseLogoHairIcon size="lg" withRing className={className} />
    ),
    className: "col-span-3 lg:col-span-1",
  },
  {
    name: "MNKY Shop",
    description: "Bespoke fragrances and self-care from MOOD MNKY.",
    href: "/dojo/shop",
    cta: "Shop",
    Icon: ShoppingBag,
    className: "col-span-3 lg:col-span-1",
  },
];

export function PortalPillarCards() {
  return (
    <BlurFade delay={0.1} inView inViewMargin="-20px">
      <div className="grid auto-rows-[18rem] grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {PILLAR_CARDS.map((item) => (
          <VersePortalCard
            key={item.name}
            name={item.name}
            description={item.description}
            href={item.href}
            cta={item.cta}
            Icon={item.Icon}
            className={cn(item.className)}
          />
        ))}
      </div>
    </BlurFade>
  );
}
