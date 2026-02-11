import { notFound } from "next/navigation"
import { MDXRemote } from "next-mdx-remote/rsc"
import remarkGfm from "remark-gfm"
import rehypeSlug from "rehype-slug"
import { getDocBySlug, getDocSlugs } from "@/lib/docs"
import { getDocComponents } from "@/components/docs/doc-components"

interface DocPageProps {
  params: Promise<{ slug: string }>
}

export default async function AdminDocPage({ params }: DocPageProps) {
  const { slug } = await params
  const doc = getDocBySlug(slug, "admin")

  if (!doc) notFound()

  const components = getDocComponents("/docs/admin")

  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <MDXRemote
          source={doc.content}
          options={{
            mdxOptions: {
              remarkPlugins: [remarkGfm],
              rehypePlugins: [rehypeSlug],
            },
          }}
          components={components}
        />
      </div>
    </article>
  )
}

export function generateStaticParams() {
  return getDocSlugs("admin").map((slug) => ({ slug }))
}
