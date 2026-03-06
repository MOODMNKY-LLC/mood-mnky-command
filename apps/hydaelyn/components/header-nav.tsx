"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, User, KeyRound, Link2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { useHydaelynUser } from "@/components/hydaelyn-user-context";
import { cn } from "@/lib/utils";

const linkClass =
  "text-sm text-muted-foreground transition-colors hover:text-foreground";

function getInitials(email?: string): string {
  if (email) {
    const part = email.split("@")[0];
    return part.slice(0, 2).toUpperCase();
  }
  return "?";
}

export function HeaderNav({ className }: { className?: string }) {
  const user = useHydaelynUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [discordLoading, setDiscordLoading] = useState(false);

  const handleSignInWithDiscord = async () => {
    setDiscordLoading(true);
    const supabase = createClient();
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback?next=/dashboard`
        : "/auth/callback?next=/dashboard";
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo },
    });
    if (error) {
      setDiscordLoading(false);
      return;
    }
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  };

  if (!user) {
    return (
      <nav className={cn("flex items-center gap-3", className)} aria-label="Account">
        <Button
          size="sm"
          onClick={handleSignInWithDiscord}
          disabled={discordLoading}
          className="bg-[#5865F2] hover:bg-[#4752c4] text-white"
        >
          {discordLoading ? "Redirecting…" : "Sign in with Discord"}
        </Button>
        <Link
          href="/auth/signin"
          className={linkClass}
          aria-label="Sign in with email"
        >
          Sign in
        </Link>
        <Link
          href="/auth/signup"
          className={cn(linkClass, "font-medium text-foreground")}
          aria-label="Sign up"
        >
          Sign up
        </Link>
      </nav>
    );
  }

  const email = user.email ?? "";
  const initials = getInitials(user.email);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("rounded-full", className)}
          aria-label="Account menu"
        >
          <Avatar className="h-8 w-8 rounded-full ring-1 ring-border">
            <AvatarFallback className="rounded-full bg-primary text-primary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-56 rounded-lg border border-border bg-popover p-0"
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-3 px-4 py-3">
            <Avatar className="h-10 w-10 shrink-0 rounded-full ring-1 ring-border">
              <AvatarFallback className="rounded-full bg-primary text-primary-foreground text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-medium text-foreground">
                {email || "Signed in"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Account
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="flex cursor-pointer items-center gap-2">
              <User className="h-4 w-4" />
              Dashboard
            </Link>
          </DropdownMenuItem>
          {user.fflogsLinked === false && (
            <DropdownMenuItem asChild>
              <Link href="/auth/fflogs/authorize?intent=link" className="flex cursor-pointer items-center gap-2">
                <Link2 className="h-4 w-4" />
                Link FFLogs
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link href="/auth/update-password" className="flex cursor-pointer items-center gap-2">
              <KeyRound className="h-4 w-4" />
              Account / Password
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer gap-2">
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
