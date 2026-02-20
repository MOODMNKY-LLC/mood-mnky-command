"use client"

import { HelpCircle, BookOpen, FileCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDocs } from "@/components/docs/docs-context"

export function DocsButton() {
  const { openDocs } = useDocs()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Documentation">
          <HelpCircle className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => openDocs("guide")} className="flex cursor-pointer items-center gap-2">
          <BookOpen className="h-4 w-4" />
          App Guide
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => openDocs("admin")} className="flex cursor-pointer items-center gap-2">
          <FileCode className="h-4 w-4" />
          Admin Docs
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
