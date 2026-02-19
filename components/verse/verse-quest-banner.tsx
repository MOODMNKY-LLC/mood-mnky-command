import Link from "next/link";
import { Target } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";

type Quest = { id: string; title: string; xp_reward: number | null };

type VerseQuestBannerProps = {
  quest: Quest | null;
};

export function VerseQuestBanner({ quest }: VerseQuestBannerProps) {
  if (!quest) return null;

  const xp = quest.xp_reward ?? 0;

  return (
    <BlurFade delay={0.1} inView inViewMargin="-20px">
      <div className="rounded-lg border border-verse-text/15 bg-verse-text/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 shrink-0 text-verse-text-muted" />
          <p className="text-sm text-verse-text">
            Complete a purchase to finish{" "}
            <span className="font-medium">{quest.title}</span>
            {xp > 0 && (
              <>
                {" "}
                and earn <span className="font-medium">{xp} XP</span>
              </>
            )}
            .
          </p>
          <Link
            href="/verse/products"
            className="ml-auto shrink-0 text-sm font-medium text-verse-text underline underline-offset-2 hover:text-verse-text-muted"
          >
            Shop now
          </Link>
        </div>
      </div>
    </BlurFade>
  );
}
