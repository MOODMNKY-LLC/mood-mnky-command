"use client";

import Link from "next/link";
import { BookOpen, FileText, Info, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useState } from "react";

const docsLinks = [
  { href: "/about", label: "About", icon: Info },
  { href: "/services", label: "Services", icon: Wrench },
  { href: "/docs", label: "Info & docs", icon: FileText },
] as const;

export function DocsCommandPopover() {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Open info and docs"
        >
          <BookOpen className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="end" sideOffset={8}>
        <Command className="rounded-lg border-0 shadow-none">
          <CommandList>
            <CommandGroup heading="Info & docs">
              {docsLinks.map(({ href, label, icon: Icon }) => (
                <CommandItem
                  key={href}
                  onSelect={() => {
                    setOpen(false);
                  }}
                  asChild
                >
                  <Link href={href} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
