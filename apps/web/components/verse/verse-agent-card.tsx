"use client";

import Image from "next/image";
import Link from "next/link";
import { MessageSquare, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { VerseCard, VerseCardContent } from "@/components/verse/ui/card";
import { VerseButton } from "@/components/verse/ui/button";
import { Badge } from "@/components/ui/badge";

export interface VerseAgentCardProps {
  slug: string;
  displayName: string;
  blurb: string | null;
  imagePath: string | null;
  openaiModel: string;
  openaiVoice: string;
  className?: string;
}

export function VerseAgentCard({
  slug,
  displayName,
  blurb,
  imagePath,
  openaiModel,
  openaiVoice,
  className,
}: VerseAgentCardProps) {
  const profileHref = `/verse/agents/${slug}`;
  const chatHref = "/verse/chat";
  const voiceHref = "/verse/chat?mode=voice";

  return (
    <VerseCard
      className={cn(
        "group relative overflow-hidden border border-[var(--verse-border)] transition-all duration-200 hover:-translate-y-1 hover:opacity-95 hover:shadow-md",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-verse-text/[0.05] to-transparent" />
      <VerseCardContent className="relative flex flex-col gap-0 p-0">
        <Link href={profileHref} className="block">
          <div className="relative aspect-square w-full overflow-hidden bg-verse-text/[0.03]">
            <Image
              src={imagePath ?? "/verse/mood-mnky-3d.png"}
              alt={displayName}
              fill
              className="object-contain object-center p-4 transition-opacity group-hover:opacity-95"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
        </Link>
        <div className="flex flex-col gap-2 p-5">
          <Link href={profileHref} className="group/link block">
            <h2 className="font-verse-heading text-xl font-semibold text-verse-text transition-colors group-hover/link:text-verse-button">
              {displayName}
            </h2>
          </Link>
          <p className="text-sm text-verse-text-muted line-clamp-2">
            {blurb ?? ""}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Badge
              variant="secondary"
              className="border-transparent bg-verse-text/10 text-verse-text hover:bg-verse-text/20"
            >
              {openaiModel}
            </Badge>
            <Badge
              variant="outline"
              className="border-[var(--verse-border)] text-verse-text-muted"
            >
              {openaiVoice}
            </Badge>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <VerseButton asChild size="sm">
              <Link href={profileHref}>View profile</Link>
            </VerseButton>
            <VerseButton variant="outline" size="sm" asChild>
              <Link href={chatHref} className="gap-1.5">
                <MessageSquare className="h-4 w-4" />
                Chat
              </Link>
            </VerseButton>
            <VerseButton variant="outline" size="sm" asChild>
              <Link href={voiceHref} className="gap-1.5">
                <Mic className="h-4 w-4" />
                Talk
              </Link>
            </VerseButton>
          </div>
        </div>
      </VerseCardContent>
    </VerseCard>
  );
}
