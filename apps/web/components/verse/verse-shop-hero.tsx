import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BlurFade } from "@/components/ui/blur-fade";

export function VerseShopHero() {
  return (
    <BlurFade delay={0.05} inView inViewMargin="-20px">
      <section className="space-y-4">
        <h1 className="font-verse-heading text-3xl font-bold tracking-tight text-verse-text md:text-4xl">
          Discover your signature scent
        </h1>
        <p className="max-w-xl text-lg text-verse-text-muted">
          Curated fragrances for your mood. Bespoke candles, diffusers, and
          self-care essentials from MOOD MNKY.
        </p>
        <Button
          asChild
          size="sm"
          variant="outline"
          className="border-verse-text/20 text-verse-text"
        >
          <Link href="/dojo">Explore MNKY DOJO</Link>
        </Button>
      </section>
    </BlurFade>
  );
}
