"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

type QuizQuestion = {
  id: string
  question: string
  options: string[]
  correctIndex: number
}

interface VerseQuizClientProps {
  issueId: string
  questions: QuizQuestion[]
  passThreshold: number
}

export function VerseQuizClient({
  issueId,
  questions,
  passThreshold,
}: VerseQuizClientProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState<number | null>(null)
  const [passed, setPassed] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAnswerChange = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }))
  }

  const handleSubmit = async () => {
    const answeredCount = Object.keys(answers).length
    if (answeredCount < questions.length) {
      setError("Please answer all questions before submitting.")
      return
    }

    setLoading(true)
    setError(null)

    let correct = 0
    for (const q of questions) {
      if (answers[q.id] === q.correctIndex) correct++
    }
    const computedScore = Math.round((correct / questions.length) * 100)
    const computedPassed = computedScore >= passThreshold

    try {
      const res = await fetch("/api/mag/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueId,
          score: computedScore,
          passed: computedPassed,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? `HTTP ${res.status}`)
      }

      setScore(computedScore)
      setPassed(computedPassed)
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit quiz")
    } finally {
      setLoading(false)
    }
  }

  if (submitted && score != null && passed != null) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">
            {passed ? "You passed!" : "Try again"}
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Your score: <strong>{score}%</strong>
            {passed
              ? ". XP has been awarded. Check your Dojo for updated progress."
              : `. You need ${passThreshold}% to pass. Re-read the issue and try again.`}
          </p>
          <Button asChild variant="outline">
            <a href="/dojo">Go to Dojo</a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit()
          }}
          className="space-y-6"
        >
          {questions.map((q) => (
            <div key={q.id} className="space-y-3">
              <Label className="text-base font-medium">{q.question}</Label>
              <RadioGroup
                value={answers[q.id]?.toString() ?? ""}
                onValueChange={(v) => handleAnswerChange(q.id, parseInt(v, 10))}
                className="flex flex-col gap-2"
              >
                {q.options.map((opt, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-2 rounded-md border px-3 py-2 has-[[data-state=checked]]:border-primary"
                  >
                    <RadioGroupItem value={idx.toString()} id={`${q.id}-${idx}`} />
                    <Label
                      htmlFor={`${q.id}-${idx}`}
                      className="flex-1 cursor-pointer font-normal"
                    >
                      {opt}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ))}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? "Submitting…" : "Submit quiz"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
