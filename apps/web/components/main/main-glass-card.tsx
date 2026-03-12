import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

export interface MainGlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function MainGlassCard({
  children,
  className,
  ...props
}: MainGlassCardProps) {
  return (
    <div
      className={cn("main-glass-panel p-6 rounded-xl", className)}
      {...props}
    >
      {children}
    </div>
  )
}
