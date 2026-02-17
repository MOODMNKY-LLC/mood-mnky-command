"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@shopify/hydrogen-react";
import { useEffect, useState } from "react";

function CartLinkWithQuantity() {
  const { totalQuantity } = useCart();
  return (
    <Link
      href="/verse/cart"
      className="relative flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 text-sm font-medium text-verse-text transition-colors hover:opacity-90"
    >
      <ShoppingCart className="h-5 w-5" />
      <span className="hidden sm:inline">Cart</span>
      {totalQuantity != null && totalQuantity > 0 && (
        <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-verse-button px-1 text-xs font-medium text-verse-button-text">
          {totalQuantity}
        </span>
      )}
    </Link>
  );
}

function CartLinkFallback() {
  return (
    <Link
      href="/verse/cart"
      className="relative flex min-h-[44px] min-w-[44px] items-center justify-center gap-1 text-sm font-medium text-verse-text transition-colors hover:opacity-90"
    >
      <ShoppingCart className="h-5 w-5" />
      <span className="hidden sm:inline">Cart</span>
    </Link>
  );
}

/** Renders cart link with quantity only after mount so useCart() is never called during SSR (avoids Cart Context error). */
export function VerseHeaderCartLink() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <CartLinkFallback />;
  return <CartLinkWithQuantity />;
}
