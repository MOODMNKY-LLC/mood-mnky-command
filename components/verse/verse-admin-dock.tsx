"use client";

import Link from "next/link";
import { Home, ShoppingCart, Store } from "lucide-react";
import { Dock, DockIcon } from "@/components/ui/dock";

export function VerseAdminDock({ isAdmin = false }: { isAdmin?: boolean }) {
  if (!isAdmin) return null;

  return (
    <div className="verse-admin-dock pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex justify-center pb-4 pt-8">
      <div className="pointer-events-auto">
        <Dock
          className="border-verse-text/25 bg-verse-bg/95 shadow-lg shadow-verse-text/10 backdrop-blur-md"
          iconSize={36}
          iconMagnification={48}
        >
        <DockIcon>
          <Link
            href="/"
            className="flex size-full items-center justify-center text-verse-text"
            title="MOOD MNKY LABZ"
          >
            <Home className="h-5 w-5" />
          </Link>
        </DockIcon>
        <DockIcon>
          <Link
            href="/verse/cart"
            className="flex size-full items-center justify-center text-verse-text"
            title="Cart"
          >
            <ShoppingCart className="h-5 w-5" />
          </Link>
        </DockIcon>
        <DockIcon>
          <Link
            href="/store"
            className="flex size-full items-center justify-center text-verse-text"
            title="Store Admin"
          >
            <Store className="h-5 w-5" />
          </Link>
        </DockIcon>
      </Dock>
      </div>
    </div>
  );
}
