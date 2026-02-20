"use client";

import { useState } from "react";
import Image from "next/image";
import { useCart, useMoney } from "@shopify/hydrogen-react";
import {
  VerseCard,
  VerseCardContent,
} from "@/components/verse/ui/card";
import { VerseButton } from "@/components/verse/ui/button";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  selectedOptions: Array<{ name: string; value: string }>;
  price: { amount: string; currencyCode: string };
  image?: { url: string; altText?: string | null } | null;
};

type ProductDetailProduct = {
  id: string;
  title: string;
  handle: string;
  description?: string | null;
  featuredImage?: { url: string; altText?: string | null; width?: number; height?: number } | null;
  images?: { nodes: Array<{ url: string; altText?: string | null }> } | null;
  options?: Array<{ name: string; values: string[] }> | null;
  variants?: { nodes: ProductVariant[] } | null;
  priceRange?: { minVariantPrice?: { amount: string; currencyCode: string } | null } | null;
};

export function VerseProductDetail({ product }: { product: ProductDetailProduct }) {
  const variants = product.variants?.nodes ?? [];
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    variants[0] ?? null
  );
  const currentVariant = selectedVariant ?? variants[0];
  const images = product.images?.nodes ?? [];
  const displayImage = currentVariant?.image ?? product.featuredImage;
  const imageUrl = displayImage?.url ?? images[0]?.url ?? product.featuredImage?.url;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <VerseCard className="overflow-hidden">
        <div className="relative aspect-square w-full overflow-hidden bg-verse-text/5">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={displayImage?.altText || product.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-verse-text-muted">
              No image
            </div>
          )}
        </div>
      </VerseCard>

      <div className="space-y-4">
        <div>
          <h1 className="font-verse-heading text-2xl font-bold tracking-tight text-verse-text">
            {product.title}
          </h1>
          {currentVariant && (
            <VersePrice
              amount={currentVariant.price.amount}
              currencyCode={currentVariant.price.currencyCode}
            />
          )}
        </div>

        {product.description && (
          <p className="whitespace-pre-wrap text-verse-text-muted">{product.description}</p>
        )}

        {variants.length > 1 && product.options && (
          <div className="space-y-2">
            {product.options.map((opt) => (
              <div key={opt.name} className="space-y-1">
                <label className="text-sm font-medium text-verse-text">{opt.name}</label>
                <Select
                  value={currentVariant?.id}
                  onValueChange={(id) => {
                    const v = variants.find((x) => x.id === id);
                    if (v) setSelectedVariant(v);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${opt.name}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {variants.map((v) => (
                      <SelectItem
                        key={v.id}
                        value={v.id}
                        disabled={!v.availableForSale}
                      >
                        {v.title}
                        {!v.availableForSale && " (Unavailable)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}

        {currentVariant && (
          <VerseAddToCartButton
            variantId={currentVariant.id}
            disabled={!currentVariant.availableForSale}
            size="lg"
            useShimmer
          />
        )}
      </div>
    </div>
  );
}

function VersePrice({
  amount,
  currencyCode,
}: {
  amount: string;
  currencyCode: string;
}) {
  const { formatted } = useMoney({ amount, currencyCode });
  return <p className="text-lg font-semibold text-verse-text">{formatted}</p>;
}

function VerseAddToCartButton({
  variantId,
  disabled,
  size = "sm",
  useShimmer = false,
}: {
  variantId: string;
  disabled?: boolean;
  size?: "sm" | "default" | "lg";
  useShimmer?: boolean;
}) {
  const { linesAdd, status } = useCart();
  const isLoading = status === "Adding line" || status === "Updating line";
  const isDisabled = disabled || isLoading;

  const sizeClass = size === "lg" ? "px-6 py-3" : size === "default" ? "px-4 py-2" : "px-3 py-1.5";

  if (useShimmer && !disabled) {
    return (
      <ShimmerButton
        background="var(--verse-button)"
        shimmerColor="rgba(255,255,255,0.4)"
        className={`w-full ${sizeClass} text-verse-button-text`}
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
      </ShimmerButton>
    );
  }

  return (
    <VerseButton
      size={size}
      className="w-full"
      disabled={isDisabled}
      onClick={() =>
        linesAdd([
          {
            merchandiseId: variantId,
            quantity: 1,
          },
        ])
      }
    >
      {isLoading ? "Adding…" : disabled ? "Unavailable" : "Add to cart"}
    </VerseButton>
  );
}
