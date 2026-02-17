"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";
import { VerseCard, VerseCardContent } from "@/components/verse/ui/card";
import { ArrowRightIcon } from "@radix-ui/react-icons";
import type { LucideIcon } from "lucide-react";

interface VersePortalCardProps {
  name: string;
  description: string;
  href: string;
  cta: string;
  Icon: LucideIcon | ComponentType<{ className?: string }>;
  className?: string;
}

export function VersePortalCard({
  name,
  description,
  href,
  cta,
  Icon,
  className,
}: VersePortalCardProps) {
  return (
    <Link href={href} className="block">
      <VerseCard
        className={cn(
          "group relative h-full overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:opacity-95 hover:shadow-md",
          className
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-verse-text/[0.05] to-transparent" />
        <VerseCardContent className="relative flex flex-col justify-between gap-4 p-5">
          <div className="flex flex-col gap-2">
            <Icon className="h-12 w-12 text-verse-text-muted" />
            <h3 className="font-verse-heading text-xl font-semibold text-verse-text">
              {name}
            </h3>
            <p className="text-sm text-verse-text-muted">{description}</p>
          </div>
          <span className="inline-flex items-center text-sm font-medium text-verse-text">
            {cta}
            <ArrowRightIcon className="ms-2 h-4 w-4 rtl:rotate-180" />
          </span>
        </VerseCardContent>
      </VerseCard>
    </Link>
  );
}
