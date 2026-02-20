"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const verseButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verse-text/30 focus-visible:ring-offset-2 focus-visible:ring-offset-verse-bg disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-verse-button text-verse-button-text hover:bg-verse-button/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-verse-text/30 bg-transparent text-verse-text hover:bg-verse-text/10",
        secondary:
          "bg-verse-text/10 text-verse-text hover:bg-verse-text/20",
        ghost: "text-verse-text hover:bg-verse-text/10",
        link: "text-verse-text underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface VerseButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof verseButtonVariants> {
  asChild?: boolean;
}

const VerseButton = React.forwardRef<HTMLButtonElement, VerseButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(verseButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
VerseButton.displayName = "VerseButton";

export { VerseButton, verseButtonVariants };
