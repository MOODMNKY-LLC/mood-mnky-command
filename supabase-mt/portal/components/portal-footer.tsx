"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

const MAIN_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL || "https://www.moodmnky.com";
const DOCS_URL = process.env.NEXT_PUBLIC_DOCS_URL || `${MAIN_URL}/docs`;

export function PortalFooter() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    createClient().auth.getUser().then(({ data: { user } }) => setAuthenticated(!!user));
  }, []);

  return (
    <footer className="main-glass-footer mt-auto">
      <div className="main-container flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} MOOD MNKY LLC. Organizational portal for partners and tenants.
        </p>
        <div className="flex flex-wrap gap-6 text-sm">
          <Link href={MAIN_URL} className="text-muted-foreground hover:text-foreground">
            Main site
          </Link>
          <Link href={DOCS_URL} className="text-muted-foreground hover:text-foreground">
            Docs
          </Link>
          {authenticated && (
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
          )}
        </div>
      </div>
    </footer>
  );
}
