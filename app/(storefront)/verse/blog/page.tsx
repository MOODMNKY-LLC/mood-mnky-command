import Link from "next/link";
import Image from "next/image";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { BlurFade } from "@/components/ui/blur-fade";
import { ArrowRight, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getBlogCoverUrl } from "@/lib/verse-blog";
import { BlogAuthorCard } from "@/components/verse/blog-author-card";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function VerseBlogPage() {
  const supabase = await createClient();
  const { data: posts, error } = await supabase
    .from("verse_blog_posts")
    .select("id, title, slug, excerpt, published_at, created_at, cover_url, author_agent")
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="verse-container mx-auto max-w-[var(--verse-page-width)] px-4 py-8 md:px-6">
        <p className="text-verse-text-muted">Unable to load posts. Please try again later.</p>
      </div>
    );
  }

  const displayPosts = posts ?? [];

  return (
    <div className="verse-container mx-auto max-w-[var(--verse-page-width)] px-4 py-8 md:px-6">
      <div className="mb-8">
        <h1 className="font-verse-heading text-2xl font-semibold text-verse-text md:text-3xl">
          MNKY VERSE Blog
        </h1>
        <p className="mt-2 text-verse-text-muted">
          Stories, guides, and insights from the universe of scents.
        </p>
      </div>

      {displayPosts.length === 0 ? (
        <p className="text-verse-text-muted">
          No posts yet. Check back soon for stories and guides.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
          {displayPosts.map((post, i) => (
            <BlurFade key={post.id} delay={0.05 * i} inView inViewMargin="-20px">
              <Link href={`/verse/blog/${post.slug}`} className="group block">
                <Card className="glass-panel h-full overflow-hidden transition-all hover:border-verse-text/30 hover:shadow-lg">
                  {getBlogCoverUrl(post.cover_url, post.author_agent) ? (
                    <div className="relative aspect-video w-full shrink-0 bg-verse-text/5">
                      <Image
                        src={getBlogCoverUrl(post.cover_url, post.author_agent)!}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 50vw"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-video w-full shrink-0 items-center justify-center bg-verse-text/10 text-2xl font-semibold uppercase text-verse-text/50">
                      {post.title?.[0] ?? "?"}
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-verse-text-muted">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(post.published_at ?? post.created_at)}
                      </span>
                      {post.author_agent && (
                        <BlogAuthorCard agent={post.author_agent} compact />
                      )}
                    </div>
                    <h2 className="font-verse-heading text-lg font-semibold text-verse-text transition-colors group-hover:text-verse-button">
                      {post.title}
                    </h2>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="line-clamp-2 text-sm text-verse-text-muted">
                      {post.excerpt || "Read more..."}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-verse-button">
                      Read more
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            </BlurFade>
          ))}
        </div>
      )}
    </div>
  );
}
