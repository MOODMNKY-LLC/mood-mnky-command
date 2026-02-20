import type { MDXComponents } from "mdx/types"
import Link from "next/link"

/**
 * Rewrite internal doc links to the correct base path.
 * Handles: ./ASSET-AND-CDN-ARCHITECTURE.md, ../admin/foo.md, docs/SUPABASE-...
 */
function createDocLink(basePath: string) {
  return function DocLink({
    href,
    children,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
    if (!href || typeof href !== "string") {
      return <a href={href} {...props}>{children}</a>
    }

    const trimmed = href.trim()

    // Relative .md/.mdx links: ./FOO.md, ../FOO.md, ../admin/FOO.md, ../guide/FOO.md
    const relativeMatch = trimmed.match(
      /(?:\.\/|\.\.\/)(?:(?:admin|guide)\/)?([^?#]+\.(?:md|mdx))(?:\?.*)?$/i
    )
    if (relativeMatch) {
      const filename = relativeMatch[1]
      const slug = filename
        .replace(/\.(md|mdx)$/i, "")
        .toLowerCase()
        .replace(/_/g, "-")
      // If link has ../admin/ or ../guide/, use that base; else use current basePath
      const pathMatch = trimmed.match(/\.\.\/(admin|guide)\//i)
      const targetBase = pathMatch
        ? `/docs/${pathMatch[1].toLowerCase()}`
        : basePath
      return (
        <Link href={`${targetBase}/${slug}`} {...props}>
          {children}
        </Link>
      )
    }

    // docs/... style links: docs/ASSET-AND-CDN-ARCHITECTURE.md
    const docsMatch = trimmed.match(/docs\/(?:admin\/)?([^?#]+\.(?:md|mdx))(?:\?.*)?$/i)
    if (docsMatch) {
      const filename = docsMatch[1]
      const slug = filename
        .replace(/\.(md|mdx)$/i, "")
        .toLowerCase()
        .replace(/_/g, "-")
      return (
        <Link href={`${basePath}/${slug}`} {...props}>
          {children}
        </Link>
      )
    }

    const isExternal = href.startsWith("http")
    if (isExternal) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
          {children}
        </a>
      )
    }
    return <a href={href} {...props}>{children}</a>
  }
}

export function getDocComponents(basePath: string): MDXComponents {
  const DocLink = createDocLink(basePath)
  return {
    a: DocLink as MDXComponents["a"],
  }
}
