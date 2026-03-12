"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";

const JOBS = [
  {
    slug: "paladin",
    name: "Paladin",
    role: "Tank",
    description:
      "Sword and shield in hand, standing between the party and whatever Eorzea throws at you.",
  },
  {
    slug: "warrior",
    name: "Warrior",
    role: "Tank",
    description:
      "Raw power and an axe. Hold the line and unleash when the time is right.",
  },
  {
    slug: "white-mage",
    name: "White Mage",
    role: "Healer",
    description:
      "Pure healing and light. Keep the party alive through the worst of it.",
  },
  {
    slug: "scholar",
    name: "Scholar",
    role: "Healer",
    description:
      "Fairy and tactics. Shield, heal, and outthink the encounter.",
  },
  {
    slug: "astrologian",
    name: "Astrologian",
    role: "Healer",
    description:
      "Cards and stars. Buff the right player at the right moment.",
  },
  {
    slug: "monk",
    name: "Monk",
    role: "Melee DPS",
    description:
      "Fists and chakras. Flow through forms and keep uptime relentless.",
  },
  {
    slug: "dragoon",
    name: "Dragoon",
    role: "Melee DPS",
    description:
      "Jumps and the dragon within. Precision and commitment to the spear.",
  },
  {
    slug: "ninja",
    name: "Ninja",
    role: "Melee DPS",
    description:
      "Mudra and trickery. Ninki, trick attack, and the element of surprise.",
  },
  {
    slug: "samurai",
    name: "Samurai",
    role: "Melee DPS",
    description:
      "Iaijutsu and sen. Build, then release in a single decisive strike.",
  },
] as const;

const INTERVAL_MS = 5000;
const INTERVAL_MS_REDUCED = 10000;

export function HeroJobCards({ className = "" }: { className?: string }) {
  const [index, setIndex] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = () => setPrefersReducedMotion(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (paused) return;
    const interval = prefersReducedMotion ? INTERVAL_MS_REDUCED : INTERVAL_MS;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % JOBS.length);
    }, interval);
    return () => clearInterval(id);
  }, [prefersReducedMotion, paused]);

  const job = JOBS[index];

  return (
    <div
      className={`flex flex-col items-center gap-4 ${className}`}
      aria-label="FFXIV job highlights"
    >
      <div
        className="w-full max-w-[320px] sm:max-w-[360px]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* TCG-style card: square art window (fills frame) + compact text box */}
        <Card className="overflow-hidden rounded-2xl border-2 border-border bg-card shadow-xl transition-all duration-300 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5">
          {/* Art window — square so the job icon fills the frame with no extra space */}
          <div className="relative aspect-square w-full">
            <div className="absolute inset-1.5 overflow-hidden rounded-lg border-2 border-border/80 bg-gradient-to-b from-muted/50 to-muted/20 shadow-inner sm:inset-2">
              <Image
                src={`/images/jobs/${job.slug}.png`}
                alt=""
                fill
                className="object-contain"
                sizes="(max-width: 640px) 280px, 320px"
                unoptimized={false}
                priority
              />
              <div
                className="pointer-events-none absolute inset-0 rounded-lg shadow-[inset_0_-60px_40px_-30px_rgba(0,0,0,0.12)]"
                aria-hidden
              />
            </div>
          </div>
          {/* Text box — compact TCG-style */}
          <div className="border-t-2 border-border bg-card/98 px-3 py-2.5 sm:px-4 sm:py-3">
            <div className="flex items-center gap-2">
              <span className="rounded border border-primary/40 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary sm:text-xs">
                {job.role}
              </span>
              <h3 className="font-bold leading-tight text-foreground text-sm sm:text-base">
                {job.name}
              </h3>
            </div>
            <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">
              {job.description}
            </p>
          </div>
        </Card>
      </div>
      <div
        className="flex gap-1.5"
        role="tablist"
        aria-label="Job selection"
      >
        {JOBS.map((j, i) => (
          <button
            key={j.slug}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Show ${j.name}`}
            title={j.name}
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === index
                ? "w-6 bg-primary"
                : "w-2 bg-muted-foreground/40 hover:bg-muted-foreground/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
