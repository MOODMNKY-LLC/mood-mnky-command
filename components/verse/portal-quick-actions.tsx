"use client";

import {
  ShoppingBag,
  Sparkles,
  MessageCircle,
  User,
  CircleDot,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VersePortalCard } from "./verse-portal-card";
import { BlurFade } from "@/components/ui/blur-fade";
import type { VerseUser } from "./verse-storefront-shell";

const ACTIONS = [
  {
    name: "Shop Products",
    description: "Discover bespoke fragrances and self-care rituals from MOOD MNKY.",
    href: "/verse/products",
    cta: "Browse",
    Icon: ShoppingBag,
    className: "col-span-3 lg:col-span-1",
  },
  {
    name: "Explore Fragrances",
    description: "Glossary, fragrance notes, and educational content.",
    href: "/verse/explore",
    cta: "Explore",
    Icon: Sparkles,
    className: "col-span-3 lg:col-span-1",
  },
  {
    name: "AI Chat",
    description: "Meet MOOD MNKY, SAGE MNKY—AI assistants for discovery.",
    href: "/verse/chat",
    cta: "Chat",
    Icon: MessageCircle,
    className: "col-span-3 lg:col-span-1",
  },
  {
    name: "Fragrance Wheel",
    description: "Discover scent families and find your favorites.",
    href: "/verse/fragrance-wheel",
    cta: "Explore",
    Icon: CircleDot,
    className: "col-span-3 lg:col-span-1",
  },
  {
    name: "Blending Guide",
    description: "Learn how scents work together.",
    href: "/verse/blending-guide",
    cta: "Learn",
    Icon: BookOpen,
    className: "col-span-3 lg:col-span-1",
  },
  {
    name: "Profile",
    description: "Account settings and scent preferences.",
    href: "/verse/profile",
    cta: "Profile",
    Icon: User,
    className: "col-span-3 lg:col-span-1",
  },
];

export function PortalQuickActions({ user }: { user?: VerseUser }) {
  return (
    <BlurFade delay={0.2} inView inViewMargin="-20px">
      <div className="grid auto-rows-[18rem] grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ACTIONS.map((item) => (
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
