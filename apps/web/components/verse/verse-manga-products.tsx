import Link from "next/link";
import { VerseProductCard } from "@/components/verse/product-card";
import { Button } from "@/components/ui/button";
import { BlurFade } from "@/components/ui/blur-fade";

type ProductCardProduct = Parameters<typeof VerseProductCard>[0]["product"];

type VerseMangaProductsProps = {
  products: ProductCardProduct[];
};

export function VerseMangaProducts({ products }: VerseMangaProductsProps) {
  if (products.length === 0) return null;

  return (
    <BlurFade delay={0.14} inView inViewMargin="-20px">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-verse-heading text-xl font-semibold text-verse-text">
            From the story
          </h2>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-verse-text"
          >
            <Link href="/dojo/issues">Read the manga</Link>
          </Button>
        </div>
        <p className="mb-4 text-sm text-verse-text-muted">
          Collect the fragrances behind our manga chapters.
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {products.map((product) => (
            <VerseProductCard
              key={product.id}
              product={product}
            />
          ))}
        </div>
      </section>
    </BlurFade>
  );
}
