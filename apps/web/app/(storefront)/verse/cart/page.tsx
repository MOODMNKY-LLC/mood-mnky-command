import Link from "next/link";
import { VerseCartContent } from "@/components/verse/cart-content";
import { Button } from "@/components/ui/button";

export default function VerseCartPage() {
  return (
    <div className="verse-container mx-auto max-w-2xl space-y-6 px-4 py-8 md:px-6 md:py-10">
      <header className="flex items-center justify-between">
        <h1 className="font-verse-heading text-3xl font-bold tracking-tight text-verse-text">
          Cart
        </h1>
        <Button variant="outline" size="sm" asChild className="border-verse-text/20 text-verse-text">
          <Link href="/verse/products">Continue shopping</Link>
        </Button>
      </header>

      <VerseCartContent />
    </div>
  );
}
