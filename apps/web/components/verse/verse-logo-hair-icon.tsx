"use client";

import { cn } from "@/lib/utils";

export type VerseLogoHairStatus =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking";

const LOGO_HAIR_PATHS = [
  "M 80.25 112.27 Q 87.98 97.14 89.05 79.89 Q 89.28 76.05 88.90 70.14 C 88.40 62.56 87.31 53.73 88.33 46.64 Q 89.37 39.43 92.34 33.38 Q 93.36 31.29 93.27 33.62 Q 93.16 36.50 93.87 40.42 Q 94.97 46.44 96.76 53.54 Q 99.06 62.69 99.28 66.64 C 100.25 84.01 91.16 100.14 80.24 113.57 Q 79.46 114.53 79.78 113.32 Q 79.85 113.04 80.25 112.27 Z",
  "M 137.20 157.26 Q 141.25 152.08 144.51 150.00 Q 153.75 144.12 156.55 142.07 Q 157.51 141.36 161.06 137.80 Q 161.29 137.57 161.45 137.85 Q 161.50 137.95 161.40 138.13 Q 154.20 150.20 153.32 161.02 Q 152.75 168.10 156.25 174.89 Q 159.14 180.50 159.16 180.56 Q 162.69 189.11 164.41 197.47 Q 165.74 203.96 165.45 209.12 Q 165.14 214.63 163.18 220.70 C 162.58 222.55 159.76 224.13 157.67 223.38 Q 155.57 222.62 154.84 220.55 Q 154.38 219.25 155.21 217.00 C 157.16 211.70 156.81 206.64 156.28 200.30 C 155.60 192.26 153.24 183.17 146.52 178.42 C 138.62 172.85 129.36 178.40 124.49 184.76 Q 123.93 185.49 115.35 197.10 C 107.50 207.73 95.32 208.08 83.63 204.11 Q 70.97 199.80 54.31 190.54 C 49.26 187.73 42.13 186.33 36.75 188.83 C 27.53 193.13 24.94 204.72 27.02 214.02 C 28.04 218.53 23.52 221.28 20.12 218.08 C 18.28 216.35 17.97 213.91 17.29 211.76 Q 14.18 201.98 15.62 193.63 Q 18.52 176.78 30.25 162.28 Q 31.67 160.52 41.88 150.84 C 53.48 139.86 64.30 126.35 70.26 111.02 Q 73.45 102.84 72.75 93.99 Q 72.74 93.84 72.92 93.75 L 72.93 93.75 Q 73.11 93.66 73.17 93.91 Q 74.31 98.76 74.41 100.22 Q 75.13 111.34 71.94 122.21 Q 69.10 131.92 64.32 145.07 C 62.65 149.67 60.30 157.65 62.70 161.24 Q 63.31 162.16 63.43 161.06 Q 65.37 142.26 78.37 127.87 Q 89.94 115.06 93.88 110.40 Q 102.38 100.37 107.34 88.38 C 110.75 80.13 110.94 71.50 107.91 63.07 C 105.97 57.65 103.75 51.71 103.90 46.02 Q 104.06 40.11 108.50 34.57 A 0.31 0.05 21.5 0 1 108.79 34.63 L 109.08 34.72 Q 109.13 34.74 109.07 34.83 Q 105.67 40.65 107.56 47.20 C 109.57 54.18 113.44 60.09 117.33 66.09 Q 121.17 72.01 122.33 74.75 Q 126.92 85.58 126.12 95.24 Q 125.12 107.32 119.74 116.77 C 112.22 129.97 105.65 142.25 104.30 155.65 Q 103.68 161.77 106.18 156.15 Q 109.88 147.81 118.57 141.58 Q 127.00 135.53 127.31 135.30 Q 133.11 131.13 135.36 128.24 C 140.89 121.15 140.98 112.87 139.75 103.67 Q 139.01 98.15 137.45 93.27 Q 135.80 88.10 138.60 92.75 Q 147.97 108.31 147.95 126.74 Q 147.94 135.47 144.04 144.35 Q 143.16 146.36 140.29 150.59 Q 137.87 154.16 137.01 157.16 Q 136.86 157.69 137.20 157.26 Z",
  "M 114.36 135.31 C 117.54 130.01 123.19 122.13 126.50 115.60 C 129.02 110.64 130.59 104.84 131.65 99.00 Q 131.95 97.39 132.19 99.01 Q 133.59 108.19 132.40 116.22 C 130.94 126.01 122.59 130.52 114.91 135.83 Q 113.43 136.85 114.36 135.31 Z",
];

const STATUS_RING_CLASSES: Record<VerseLogoHairStatus, string> = {
  idle: "border-current opacity-80",
  listening: "border-verse-text opacity-100 animate-pulse",
  thinking: "border-verse-text-muted opacity-90",
  speaking: "border-verse-text opacity-100",
};

export interface VerseLogoHairIconProps {
  className?: string;
  withRing?: boolean;
  ringClassName?: string;
  size?: "sm" | "md" | "lg";
  status?: VerseLogoHairStatus;
  "aria-hidden"?: boolean;
}

const sizeClasses = {
  sm: "size-5",
  md: "size-8",
  lg: "size-12",
};

/**
 * Verse in-app logo-hair icon. Theme-aware via text-verse-text (currentColor).
 * Optional ring for status (idle/listening/thinking/speaking).
 */
export function VerseLogoHairIcon({
  className,
  withRing = false,
  ringClassName,
  size = "md",
  status = "idle",
  "aria-hidden": ariaHidden = true,
}: VerseLogoHairIconProps) {
  const iconSize = sizeClasses[size];
  const ringStyles = withRing
    ? cn(
        "rounded-full border-2 flex items-center justify-center",
        ringClassName ?? STATUS_RING_CLASSES[status]
      )
    : null;

  const svg = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 181 256"
      preserveAspectRatio="xMidYMid meet"
      className={cn(
        "shrink-0 text-verse-text",
        withRing ? "h-full w-full" : cn(iconSize, className)
      )}
      fill="currentColor"
      aria-hidden={ariaHidden}
    >
      {LOGO_HAIR_PATHS.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );

  if (withRing) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center text-verse-text",
          ringStyles,
          size === "sm" && "size-7",
          size === "md" && "size-10",
          size === "lg" && "size-14",
          className
        )}
        data-status={status}
      >
        {svg}
      </span>
    );
  }

  return svg;
}
