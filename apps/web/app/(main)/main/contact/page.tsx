import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MainNav, MainContactForm, MainFooter } from "@/components/main"

export const metadata = {
  title: "Contact – MOOD MNKY",
  description: "Get in touch with MOOD MNKY.",
}

export default function MainContactPage() {
  return (
    <>
      <MainNav />

      <main className="main-container py-12 md:py-16">
        <div className="mx-auto max-w-2xl space-y-12">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Contact
            </h1>
            <p className="mt-4 text-muted-foreground">
              Reach out via the form below, or connect in the MNKY VERSE
              community. Questions about fragrances, orders, or the MNKY
              ecosystem—we&apos;re here.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <Button asChild>
                <Link href="/dojo">Go to MNKY VERSE</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dojo/community">Community</Link>
              </Button>
            </div>
          </div>
          <MainContactForm />
        </div>
      </main>

      <MainFooter />
    </>
  )
}
