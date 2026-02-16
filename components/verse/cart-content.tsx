"use client";

import Link from "next/link";
import Image from "next/image";
import {
  useCart,
  CartLineProvider,
  CartLineQuantity,
  CartLineQuantityAdjustButton,
  CartCost,
  CartCheckoutButton,
  Money,
} from "@shopify/hydrogen-react";
import {
  VerseCard,
  VerseCardContent,
  VerseCardHeader,
} from "@/components/verse/ui/card";
import { VerseButton } from "@/components/verse/ui/button";

export function VerseCartContent() {
  const { lines, status } = useCart();
  const lineCount = lines?.length ?? 0;

  if (status === "uninitialized" || status === "loading") {
    return (
      <div className="rounded-lg border border-dashed border-verse-text/20 p-8 text-center text-verse-text-muted">
        Loading cart...
      </div>
    );
  }

  if (!lines || lineCount === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-dashed border-verse-text/20 p-8 text-center text-verse-text-muted">
          Your cart is empty.
        </div>
        <VerseButton asChild>
          <Link href="/verse/products">Browse products</Link>
        </VerseButton>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {lines.map((line) => (
          <CartLineProvider key={line.id} line={line}>
            <VerseCartLineItem line={line} />
          </CartLineProvider>
        ))}
      </div>

      <VerseCard>
        <VerseCardHeader>
          <div className="flex items-center justify-between text-lg font-semibold text-verse-text">
            <span>Subtotal</span>
            <CartCost amountType="subtotal">
              {({ amount }) => <span>{amount}</span>}
            </CartCost>
          </div>
        </VerseCardHeader>
        <VerseCardContent>
          <CartCheckoutButton
            as={VerseButton}
            size="lg"
            className="w-full"
          >
            Checkout
          </CartCheckoutButton>
        </VerseCardContent>
      </VerseCard>
    </div>
  );
}

function VerseCartLineItem({ line }: { line: { id: string; merchandise?: { product?: { title?: string; handle?: string }; image?: { url?: string } | null }; cost?: { totalAmount?: { amount?: string; currencyCode?: string } } } }) {
  const product = line.merchandise?.product;
  const image = line.merchandise?.image;
  const cost = line.cost?.totalAmount;

  return (
    <VerseCard className="overflow-hidden">
      <div className="flex gap-4 p-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-verse-text/5">
          {image?.url ? (
            <Image
              src={image.url}
              alt={product?.title ?? "Product"}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-verse-text-muted">
              No img
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium line-clamp-2 text-verse-text">
            {product ? (
              <Link
                href={`/verse/products/${product.handle}`}
                className="hover:underline"
              >
                {product.title}
              </Link>
            ) : (
              "Product"
            )}
          </h3>
          <div className="mt-2 flex items-center gap-2">
            <CartLineQuantityAdjustButton
              adjust="decrease"
              as={VerseButton}
              variant="outline"
              size="icon"
              className="h-8 w-8"
            >
              −
            </CartLineQuantityAdjustButton>
            <CartLineQuantity as="span" className="min-w-[1.5rem] text-center text-sm" />
            <CartLineQuantityAdjustButton
              adjust="increase"
              as={VerseButton}
              variant="outline"
              size="icon"
              className="h-8 w-8"
            >
              +
            </CartLineQuantityAdjustButton>
            <CartLineQuantityAdjustButton
              adjust="remove"
              as={VerseButton}
              variant="ghost"
              size="sm"
              className="ml-2 text-destructive"
            >
              Remove
            </CartLineQuantityAdjustButton>
          </div>
        </div>
        <div className="shrink-0 text-right">
          {cost && (
            <Money data={cost} as="span" className="font-medium" />
          )}
        </div>
      </div>
    </VerseCard>
  );
}
