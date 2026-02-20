"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { MagicCard } from "@/components/ui/magic-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { FlaskConical, CheckCircle2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export type PersonalizationFormInput = {
  needsInput?: boolean
  blendSummary?: {
    productType: string
    fragrances: Array<{
      oilId: string
      oilName: string
      proportionPct: number
    }>
    batchWeightG?: number
    fragranceLoadPct?: number
    notes?: string
  }
  promptForImage?: string
}

export type PersonalizationFormOutput = {
  success?: boolean
  blendId?: string
  publicUrl?: string | null
  error?: string
}

interface PersonalizationFormCardProps {
  input: PersonalizationFormInput
  output?: PersonalizationFormOutput
  className?: string
}

export function PersonalizationFormCard({
  input,
  output,
  className,
}: PersonalizationFormCardProps) {
  const [blendName, setBlendName] = useState("")
  const [signature, setSignature] = useState("")
  const [generateImage, setGenerateImage] = useState(Boolean(input?.promptForImage))
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<PersonalizationFormOutput | null>(null)

  const out = output as PersonalizationFormInput | undefined
  const needsInput = out?.needsInput ?? input?.needsInput
  const blendSummary = out?.blendSummary ?? input?.blendSummary
  const promptForImage = out?.promptForImage ?? input?.promptForImage

  if (!needsInput || !blendSummary) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!blendName.trim()) return

    setSubmitting(true)
    setSubmitResult(null)

    try {
      const res = await fetch("/api/blends/personalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blendName: blendName.trim(),
          signature: signature.trim() || undefined,
          blendSummary,
          generateImage,
          promptForImage: generateImage ? promptForImage : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setSubmitResult({ error: data.error ?? res.statusText })
        return
      }

      setSubmitResult({
        success: true,
        blendId: data.blendId,
        publicUrl: data.publicUrl,
      })
    } catch (err) {
      setSubmitResult({
        error: err instanceof Error ? err.message : "Failed to save",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (submitResult?.success) {
    return (
      <MagicCard
        className={cn(
          "rounded-lg border overflow-hidden",
          "gradientFrom-amber-500/20 gradientTo-rose-500/20",
          className
        )}
        gradientFrom="rgba(245, 158, 11, 0.3)"
        gradientTo="rgba(244, 63, 94, 0.3)"
      >
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="size-4 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm">{blendName}</h4>
                <p className="text-xs text-muted-foreground">
                  Saved successfully
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {submitResult.publicUrl && (
              <a
                href={submitResult.publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline"
              >
                View generated image
              </a>
            )}
          </CardContent>
        </Card>
      </MagicCard>
    )
  }

  return (
    <MagicCard
      className={cn(
        "rounded-lg border overflow-hidden",
        "gradientFrom-amber-500/20 gradientTo-rose-500/20",
        className
      )}
      gradientFrom="rgba(245, 158, 11, 0.3)"
      gradientTo="rgba(244, 63, 94, 0.3)"
    >
      <Card className="border-0 shadow-none bg-transparent">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
              <FlaskConical className="size-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm">Personalize your blend</h4>
              <p className="text-xs text-muted-foreground">
                Give your blend a name and optional signature
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="blend-name" className="text-xs">
                Blend name *
              </Label>
              <Input
                id="blend-name"
                value={blendName}
                onChange={(e) => setBlendName(e.target.value)}
                placeholder="e.g. Cozy Fall Nights"
                className="text-sm"
                disabled={submitting}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signature" className="text-xs">
                Signature (optional)
              </Label>
              <Input
                id="signature"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="e.g. A special touch"
                className="text-sm"
                disabled={submitting}
              />
            </div>
            {promptForImage && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="generate-image"
                  checked={generateImage}
                  onCheckedChange={(v) => setGenerateImage(v === true)}
                  disabled={submitting}
                />
                <Label
                  htmlFor="generate-image"
                  className="text-xs font-normal cursor-pointer"
                >
                  Generate AI scene image
                </Label>
              </div>
            )}
            {submitResult?.error && (
              <p className="text-xs text-destructive">{submitResult.error}</p>
            )}
            <Button
              type="submit"
              size="sm"
              className="text-xs"
              disabled={submitting || !blendName.trim()}
            >
              {submitting ? (
                <>
                  <Loader2 className="size-3 animate-spin mr-1" />
                  Saving...
                </>
              ) : (
                "Save blend"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </MagicCard>
  )
}
