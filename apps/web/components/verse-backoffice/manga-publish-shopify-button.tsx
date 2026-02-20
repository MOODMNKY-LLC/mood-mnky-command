"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import { useRouter } from "next/navigation"

interface MangaPublishShopifyButtonProps {
  /** When set, only this issue is published (appended as ?issueSlug=...). */
  issueSlug?: string
}

export function MangaPublishShopifyButton({ issueSlug }: MangaPublishShopifyButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handlePublish = async () => {
    setLoading(true)
    try {
      const url = issueSlug
        ? `/api/shopify/sync/metaobject-manga?issueSlug=${encodeURIComponent(issueSlug)}`
        : "/api/shopify/sync/metaobject-manga"
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        alert(data.error ?? `Publish failed (${res.status})`)
        return
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePublish}
      disabled={loading}
    >
      <Upload className={`mr-2 h-4 w-4 ${loading ? "animate-pulse" : ""}`} />
      {loading ? "Publishing…" : "Publish to Shopify"}
    </Button>
  )
}
