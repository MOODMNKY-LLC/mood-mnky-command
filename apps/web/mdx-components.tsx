import type { MDXComponents } from "mdx/types"
import Link from "next/link"

/**
 * Rewrite internal doc links: ./ASSET-AND-CDN-ARCHITECTURE.md -> /docs/asset-and-cdn-architecture
 */
function rewriteDocHref(href: string): string | null {
  if (!href || typeof href !== "string") return null
  const trimmed = href.trim()
  if (!trimmed.startsWith("./") && !trimmed.startsWith("../")) return null
  const match = trimmed.match(/(?:\.\/|\.\.\/)([^?#]+\.(?:md|mdx))(?:\?.*)?$/i)
  if (!match) return null
  const filename = match[1]
  const slug = filename
    .replace(/\.(md|mdx)$/i, "")
    .toLowerCase()
    .replace(/_/g, "-")
  return `/docs/${slug}`
}

const components: MDXComponents = {
  a: ({ href, children, ...props }) => {
    const docHref = href ? rewriteDocHref(href) : null
    if (docHref) {
      return (
        <Link href={docHref} {...props}>
          {children}
        </Link>
      )
    }
    const isExternal = href?.startsWith("http")
    if (isExternal) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
          {children}
        </a>
      )
    }
    return <a href={href} {...props}>{children}</a>
  },
}

export function useMDXComponents(componentOverrides?: MDXComponents): MDXComponents {
  return {
    ...components,
    ...componentOverrides,
  }
}
