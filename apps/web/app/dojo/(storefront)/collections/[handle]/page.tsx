import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { storefrontFetch } from "@/lib/shopify/storefront-client";
import { COLLECTION_BY_HANDLE_QUERY } from "@/lib/shopify/storefront-queries";
import { VerseProductCard } from "@/components/verse/product-card";
import { Button } from "@/components/ui/button";

export default async function VerseCollectionPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const h = await headers();

  let data: {
    collectionByHandle?: {
      id: string;
      title: string;
      handle: string;
      description?: string | null;
      image?: { url: string; altText?: string } | null;
      products?: {
        pageInfo?: { hasNextPage?: boolean; endCursor?: string };
        edges?: Array<{ node: unknown }>;
      };
    };
  } = {};

  try {
    data = await storefrontFetch<typeof data>(COLLECTION_BY_HANDLE_QUERY, {
      handle,
      first: 24,
    }, { headers: h });
  } catch (e) {
    console.error("Verse collection fetch error:", e);
  }

  const collection = data?.collectionByHandle;
  if (!collection) {
    notFound();
  }

  const products = collection?.products?.edges?.map((e) => e.node) ?? [];
  const hasNextPage = collection?.products?.pageInfo?.hasNextPage ?? false;
  const endCursor = collection?.products?.pageInfo?.endCursor;

  return (
    <div className="verse-container mx-auto max-w-[var(--verse-page-width)] space-y-6 px-4 py-8 md:px-6 md:py-10">
      <div className="flex items-center gap-2 text-sm text-verse-text-muted">
        <Link href="/dojo" className="hover:text-verse-text">
          MNKY DOJO
        </Link>
        <span>/</span>
        <Link href="/dojo/collections" className="hover:text-verse-text">
          Collections
        </Link>
        <span>/</span>
        <span className="text-verse-text">{collection.title}</span>
      </div>

      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-verse-heading text-3xl font-bold tracking-tight text-verse-text">
            {collection.title}
          </h1>
          {collection.description && (
            <p className="mt-1 text-verse-text-muted">{collection.description}</p>
          )}
        </div>
        <Button variant="outline" size="sm" asChild className="border-verse-text/20 text-verse-text">
          <Link href="/dojo/cart">View cart</Link>
        </Button>
      </header>

      {products.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {products.map((product: { id: string; handle: string }) => (
              <VerseProductCard
                key={product.id}
                product={product as Parameters<typeof VerseProductCard>[0]["product"]}
              />
            ))}
          </div>
          {hasNextPage && endCursor && (
            <div className="flex justify-center">
              <Button variant="outline" asChild className="border-verse-text/20 text-verse-text">
                <Link
                  href={`/dojo/collections/${handle}?cursor=${encodeURIComponent(endCursor)}`}
                >
                  Load more
                </Link>
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-verse-text/20 p-8 text-center text-verse-text-muted">
          No products in this collection.
        </div>
      )}
    </div>
  );
}
