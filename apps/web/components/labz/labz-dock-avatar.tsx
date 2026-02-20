"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const LABZ_DOCK_CANONICAL_SIZE_PX = 64;

export interface LabzDockAvatarProps {
  src: string;
  alt: string;
  /** Diameter in px; default LABZ_DOCK_CANONICAL_SIZE_PX. Use same as status ring/persona for aligned circumference. */
  size?: number;
  /** Optional fallback when image fails (e.g. initials). */
  fallback?: React.ReactNode;
  className?: string;
}

/**
 * Avatar circle aligned to the dock canonical diameter. Renders a circle with the same
 * circumference as the Persona and status ring so all three align.
 */
export function LabzDockAvatar({
  src,
  alt,
  size = LABZ_DOCK_CANONICAL_SIZE_PX,
  fallback,
  className,
}: LabzDockAvatarProps) {
  return (
    <Avatar
      className={cn("shrink-0 overflow-hidden rounded-full", className)}
      style={{ width: size, height: size }}
    >
      <AvatarImage asChild>
        <Image
          src={src}
          alt={alt}
          width={size}
          height={size}
          className="aspect-square object-cover"
        />
      </AvatarImage>
      {fallback != null && <AvatarFallback>{fallback}</AvatarFallback>}
    </Avatar>
  );
}
