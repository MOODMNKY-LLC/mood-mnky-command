import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { storefrontFetch } from "@/lib/shopify/storefront-client";
import { PRODUCT_BY_HANDLE_QUERY } from "@/lib/shopify/storefront-queries";
import { VerseProductDetail } from "@/components/verse/product-detail";
import { Button } from "@/components/ui/button";

export default async function VerseProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const h = await headers();

  let data: { productByHandle?: unknown } = {};
  try {
    data = await storefrontFetch<typeof data>(PRODUCT_BY_HANDLE_QUERY, { handle }, { headers: h });
  } catch (e) {
    console.error("Verse product fetch error:", e);
  }

  const product = data?.productByHandle;
  if (!product) {
    notFound();
  }

  return (
    <div className="verse-container mx-auto max-w-[var(--verse-page-width)] space-y-6 px-4 py-8 md:px-6 md:py-10">
      <div className="flex items-center gap-2 text-sm text-verse-text-muted">
        <Link href="/verse" className="hover:text-verse-text">
          MNKY VERSE
        </Link>
        <span>/</span>
        <Link href="/verse/products" className="hover:text-verse-text">
          Products
        </Link>
        <span>/</span>
        <span className="text-verse-text">{handle}</span>
      </div>

      <VerseProductDetail product={product as Parameters<typeof VerseProductDetail>[0]["product"]} />

      <Button variant="outline" size="sm" asChild className="border-verse-text/20 text-verse-text">
        <Link href="/verse/products">Back to products</Link>
      </Button>
    </div>
  );
}
