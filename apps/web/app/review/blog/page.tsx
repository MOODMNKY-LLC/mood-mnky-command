import Link from "next/link"

const SAMPLE_POSTS = [
  {
    title: "Sample: scent families at a glance",
    summary: "Illustrative post — not from live CMS.",
  },
  {
    title: "Sample: layering kindred notes",
    summary: "Placeholder for community storytelling in preview.",
  },
] as const

export default function ReviewBlogPage() {
  return (
    <div className="mx-auto w-full max-w-lg space-y-4 p-4 md:p-8">
      <p className="text-xs text-muted-foreground">
        Illustrative blog index — live Dojo blog remains an intended sign-in
        gate when auth is configured.{" "}
        <Link href="/review" className="underline underline-offset-2">
          Review hub
        </Link>
      </p>
      <h1 className="text-2xl font-semibold">Blog (sample)</h1>
      <ul className="space-y-3">
        {SAMPLE_POSTS.map((post) => (
          <li
            key={post.title}
            className="rounded-xl border border-dashed border-border px-4 py-3"
          >
            <p className="font-medium">{post.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{post.summary}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
