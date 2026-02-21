import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MainFooter } from "../main-footer"

export const metadata = {
  title: "Contact – MOOD MNKY",
  description: "Get in touch with MOOD MNKY.",
}

export default function MainContactPage() {
  return (
    <>
      <header className="main-container border-b py-4">
        <nav className="flex items-center justify-between" aria-label="Main navigation">
          <Link href="/main" className="text-lg font-semibold text-foreground hover:text-primary">
            MOOD MNKY
          </Link>
          <div className="flex gap-4">
            <Link href="/main/about" className="text-sm text-muted-foreground hover:text-foreground">
              About
            </Link>
            <Link href="/main/contact" className="text-sm font-medium text-foreground">
              Contact
            </Link>
            <Link href="/verse" className="text-sm text-muted-foreground hover:text-foreground">
              MNKY VERSE
            </Link>
            <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground">
              Sign in
            </Link>
          </div>
        </nav>
      </header>

      <main className="main-container py-12 md:py-16">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Contact
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Reach out via the MNKY VERSE community or your preferred channel.
        </p>
        <Button asChild className="mt-6">
          <Link href="/verse">Go to MNKY VERSE</Link>
        </Button>
      </main>

      <MainFooter />
    </>
  )
}
