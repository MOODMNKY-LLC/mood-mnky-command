import Link from "next/link";
import { headers } from "next/headers";
import { storefrontFetch } from "@/lib/shopify/storefront-client";
import { PRODUCTS_QUERY } from "@/lib/shopify/storefront-queries";
import { VerseProductCard } from "@/components/verse/product-card";
import { Button } from "@/components/ui/button";

export default async function VerseProductsPage() {
  const h = await headers();
  let data: {
    products?: {
      pageInfo?: { hasNextPage?: boolean; endCursor?: string };
      edges?: Array<{ node: unknown }>;
    };
  } = {};

  try {
    data = await storefrontFetch<typeof data>(PRODUCTS_QUERY, { first: 24 }, { headers: h });
  } catch (e) {
    console.error("Verse products fetch error:", e);
  }

  const products = data?.products?.edges?.map((e) => e.node) ?? [];
  const hasNextPage = data?.products?.pageInfo?.hasNextPage ?? false;
  const endCursor = data?.products?.pageInfo?.endCursor;

  return (
    <div className="verse-container mx-auto max-w-[var(--verse-page-width)] space-y-6 px-4 py-8 md:px-6 md:py-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-verse-heading text-3xl font-bold tracking-tight text-verse-text">
            Products
          </h1>
          <p className="text-verse-text-muted">Browse all products</p>
        </div>
        <Button variant="outline" size="sm" asChild className="border-verse-text/20 text-verse-text">
          <Link href="/verse/cart">View cart</Link>
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
                <Link href={`/verse/products?cursor=${encodeURIComponent(endCursor)}`}>
                  Load more
                </Link>
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-lg border border-dashed border-verse-text/20 p-8 text-center text-verse-text-muted">
          No products found. Publish products to the Headless channel in Shopify Admin.
        </div>
      )}
    </div>
  );
}
