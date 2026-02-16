import Image from "next/image";
import {
  type VerseBlogAgent,
  AGENT_IMAGE_PATH,
  AGENT_DISPLAY_NAME,
  isVerseBlogAgent,
} from "@/lib/verse-blog";

export interface BlogAuthorCardProps {
  /** Agent id from verse_blog_posts.author_agent */
  agent: VerseBlogAgent | string | null;
  /** Override display name; defaults to AGENT_DISPLAY_NAME */
  name?: string;
  /** Optional tagline below name */
  tagline?: string;
  /** Compact layout for list cards */
  compact?: boolean;
}

export function BlogAuthorCard({
  agent,
  name,
  tagline,
  compact = false,
}: BlogAuthorCardProps) {
  if (!agent || !isVerseBlogAgent(agent)) return null;

  const displayName = name ?? AGENT_DISPLAY_NAME[agent];
  const src = AGENT_IMAGE_PATH[agent];

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-verse-text-muted">
        <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full bg-verse-text/10">
          <Image
            src={src}
            alt=""
            fill
            className="object-cover"
            sizes="24px"
          />
        </div>
        <span className="text-xs font-medium text-verse-text-muted">
          By {displayName}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 rounded-lg border border-verse-text/10 bg-verse-text/5 p-4">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-verse-text/10">
        <Image
          src={src}
          alt=""
          fill
          className="object-cover"
          sizes="48px"
        />
      </div>
      <div>
        <p className="text-sm font-medium text-verse-text">By {displayName}</p>
        {tagline && (
          <p className="mt-0.5 text-xs text-verse-text-muted">{tagline}</p>
        )}
      </div>
    </div>
  );
}
