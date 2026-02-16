import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import "highlight.js/styles/github-dark.min.css";
import { createClient } from "@/lib/supabase/server";
import { getBlogCoverUrl } from "@/lib/verse-blog";
import { BlogAuthorCard } from "@/components/verse/blog-author-card";

export default async function VerseBlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: post, error } = await supabase
    .from("verse_blog_posts")
    .select("id, title, slug, content, published_at, created_at, cover_url, author_agent")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error || !post) notFound();

  const dateStr = post.published_at ?? post.created_at;

  return (
    <div className="verse-container mx-auto max-w-[var(--verse-page-width)] px-4 py-8 md:px-6">
      <Link
        href="/verse/blog"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-verse-text-muted transition-colors hover:text-verse-text"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Blog
      </Link>

      <article className="max-w-2xl">
        {getBlogCoverUrl(post.cover_url, post.author_agent) && (
          <div className="relative mb-6 aspect-video w-full overflow-hidden rounded-lg bg-verse-text/5">
            <Image
              src={getBlogCoverUrl(post.cover_url, post.author_agent)!}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 672px) 100vw, 672px"
              priority
            />
          </div>
        )}
        {dateStr && (
          <time
            dateTime={dateStr}
            className="text-sm text-verse-text-muted"
          >
            {new Date(dateStr).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        )}
        <h1 className="font-verse-heading mt-2 text-2xl font-semibold text-verse-text md:text-3xl">
          {post.title}
        </h1>
        {post.author_agent && (
          <div className="mt-4">
            <BlogAuthorCard agent={post.author_agent} tagline="MNKY VERSE" />
          </div>
        )}
        <div className="prose prose-sm prose-verse mt-6 max-w-none prose-p:text-verse-text-muted prose-headings:font-verse-heading prose-headings:text-verse-text prose-strong:text-verse-text prose-a:text-verse-button prose-pre:bg-verse-text/10 prose-pre:border prose-pre:border-verse-text/20 prose-blockquote:border-verse-button prose-blockquote:bg-verse-text/5 prose-blockquote:py-0.5 prose-blockquote:not-italic">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSlug, rehypeHighlight]}
          >
            {post.content || ""}
          </ReactMarkdown>
        </div>
      </article>
    </div>
  );
}
