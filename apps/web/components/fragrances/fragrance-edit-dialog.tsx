"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import type { FragranceOil, FragranceFamily } from "@/lib/types"
import { FRAGRANCE_FAMILIES } from "@/lib/types"

interface FragranceEditDialogProps {
  oil: FragranceOil
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function FragranceEditDialog({
  oil,
  open,
  onOpenChange,
  onSuccess,
}: FragranceEditDialogProps) {
  const [name, setName] = useState(oil.name)
  const [description, setDescription] = useState(oil.description)
  const [family, setFamily] = useState<FragranceFamily>(oil.family)
  const [price1oz, setPrice1oz] = useState(String(oil.price1oz))
  const [price4oz, setPrice4oz] = useState(String(oil.price4oz))
  const [price16oz, setPrice16oz] = useState(String(oil.price16oz))
  const [rating, setRating] = useState(String(oil.rating))
  const [candleSafe, setCandleSafe] = useState(oil.candleSafe)
  const [soapSafe, setSoapSafe] = useState(oil.soapSafe)
  const [lotionSafe, setLotionSafe] = useState(oil.lotionSafe)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName(oil.name)
      setDescription(oil.description)
      setFamily(oil.family)
      setPrice1oz(String(oil.price1oz))
      setPrice4oz(String(oil.price4oz))
      setPrice16oz(String(oil.price16oz))
      setRating(String(oil.rating))
      setCandleSafe(oil.candleSafe)
      setSoapSafe(oil.soapSafe)
      setLotionSafe(oil.lotionSafe)
      setError(null)
    }
  }, [open, oil])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/fragrance-oils/${oil.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          family,
          price1oz: parseFloat(price1oz) || 0,
          price4oz: parseFloat(price4oz) || 0,
          price16oz: parseFloat(price16oz) || 0,
          rating: parseFloat(rating) || 0,
          candleSafe,
          soapSafe,
          lotionSafe,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || res.statusText)
      }
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit fragrance</DialogTitle>
          <DialogDescription>
            Changes sync to Notion and Supabase. Run a full sync from the Notion
            Sync panel to reconcile with other Notion edits.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Fragrance name"
              className="bg-background"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-desc">Description</Label>
            <Textarea
              id="edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              rows={3}
              className="bg-background resize-none"
            />
          </div>
          <div className="grid gap-2">
            <Label>Family</Label>
            <Select value={family} onValueChange={(v) => setFamily(v as FragranceFamily)}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FRAGRANCE_FAMILIES.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-1oz">Price 1 oz ($)</Label>
              <Input
                id="edit-1oz"
                type="number"
                step="0.01"
                min="0"
                value={price1oz}
                onChange={(e) => setPrice1oz(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-4oz">Price 4 oz ($)</Label>
              <Input
                id="edit-4oz"
                type="number"
                step="0.01"
                min="0"
                value={price4oz}
                onChange={(e) => setPrice4oz(e.target.value)}
                className="bg-background"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-16oz">Price 16 oz ($)</Label>
            <Input
              id="edit-16oz"
              type="number"
              step="0.01"
              min="0"
              value={price16oz}
              onChange={(e) => setPrice16oz(e.target.value)}
              className="bg-background"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-rating">Rating (0–5)</Label>
            <Input
              id="edit-rating"
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="bg-background"
            />
          </div>
          <div className="flex flex-col gap-3">
            <Label>Safety</Label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="edit-candle"
                  checked={candleSafe}
                  onCheckedChange={setCandleSafe}
                />
                <Label htmlFor="edit-candle" className="text-sm font-normal">
                  Candle
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="edit-soap"
                  checked={soapSafe}
                  onCheckedChange={setSoapSafe}
                />
                <Label htmlFor="edit-soap" className="text-sm font-normal">
                  Soap
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="edit-lotion"
                  checked={lotionSafe}
                  onCheckedChange={setLotionSafe}
                />
                <Label htmlFor="edit-lotion" className="text-sm font-normal">
                  Lotion
                </Label>
              </div>
            </div>
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
