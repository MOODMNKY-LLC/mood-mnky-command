"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeaderNav } from "@/components/header-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export function ConditionalRootHeader() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");

  if (isDashboard) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        <Link
          href="/"
          className="text-lg font-semibold text-foreground hover:text-primary"
        >
          Hydaelyn
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <HeaderNav />
        </div>
      </div>
    </header>
  );
}
