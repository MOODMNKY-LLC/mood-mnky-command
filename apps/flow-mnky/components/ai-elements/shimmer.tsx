"use client";

import type { MotionProps } from "motion/react";
import type { CSSProperties, ElementType, JSX } from "react";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { memo, useMemo } from "react";

type MotionHTMLProps = MotionProps & Record<string, unknown>;

// Cache motion components at module level to avoid creating during render
const motionComponentCache = new Map<
  keyof JSX.IntrinsicElements,
  React.ComponentType<MotionHTMLProps>
>();

const getMotionComponent = (element: keyof JSX.IntrinsicElements) => {
  let component = motionComponentCache.get(element);
  if (!component) {
    component = motion.create(element);
    motionComponentCache.set(element, component);
  }
  return component;
};

export interface TextShimmerProps {
  children: string;
  as?: ElementType;
  className?: string;
  /** Duration in seconds for one full sweep (lower = faster). Default 2. */
  duration?: number;
  /** Pixels per character for the highlight band width; band = 2 × spread × textLength. Default 2. */
  spread?: number;
  /** Minimum band width in px so the sweep stays visible on short text. Default 0. */
  minSpread?: number;
  /** Sweep color (e.g. "rgba(255,255,255,0.95)" or "white"). Defaults to var(--color-background). */
  sweepColor?: string;
}

const ShimmerComponent = ({
  children,
  as: Component = "p",
  className,
  duration = 2,
  spread = 2,
  minSpread = 0,
  sweepColor,
}: TextShimmerProps) => {
  const MotionComponent = getMotionComponent(
    Component as keyof JSX.IntrinsicElements
  );

  const dynamicSpread = useMemo(
    () => Math.max((children?.length ?? 0) * spread, minSpread),
    [children, spread, minSpread]
  );

  const sweep = sweepColor ?? "var(--color-background)";

  return (
    <MotionComponent
      animate={{ backgroundPosition: "0% center" }}
      className={cn(
        "relative inline-block bg-[length:250%_100%,auto] bg-clip-text text-transparent",
        "[background-repeat:no-repeat,padding-box]",
        className
      )}
      initial={{ backgroundPosition: "100% center" }}
      style={
        {
          "--spread": `${dynamicSpread}px`,
          backgroundImage:
            `linear-gradient(90deg,transparent calc(50% - var(--spread)),${sweep},transparent calc(50% + var(--spread))), linear-gradient(var(--color-muted-foreground), var(--color-muted-foreground))`,
        } as CSSProperties
      }
      transition={{
        duration,
        ease: "linear",
        repeat: Number.POSITIVE_INFINITY,
      }}
    >
      {children}
    </MotionComponent>
  );
};

export const Shimmer = memo(ShimmerComponent);
