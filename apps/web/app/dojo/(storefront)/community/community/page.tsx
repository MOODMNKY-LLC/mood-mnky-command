import Link from "next/link";
import { Users, MessageCircle, BookOpen, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISCORD_INVITE_URL =
  process.env.NEXT_PUBLIC_DISCORD_INVITE_URL ?? ""

export default function VerseCommunityPage() {
  return (
    <div className="verse-container mx-auto max-w-[var(--verse-page-width)] px-4 py-16 md:px-6">
      <div className="mx-auto max-w-lg text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-verse-button/10 p-6">
            <Users className="h-16 w-16 text-verse-button" />
          </div>
        </div>
        <h1 className="font-verse-heading text-2xl font-semibold text-verse-text">
          Community
        </h1>
        <p className="mt-3 text-verse-text-muted">
          Forums, events, and collaborative projects. Join us for wellness
          discussions and fragrance discovery.
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          {DISCORD_INVITE_URL ? (
            <Button asChild variant="default" size="lg">
              <Link
                href={DISCORD_INVITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                <MessageCircle className="h-5 w-5" />
                Join Discord
              </Link>
            </Button>
          ) : (
            <p className="text-sm text-verse-text-muted">
              Discord community coming soon. Set NEXT_PUBLIC_DISCORD_INVITE_URL to enable.
            </p>
          )}
          <Button asChild variant="outline" size="lg">
            <Link href="/dojo/blog" className="inline-flex items-center gap-2">
              <Newspaper className="h-5 w-5" />
              MNKY DOJO Blog
            </Link>
          </Button>
        </div>

        <div className="mt-12 rounded-xl border border-verse-text/10 bg-verse-text/5 p-6 text-left">
          <h2 className="font-verse-heading text-lg font-semibold text-verse-text">
            Community touchpoints
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-verse-text-muted">
            <li className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 shrink-0 text-verse-button" />
              Discord — start in #welcome-and-rules; link your account for quests and drops
            </li>
            <li className="flex items-center gap-2">
              <Newspaper className="h-4 w-4 shrink-0 text-verse-button" />
              MNKY DOJO Blog — stories, guides, and insights
            </li>
            <li className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 shrink-0 text-verse-button" />
              Store blog — product updates and new collections
            </li>
          </ul>
        </div>

        <Button asChild variant="ghost" className="mt-8">
          <Link href="/dojo">Back to Portal</Link>
        </Button>
      </div>
    </div>
  );
}
