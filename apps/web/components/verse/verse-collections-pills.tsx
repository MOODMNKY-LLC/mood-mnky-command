import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/card";
import { BlurFade } from "@/components/ui/blur-fade";

type Collection = {
  id: string;
  title: string;
  handle: string;
  image?: { url: string; altText?: string | null } | null;
};

type VerseCollectionsPillsProps = {
  collections: Collection[];
  maxItems?: number;
};

export function VerseCollectionsPills({
  collections,
  maxItems = 6,
}: VerseCollectionsPillsProps) {
  const items = collections.slice(0, maxItems);

  if (items.length === 0) return null;

  return (
    <BlurFade delay={0.12} inView inViewMargin="-20px">
      <section>
        <h2 className="font-verse-heading mb-3 text-lg font-semibold text-verse-text">
          Shop by collection
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((col) => (
            <Link
              key={col.id}
              href={`/dojo/products?collection=${encodeURIComponent(col.handle)}`}
            >
              <Card className="overflow-hidden glass-panel transition-opacity hover:opacity-95">
                <div className="relative aspect-square w-full overflow-hidden bg-verse-text/5">
                  {col.image?.url ? (
                    <img
                      src={col.image.url}
                      alt={col.image.altText || col.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-verse-text-muted text-sm">
                      No image
                    </div>
                  )}
                </div>
                <CardHeader className="p-2">
                  <h3 className="line-clamp-2 text-sm font-medium text-verse-text">
                    {col.title}
                  </h3>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </BlurFade>
  );
}
