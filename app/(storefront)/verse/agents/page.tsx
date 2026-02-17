import Image from "next/image";
import Link from "next/link";
import {
  AGENT_IMAGE_PATH,
  AGENT_DISPLAY_NAME,
  VERSE_BLOG_AGENTS,
  type VerseBlogAgent,
} from "@/lib/verse-blog";
import { VerseCard, VerseCardContent } from "@/components/verse/ui/card";
import { VerseButton } from "@/components/verse/ui/button";

const AGENT_BLURB: Record<VerseBlogAgent, string> = {
  mood_mnky: "Your gateway to scents and mood—discovery and curation.",
  sage_mnky: "Learning, wellness, and thoughtful guidance.",
  code_mnky: "The tech behind the verse—creation and systems.",
};

export default function AgentsPage() {
  return (
    <div className="verse-container mx-auto max-w-[var(--verse-page-width)] px-4 py-10 md:px-6">
      <div className="space-y-8">
        <div>
          <h1 className="font-verse-heading text-3xl font-semibold tracking-tight text-verse-text md:text-4xl">
            Agents
          </h1>
          <p className="mt-2 text-verse-text-muted">
            Meet MOOD MNKY, SAGE MNKY, and CODE MNKY—your guides across the
            verse.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {VERSE_BLOG_AGENTS.map((agent) => (
            <VerseCard
              key={agent}
              className="overflow-hidden transition-opacity hover:opacity-95"
            >
              <VerseCardContent className="flex flex-col gap-4 p-0">
                <div className="relative aspect-square w-full overflow-hidden bg-verse-text/5">
                  <Image
                    src={AGENT_IMAGE_PATH[agent]}
                    alt={AGENT_DISPLAY_NAME[agent]}
                    fill
                    className="object-contain object-center p-4"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="flex flex-col gap-2 p-5 pt-0">
                  <h2 className="font-verse-heading text-xl font-semibold text-verse-text">
                    {AGENT_DISPLAY_NAME[agent]}
                  </h2>
                  <p className="text-sm text-verse-text-muted">
                    {AGENT_BLURB[agent]}
                  </p>
                  <VerseButton variant="outline" size="sm" asChild className="mt-2 w-fit">
                    <Link href="/verse/chat">Chat</Link>
                  </VerseButton>
                </div>
              </VerseCardContent>
            </VerseCard>
          ))}
        </div>
      </div>
    </div>
  );
}
