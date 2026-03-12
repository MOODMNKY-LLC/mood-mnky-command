"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Store, MessageCircle, Loader2 } from "lucide-react";
import { SiGithub } from "react-icons/si";

type LinkedAccountsResponse = {
  shopify: { linked: boolean; linkUrl: string; manageUrl: string };
  discord: { linked: boolean; linkUrl: string };
  github: { linked: boolean; linkUrl: string };
};

export function DojoAccountDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<LinkedAccountsResponse | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/me/linked-accounts")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .finally(() => setLoading(false));
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Account</DialogTitle>
          <DialogDescription>
            Linked accounts, password, and full profile.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : data ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  Shopify
                </span>
                {data.shopify.linked ? (
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    Linked
                  </span>
                ) : (
                  <Button variant="outline" size="sm" asChild>
                    <a href={data.shopify.linkUrl}>Connect</a>
                  </Button>
                )}
              </div>
              {data.shopify.linked && data.shopify.manageUrl && (
                <Button variant="ghost" size="sm" className="h-8" asChild>
                  <a
                    href={data.shopify.manageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Manage Shopify account
                  </a>
                </Button>
              )}
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
              <span className="flex items-center gap-2 text-sm font-medium">
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                Discord
              </span>
              {data.discord.linked ? (
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Linked
                </span>
              ) : (
                <Button variant="outline" size="sm" asChild>
                  <Link href={data.discord.linkUrl}>Link account</Link>
                </Button>
              )}
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
              <span className="flex items-center gap-2 text-sm font-medium">
                <SiGithub className="h-4 w-4 text-muted-foreground" />
                GitHub
              </span>
              {data.github.linked ? (
                <span className="text-xs uppercase tracking-wider text-muted-foreground">
                  Linked
                </span>
              ) : (
                <Button variant="outline" size="sm" asChild>
                  <Link href={data.github.linkUrl}>Link account</Link>
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 border-t pt-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/auth/update-password">Change password</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dojo/profile" onClick={() => onOpenChange(false)}>
                  Full profile
                </Link>
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
