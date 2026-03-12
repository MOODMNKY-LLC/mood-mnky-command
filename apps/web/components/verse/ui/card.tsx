"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

const VerseCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg text-verse-text glass-panel",
      className
    )}
    {...props}
  />
));
VerseCard.displayName = "VerseCard";

const VerseCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
VerseCardHeader.displayName = "VerseCardHeader";

const VerseCardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight text-verse-text",
      className
    )}
    {...props}
  />
));
VerseCardTitle.displayName = "VerseCardTitle";

const VerseCardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-verse-text-muted", className)}
    {...props}
  />
));
VerseCardDescription.displayName = "VerseCardDescription";

const VerseCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
VerseCardContent.displayName = "VerseCardContent";

const VerseCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
VerseCardFooter.displayName = "VerseCardFooter";

export {
  VerseCard,
  VerseCardHeader,
  VerseCardFooter,
  VerseCardTitle,
  VerseCardDescription,
  VerseCardContent,
};
