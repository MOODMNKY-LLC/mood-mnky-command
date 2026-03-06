"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const JOB_SLUGS = [
  "astrologian",
  "dragoon",
  "monk",
  "ninja",
  "paladin",
  "samurai",
  "scholar",
  "warrior",
  "white-mage",
] as const;

const MARQUEE_DURATION = 40;
const MARQUEE_DURATION_REDUCED = 120;

export function JobAvatarsMarquee({
  className = "",
  size = 64,
  repeat = 2,
}: {
  className?: string;
  size?: number;
  repeat?: number;
}) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = () => setPrefersReducedMotion(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const duration = prefersReducedMotion ? MARQUEE_DURATION_REDUCED : MARQUEE_DURATION;
  const paths = JOB_SLUGS.map((s) => `/images/jobs/${s}.png`);

  return (
    <div
      className={`relative w-full overflow-hidden ${className}`}
      style={{ maskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)", WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)" }}
      aria-hidden
    >
      <div
        className="flex shrink-0 gap-4"
        style={{
          width: "max-content",
          animation: prefersReducedMotion ? "none" : `job-marquee-scroll ${duration}s linear infinite`,
        }}
      >
        {Array.from({ length: repeat }).map((_, r) =>
          paths.map((src) => (
            <div
              key={`${r}-${src}`}
              className="relative shrink-0 rounded-full bg-primary/10 ring-1 ring-primary/20"
              style={{ width: size, height: size }}
            >
              <Image
                src={src}
                alt=""
                width={size}
                height={size}
                className="rounded-full object-contain p-0.5"
                unoptimized={false}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
