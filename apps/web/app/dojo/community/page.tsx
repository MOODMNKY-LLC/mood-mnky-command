import Link from "next/link";
import {
  MessageCircle,
  Newspaper,
  Trophy,
  BookMarked,
  Image,
  Users,
  ArrowLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const DISCORD_INVITE_URL =
  process.env.NEXT_PUBLIC_DISCORD_INVITE_URL ?? "";

export default function DojoCommunityPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dojo" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to Dojo
          </Link>
        </Button>
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Community hub</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Discord, blog, quests, manga, and more. Your gateway to the MNKY VERSE community.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DISCORD_INVITE_URL ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageCircle className="h-4 w-4" />
                Join Discord
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-3 text-sm">
                Chat, events, and exclusive drops with the community. Start in
                #welcome-and-rules, then explore MNKY VERSE and MNKY LABZ.
              </p>
              <Button asChild variant="default" size="sm">
                <a
                  href={DISCORD_INVITE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Join server
                </a>
              </Button>
            </CardContent>
          </Card>
        ) : null}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircle className="h-4 w-4" />
              Link Discord account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-3 text-sm">
              Connect your Discord to unlock quests and rewards.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/verse/auth/discord/link">Link account</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Newspaper className="h-4 w-4" />
              MNKY VERSE Blog
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-3 text-sm">
              Stories, guides, and insights from the MNKY VERSE.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/verse/blog" target="_blank" rel="noopener noreferrer">
                Open blog
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4" />
              Quests & XP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-3 text-sm">
              Complete quests to earn XP and level up.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/verse/quests" target="_blank" rel="noopener noreferrer">
                View quests
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookMarked className="h-4 w-4" />
              Manga & Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-3 text-sm">
              Read issues and chapters from the MNKY VERSE.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/verse/issues" target="_blank" rel="noopener noreferrer">
                Browse issues
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Image className="h-4 w-4" />
              UGC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-3 text-sm">
              Share your creations and get approved for rewards.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/verse/ugc" target="_blank" rel="noopener noreferrer">
                Go to UGC
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Community (Verse)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-3 text-sm">
              Full community page on the MNKY VERSE storefront.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/verse/community" target="_blank" rel="noopener noreferrer">
                Open in Verse
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
