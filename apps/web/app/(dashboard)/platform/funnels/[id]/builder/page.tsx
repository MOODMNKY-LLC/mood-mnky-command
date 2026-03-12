"use client"

import { use, useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Loader2,
  Sparkles,
  Save,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import type { FormQuestion, FormQuestionType } from "@/lib/jotform/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const QUESTION_TYPES: { value: FormQuestionType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Text area" },
  { value: "dropdown", label: "Dropdown" },
  { value: "radio", label: "Radio" },
  { value: "checkbox", label: "Checkbox" },
  { value: "header", label: "Header" },
]

const SEMANTIC_KEYS = [
  { value: "", label: "— None —" },
  { value: "target_mood", label: "Target mood" },
  { value: "product_type", label: "Product type" },
  { value: "experience_level", label: "Experience level" },
  { value: "preferred_notes", label: "Preferred notes" },
  { value: "blend_style", label: "Blend style" },
  { value: "fragrance_hints", label: "Fragrance hints" },
]

interface Funnel {
  id: string
  name: string
  provider_form_id: string | null
  question_mapping: Record<string, string> | null
}

const emptyQuestion = (order: number): FormQuestion => ({
  type: "text",
  text: "",
  order,
  required: false,
})

export default function FunnelBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data, isLoading, mutate } = useSWR<{ funnel: Funnel }>(
    `/api/funnels/${id}`,
    fetcher,
    { revalidateOnFocus: false }
  )

  const [questions, setQuestions] = useState<FormQuestion[]>([])
  const [creating, setCreating] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const [suggestPrompt, setSuggestPrompt] = useState("")
  const [error, setError] = useState<string | null>(null)

  const funnel = data?.funnel
  const hasForm = !!funnel?.provider_form_id

  function addQuestion() {
    setQuestions((q) => [...q, emptyQuestion(q.length + 1)])
  }

  function removeQuestion(idx: number) {
    setQuestions((q) => q.filter((_, i) => i !== idx).map((x, i) => ({ ...x, order: i + 1 })))
  }

  function updateQuestion(idx: number, patch: Partial<FormQuestion>) {
    setQuestions((q) =>
      q.map((x, i) => (i === idx ? { ...x, ...patch } : x))
    )
  }

  async function handleCreateInJotform() {
    if (!funnel) return
    setError(null)
    setCreating(true)
    try {
      const res = await fetch(`/api/funnels/${funnel.id}/form/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions,
          title: funnel.name,
          registerWebhook: true,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? "Failed to create form")
        return
      }
      mutate()
    } finally {
      setCreating(false)
    }
  }

  async function handleSuggestQuestions() {
    if (!suggestPrompt.trim()) return
    setError(null)
    setSuggesting(true)
    try {
      const res = await fetch("/api/funnels/ai/suggest-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: suggestPrompt.trim(),
          funnelType: "fragrance_intake",
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? "Failed to suggest questions")
        return
      }
      const suggested = json.questions as FormQuestion[]
      if (Array.isArray(suggested) && suggested.length > 0) {
        setQuestions(
          suggested.map((q, i) => ({
            ...q,
            order: i + 1,
          }))
        )
      }
    } finally {
      setSuggesting(false)
    }
  }

  if (isLoading || !funnel) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href={`/platform/funnels/${id}`}>
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            {funnel.name}
          </Button>
        </Link>
        <Separator orientation="vertical" className="h-5" />
        <div className="flex-1">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Form Builder
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {hasForm
              ? "Form exists in JotForm. Add more questions below."
              : "Design your form and create it in JotForm."}
          </p>
        </div>
      </div>

      {!hasForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-primary" />
              Generate with AI
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Fragrance intake for candle makers"
                value={suggestPrompt}
                onChange={(e) => setSuggestPrompt(e.target.value)}
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={handleSuggestQuestions}
                disabled={suggesting}
              >
                {suggesting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    Suggest
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Questions</CardTitle>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={addQuestion}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add
              </Button>
              {!hasForm && questions.length > 0 && (
                <Button
                  size="sm"
                  onClick={handleCreateInJotform}
                  disabled={creating}
                >
                  {creating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Create in JotForm
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <p className="text-sm text-destructive mb-4">{error}</p>
          )}
          {questions.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No questions yet. Add one or generate with AI.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {questions.map((q, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 rounded-lg border border-border p-3"
                >
                  <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground mt-2" />
                  <div className="flex-1 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={q.type}
                        onValueChange={(v) =>
                          updateQuestion(idx, { type: v as FormQuestionType })
                        }
                      >
                        <SelectTrigger className="h-8 mt-0.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {QUESTION_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>
                              {t.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="sm:col-span-2">
                      <Label className="text-xs">Label / Question text</Label>
                      <Input
                        className="h-8 mt-0.5"
                        value={q.text}
                        onChange={(e) =>
                          updateQuestion(idx, { text: e.target.value })
                        }
                        placeholder="Question text"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Semantic key</Label>
                      <Select
                        value={q.semanticKey ?? ""}
                        onValueChange={(v) =>
                          updateQuestion(idx, {
                            semanticKey: v || undefined,
                          })
                        }
                      >
                        <SelectTrigger className="h-8 mt-0.5">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          {SEMANTIC_KEYS.map((k) => (
                            <SelectItem key={k.value || "none"} value={k.value}>
                              {k.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeQuestion(idx)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
