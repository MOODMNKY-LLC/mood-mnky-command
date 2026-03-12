"use client"

import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"
import { Response } from "@/components/ui/response"

export type MainResponseProps = ComponentProps<typeof Response> & {
  mainClassName?: string
}

export function MainResponse({
  className,
  mainClassName,
  ...props
}: MainResponseProps) {
  return (
    <Response
      className={cn("main-glass-panel rounded-xl p-4", mainClassName, className)}
      {...props}
    />
  )
}
