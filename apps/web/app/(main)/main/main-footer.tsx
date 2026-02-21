import Link from "next/link"

export function MainFooter() {
  return (
    <footer className="main-container border-t py-8" role="contentinfo">
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <Link
          href="/main"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          MOOD MNKY
        </Link>
        <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
          <Link href="/main/about" className="hover:text-foreground">
            About
          </Link>
          <Link href="/verse" className="hover:text-foreground">
            MNKY VERSE
          </Link>
          <Link href="/verse/blog" className="hover:text-foreground">
            Blog
          </Link>
          <a
            href="https://docs.moodmnky.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
          >
            Docs
          </a>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} MOOD MNKY. Fragrance, Community,
        Innovation.
      </p>
    </footer>
  )
}
