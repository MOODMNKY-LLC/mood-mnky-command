"use client";

import { BlurFade } from "@/components/ui/blur-fade";
import { useVerseUser } from "./verse-user-context";

export function PortalWelcome() {
  const user = useVerseUser();
  const name = user?.displayName || user?.email?.split("@")[0] || null;

  const content = name ? (
    <p className="text-lg text-verse-text">
      Welcome back, <span className="font-medium">{name}</span>
    </p>
  ) : (
    <p className="text-lg text-verse-text">
      Your members-only portal to bespoke fragrances, self-care rituals, and
      community wellness.
    </p>
  );

  return (
    <BlurFade delay={0.1} inView inViewMargin="-20px">
      {content}
    </BlurFade>
  );
}
