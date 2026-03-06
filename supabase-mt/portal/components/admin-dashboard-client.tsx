"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Settings, LayoutDashboard, Building2, User, Database } from "lucide-react";
import SupabaseManagerDialog from "@/components/index";

const projectRef =
  typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SUPABASE_MT_PROJECT_REF ?? "" : "";

export function AdminDashboardClient() {
  const [backofficeOpen, setBackofficeOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    setIsMobile(mq.matches);
    const listener = () => setIsMobile(mq.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Config & backoffice</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Supabase backoffice (database, auth, storage, users, secrets, logs) and quick links.
        </p>
      </div>

      {/* Supabase backoffice */}
      <div className="main-glass-panel-card main-float p-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Database className="h-5 w-5" />
          Supabase backoffice
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Database, Storage, Auth, Users, Secrets, Logs, and Suggestions for the MT project (via
          Management API).
        </p>
        {projectRef ? (
          <div className="mt-4">
            <Button onClick={() => setBackofficeOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              Open backoffice
            </Button>
            <SupabaseManagerDialog
              projectRef={projectRef}
              open={backofficeOpen}
              onOpenChange={setBackofficeOpen}
              isMobile={isMobile}
            />
          </div>
        ) : (
          <p className="mt-4 text-sm text-amber-600 dark:text-amber-500">
            Set <code className="rounded bg-muted px-1 py-0.5">NEXT_PUBLIC_SUPABASE_MT_PROJECT_REF</code> and{" "}
            <code className="rounded bg-muted px-1 py-0.5">SUPABASE_MANAGEMENT_API_TOKEN</code> in
            .env.local to use the backoffice. Project ref is in the Supabase Dashboard URL.
          </p>
        )}
      </div>

      {/* Quick links */}
      <div className="main-glass-panel-card main-float p-6">
        <h3 className="text-lg font-semibold">Quick links</h3>
        <p className="mt-1 text-sm text-muted-foreground">Portal and organization navigation.</p>
        <ul className="mt-4 flex flex-wrap gap-3">
          <li>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </Button>
          </li>
          <li>
            <Button variant="outline" size="sm" asChild>
              <Link href="/onboarding">
                <Building2 className="mr-2 h-4 w-4" />
                Create organization
              </Link>
            </Button>
          </li>
          <li>
            <Button variant="outline" size="sm" asChild>
              <Link href="/profile">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </Button>
          </li>
        </ul>
      </div>
    </div>
  );
}
