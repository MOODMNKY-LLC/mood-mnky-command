"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, LayoutDashboard, User, FileText, Settings } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const quickNav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Admin", href: "/admin", icon: Settings },
  { label: "Profile", href: "/profile", icon: User },
] as const;

export function SemanticSearchBar() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "relative h-9 w-full justify-start gap-2 rounded-md border bg-muted/40 text-sm text-muted-foreground sm:max-w-[220px] md:max-w-[260px]"
        )}
        onClick={() => setOpen(true)}
        aria-label="Open semantic search"
      >
        <Search className="h-4 w-4 shrink-0 opacity-50" />
        <span className="hidden sm:inline-flex">Search...</span>
        <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Semantic search: type to find pages and content..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Quick navigation">
            {quickNav.map(({ label, href, icon: Icon }) => (
              <CommandItem
                key={href}
                onSelect={() => {
                  router.push(href);
                  setOpen(false);
                }}
              >
                <Icon className="mr-2 h-4 w-4" />
                {label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Semantic search">
            <CommandItem disabled className="text-muted-foreground">
              <FileText className="mr-2 h-4 w-4" />
              Search across portal content by meaning — results update as you type.
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
