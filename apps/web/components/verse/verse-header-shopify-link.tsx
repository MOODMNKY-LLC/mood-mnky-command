"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Store } from "lucide-react";
import useSWR from "swr";
import { VerseButton } from "@/components/verse/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ConnectionResponse = {
  linked: boolean;
  needsReconnect?: boolean;
  email?: string;
  displayName?: string;
};

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" }).then((res) => res.json());

export function VerseHeaderShopifyLink({
  userId,
}: {
  userId: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading } = useSWR<ConnectionResponse>(
    mounted && userId ? "/api/customer-account-api/connection" : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  if (!userId) return null;

  if (!mounted || isLoading) {
    return (
      <span
        className="flex h-11 min-h-[44px] min-w-[44px] items-center justify-center text-verse-text-muted"
        aria-hidden
      >
        <Store className="h-4 w-4 opacity-50" />
      </span>
    );
  }

  const linked = data?.linked ?? false;
  const needsReconnect = data?.needsReconnect ?? false;
  const displayName = data?.displayName;
  const email = data?.email;

  if (!linked) {
    return (
      <VerseButton variant="ghost" size="sm" className="min-h-[44px] gap-1.5 px-2" asChild>
        <a href="/api/customer-account-api/auth" title="Link your Shopify account">
          <Store className="h-4 w-4 text-verse-text-muted" />
          <span className="hidden sm:inline text-sm">Link Shopify</span>
        </a>
      </VerseButton>
    );
  }

  const tooltipContent = (
    <div className="space-y-1 text-left">
      <p className="font-medium text-verse-text">
        {displayName || email ? (
          <>Shopify account · {displayName || email}</>
        ) : (
          "Shopify account linked"
        )}
      </p>
      {needsReconnect && (
        <p className="text-xs text-verse-text-muted">
          <a
            href="/api/customer-account-api/auth"
            className="underline hover:no-underline"
          >
            Reconnect required
          </a>
        </p>
      )}
      <p className="text-xs text-verse-text-muted">
        <Link href="/dojo/me/profile" className="underline hover:no-underline">
          Manage in Profile
        </Link>
      </p>
    </div>
  );

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <VerseButton
            variant="ghost"
            size="icon"
            className="h-11 w-11 min-h-[44px] min-w-[44px] text-verse-text"
            type="button"
            title="Shopify account linked"
          >
            <Store className="h-4 w-4" />
          </VerseButton>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="verse-dropdown max-w-[220px]">
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
