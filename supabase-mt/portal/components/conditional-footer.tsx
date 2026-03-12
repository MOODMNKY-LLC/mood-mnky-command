"use client";

import { usePathname } from "next/navigation";
import { PortalFooter } from "@/components/portal-footer";

export function ConditionalFooter() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard") ?? false;

  if (isDashboard) {
    return null;
  }

  return <PortalFooter />;
}
