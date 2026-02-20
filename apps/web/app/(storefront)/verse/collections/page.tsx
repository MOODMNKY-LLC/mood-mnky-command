import Link from "next/link";
import { headers } from "next/headers";
import { storefrontFetch } from "@/lib/shopify/storefront-client";
import { COLLECTIONS_QUERY } from "@/lib/shopify/storefront-queries";
import { Card, CardHeader } from "@/components/ui/card";

export default async function VerseCollectionsPage() {
  const h = await headers();
  let data: {
    collections?: {
      edges?: Array<{
        node: {
          id: string;
          title: string;
          handle: string;
          image?: { url: string; altText?: string } | null;
        };
      }>;
    };
  } = {};

  try {
    data = await storefrontFetch<typeof data>(COLLECTIONS_QUERY, { first: 50 }, { headers: h });
  } catch (e) {
    console.error("Verse collections fetch error:", e);
  }

  const collections = data?.collections?.edges?.map((e) => e.node) ?? [];

  return (
    <div className="verse-container mx-auto max-w-[var(--verse-page-width)] space-y-6 px-4 py-8 md:px-6 md:py-10">
      <header>
        <h1 className="font-verse-heading text-3xl font-bold tracking-tight text-verse-text">
          Collections
        </h1>
        <p className="text-verse-text-muted">Browse by collection</p>
      </header>

      {collections.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {collections.map((col) => (
            <Link key={col.id} href={`/verse/collections/${col.handle}`}>
              <Card className="overflow-hidden glass-panel transition-opacity hover:opacity-95">
                <div className="relative aspect-square w-full overflow-hidden bg-verse-text/5">
                  {col.image?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={col.image.url}
                      alt={col.image.altText || col.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-verse-text-muted">
                      No image
                    </div>
                  )}
                </div>
                <CardHeader className="p-4">
                  <h2 className="font-semibold line-clamp-2 text-verse-text">{col.title}</h2>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-verse-text/20 p-8 text-center text-verse-text-muted">
          No collections found. Create collections in Shopify Admin.
        </div>
      )}
    </div>
  );
}
