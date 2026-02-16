"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart, useMoney } from "@shopify/hydrogen-react";
import {
  VerseCard,
  VerseCardContent,
  VerseCardFooter,
  VerseCardHeader,
} from "@/components/verse/ui/card";
import { VerseButton } from "@/components/verse/ui/button";

type ProductCardProduct = {
  id: string;
  title: string;
  handle: string;
  featuredImage?: {
    url: string;
    altText?: string | null;
    width?: number;
    height?: number;
  } | null;
  priceRange?: {
    minVariantPrice?: {
      amount: string;
      currencyCode: string;
    } | null;
  } | null;
  variants?: {
    nodes: Array<{ id: string }>;
  } | null;
};

export function VerseProductCard({ product }: { product: ProductCardProduct }) {
  const variantId = product.variants?.nodes?.[0]?.id ?? null;
  const price = product.priceRange?.minVariantPrice;

  return (
    <VerseCard className="overflow-hidden transition-opacity hover:opacity-95">
      <Link href={`/verse/products/${product.handle}`}>
        <VerseCardHeader className="p-0">
          <div className="relative aspect-square w-full overflow-hidden bg-verse-text/5">
            {product.featuredImage?.url ? (
              <Image
                src={product.featuredImage.url}
                alt={product.featuredImage.altText || product.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-verse-text-muted">
                No image
              </div>
            )}
          </div>
        </VerseCardHeader>
        <VerseCardContent className="p-4">
          <h3 className="font-verse-heading font-semibold line-clamp-2 text-verse-text">
            {product.title}
          </h3>
          {price && (
            <VersePrice
              amount={price.amount}
              currencyCode={price.currencyCode}
            />
          )}
        </VerseCardContent>
      </Link>
      <VerseCardFooter className="flex gap-2 p-4 pt-0">
        {variantId ? (
          <AddToCartButton variantId={variantId} />
        ) : (
          <VerseButton
            variant="outline"
            size="sm"
            className="w-full"
            disabled
          >
            Unavailable
          </VerseButton>
        )}
      </VerseCardFooter>
    </VerseCard>
  );
}

function AddToCartButton({ variantId }: { variantId: string }) {
  const { linesAdd, status } = useCart();
  const isLoading = status === "Adding line" || status === "Updating line";

  return (
    <VerseButton
      variant="default"
      size="sm"
      className="w-full"
      disabled={isLoading}
      onClick={() =>
        linesAdd([
          {
            merchandiseId: variantId,
            quantity: 1,
          },
        ])
      }
    >
      {isLoading ? "Adding…" : "Add to cart"}
    </VerseButton>
  );
}

function VersePrice({
  amount,
  currencyCode,
}: {
  amount: string;
  currencyCode: string;
}) {
  const money = { amount, currencyCode };
  const { formatted } = useMoney(money);
  return (
    <span className="text-sm font-medium text-verse-text">{formatted}</span>
  );
}
