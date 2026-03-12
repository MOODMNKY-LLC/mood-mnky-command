"use client";

import { usePathname } from "next/navigation";
import { HeaderNav } from "@/components/header-nav";

export function ConditionalHeader() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard") ?? false;

  if (isDashboard) {
    return null;
  }

  return <HeaderNav />;
}
