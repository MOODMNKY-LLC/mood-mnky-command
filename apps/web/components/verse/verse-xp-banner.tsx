import Link from "next/link";
import { Zap } from "lucide-react";
import { BlurFade } from "@/components/ui/blur-fade";

type PurchaseTier = { subtotal_min: number; xp: number };

type VerseXPBannerProps = {
  isAuthenticated: boolean;
  purchaseTiers?: PurchaseTier[];
};

function formatTiers(tiers: PurchaseTier[]): string {
  if (tiers.length === 0) return "Earn XP on every purchase.";
  const sorted = [...tiers].sort(
    (a, b) => (b.subtotal_min ?? 0) - (a.subtotal_min ?? 0)
  );
  return sorted
    .map((t) => `${t.xp} XP on orders $${t.subtotal_min}+`)
    .join(" · ");
}

export function VerseXPBanner({
  isAuthenticated,
  purchaseTiers = [],
}: VerseXPBannerProps) {
  const copy = isAuthenticated
    ? formatTiers(purchaseTiers)
    : "Sign in to earn XP on every purchase.";

  return (
    <BlurFade delay={0.08} inView inViewMargin="-20px">
      <div className="rounded-lg border border-verse-text/15 bg-verse-text/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 shrink-0 text-verse-text-muted" />
          <p className="text-sm text-verse-text">
            {copy}{" "}
            {!isAuthenticated && (
              <Link
                href="/dojo/auth/discord"
                className="font-medium underline underline-offset-2 hover:text-verse-text-muted"
              >
                Sign in
              </Link>
            )}
          </p>
        </div>
      </div>
    </BlurFade>
  );
}
