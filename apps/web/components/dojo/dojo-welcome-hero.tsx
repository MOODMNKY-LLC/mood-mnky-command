"use client";

import { BlurFade } from "@/components/ui/blur-fade";

interface DojoWelcomeHeroProps {
  displayName: string | null;
  isReturning?: boolean;
}

export function DojoWelcomeHero({ displayName, isReturning = true }: DojoWelcomeHeroProps) {
  const name = displayName?.trim() || "there";
  const greeting = isReturning ? `Welcome back, ${name}` : `Welcome, ${name}`;

  return (
    <BlurFade delay={0.05} inView inViewMargin="-20px">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {greeting}
        </h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-xl">
          Your private space for bespoke fragrances, quests, and community rewards.
        </p>
      </div>
    </BlurFade>
  );
}
