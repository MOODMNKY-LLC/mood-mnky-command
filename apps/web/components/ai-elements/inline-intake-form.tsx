"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { MagicCard } from "@/components/ui/magic-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FileText, CheckCircle2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export type FormSchemaField = {
  type: string
  text: string
  order: number
  name?: string
  required?: boolean
  options?: string[]
  semanticKey?: string
}

export type InlineIntakeFormInput = {
  needsForm?: boolean
  funnelId?: string
  runId?: string
  formSchema?: FormSchemaField[]
  questionMapping?: Record<string, string>
}

interface InlineIntakeFormProps {
  input: InlineIntakeFormInput
  output?: InlineIntakeFormInput
  className?: string
}

export function InlineIntakeForm({
  input,
  output,
  className,
}: InlineIntakeFormProps) {
  const out = (output ?? input) as InlineIntakeFormInput
  const needsForm = out?.needsForm ?? (out?.formSchema?.length ?? 0) > 0
  const funnelId = out?.funnelId ?? input?.funnelId
  const runId = out?.runId ?? input?.runId
  const formSchema = (out?.formSchema ?? []) as FormSchemaField[]

  const [values, setValues] = useState<Record<string, string | string[]>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!needsForm || !funnelId || !runId || formSchema.length === 0) {
    return null
  }

  const handleChange = (key: string, value: string | string[]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const payload: Record<string, string | string[]> = {}
      for (const field of formSchema) {
        const k = field.semanticKey ?? field.name ?? field.text
        if (!k) continue
        const v = values[k]
        if (v !== undefined && v !== null) {
          payload[k] = v
        } else if (field.required) {
          setError(`${field.text} is required`)
          setSubmitting(false)
          return
        }
      }

      const res = await fetch(
        `/api/funnels/${funnelId}/runs/${runId}/answers`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? res.statusText)
        return
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit")
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
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
                <h4 className="font-semibold text-sm">Intake submitted</h4>
                <p className="text-xs text-muted-foreground">
                  Thanks! We'll use this to personalize your experience.
                </p>
              </div>
            </div>
          </CardHeader>
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
              <FileText className="size-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm">Quick intake</h4>
              <p className="text-xs text-muted-foreground">
                Tell us about your preferences
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <form onSubmit={handleSubmit} className="space-y-3">
            {formSchema
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
              .map((field) => {
                const key = field.semanticKey ?? field.name ?? field.text
                const value = values[key]
                const isRequired = field.required

                if (field.type === "dropdown" || field.type === "radio") {
                  const opts = field.options ?? []
                  return (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={key} className="text-xs">
                        {field.text}
                        {isRequired && " *"}
                      </Label>
                      <Select
                        value={(value as string) ?? ""}
                        onValueChange={(v) => handleChange(key, v)}
                        required={isRequired}
                        disabled={submitting}
                      >
                        <SelectTrigger id={key} className="text-sm">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {opts.map((opt) => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )
                }

                if (field.type === "textarea") {
                  return (
                    <div key={key} className="space-y-2">
                      <Label htmlFor={key} className="text-xs">
                        {field.text}
                        {isRequired && " *"}
                      </Label>
                      <textarea
                        id={key}
                        value={(value as string) ?? ""}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder={field.text}
                        required={isRequired}
                        disabled={submitting}
                      />
                    </div>
                  )
                }

                if (field.type === "checkbox") {
                  const opts = field.options ?? []
                  const arrVal = (value as string[] | undefined) ?? []
                  return (
                    <div key={key} className="space-y-2">
                      <Label className="text-xs">
                        {field.text}
                        {isRequired && " *"}
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {opts.map((opt) => (
                          <div
                            key={opt}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`${key}-${opt}`}
                              checked={arrVal.includes(opt)}
                              onCheckedChange={(checked) => {
                                const next = checked
                                  ? [...arrVal, opt]
                                  : arrVal.filter((v) => v !== opt)
                                handleChange(key, next)
                              }}
                              disabled={submitting}
                            />
                            <Label
                              htmlFor={`${key}-${opt}`}
                              className="text-xs font-normal cursor-pointer"
                            >
                              {opt}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                }

                return (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key} className="text-xs">
                      {field.text}
                      {isRequired && " *"}
                    </Label>
                    <Input
                      id={key}
                      value={(value as string) ?? ""}
                      onChange={(e) => handleChange(key, e.target.value)}
                      placeholder={field.text}
                      required={isRequired}
                      disabled={submitting}
                      className="text-sm"
                    />
                  </div>
                )
              })}

            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}

            <Button
              type="submit"
              size="sm"
              className="text-xs"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="size-3 animate-spin mr-1" />
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </MagicCard>
  )
}
