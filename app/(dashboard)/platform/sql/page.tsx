"use client"

import React from "react"

import { useState, useCallback, useRef } from "react"
import {
  Play,
  Sparkles,
  ArrowLeft,
  Loader2,
  Copy,
  Check,
  Trash2,
  Clock,
  AlertTriangle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

const AI_ENABLED = process.env.NEXT_PUBLIC_ENABLE_AI_QUERIES === "true"

interface QueryResult {
  columns: string[]
  rows: Record<string, unknown>[]
  rowCount: number
  error?: string
}

interface HistoryEntry {
  query: string
  timestamp: number
  rowCount?: number
  error?: boolean
}

export default function SqlEditorPage() {
  const [query, setQuery] = useState("SELECT * FROM profiles LIMIT 10;")
  const [aiPrompt, setAiPrompt] = useState("")
  const [result, setResult] = useState<QueryResult | null>(null)
  const [running, setRunning] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [executionTime, setExecutionTime] = useState<number | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const executeQuery = useCallback(async () => {
    if (!query.trim() || running) return
    setRunning(true)
    setResult(null)
    setExecutionTime(null)

    const start = performance.now()
    try {
      const res = await fetch("/api/platform/sql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      })
      const data = await res.json()
      const elapsed = performance.now() - start
      setExecutionTime(elapsed)
      setResult(data)
      setHistory((prev) => [
        { query: query.trim(), timestamp: Date.now(), rowCount: data.rowCount, error: !!data.error },
        ...prev.slice(0, 19),
      ])
    } catch {
      setResult({ columns: [], rows: [], rowCount: 0, error: "Network error" })
    } finally {
      setRunning(false)
    }
  }, [query, running])

  const generateSql = useCallback(async () => {
    if (!aiPrompt.trim() || generating) return
    setGenerating(true)
    try {
      const res = await fetch("/api/platform/ai-sql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt.trim() }),
      })
      const data = await res.json()
      if (data.sql) {
        setQuery(data.sql)
        setAiPrompt("")
      } else if (data.error) {
        setResult({ columns: [], rows: [], rowCount: 0, error: data.error })
      }
    } catch {
      setResult({ columns: [], rows: [], rowCount: 0, error: "AI generation failed" })
    } finally {
      setGenerating(false)
    }
  }, [aiPrompt, generating])

  const handleCopy = () => {
    navigator.clipboard.writeText(query)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault()
      executeQuery()
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/platform">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <ArrowLeft className="h-3.5 w-3.5" />
            Platform
          </Button>
        </Link>
        <Separator orientation="vertical" className="h-5" />
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            SQL Editor
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Run queries against your database{AI_ENABLED ? " with AI assistance" : ""}
          </p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col gap-4">
          {/* AI Prompt */}
          {AI_ENABLED && (
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-chart-4 shrink-0" />
                  <input
                    type="text"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        generateSql()
                      }
                    }}
                    placeholder="Describe what you want to query in plain English..."
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={generateSql}
                    disabled={!aiPrompt.trim() || generating}
                    className="gap-1.5 text-xs"
                  >
                    {generating ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    Generate
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* SQL Editor */}
          <Card>
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b border-border px-4 py-2">
                <span className="text-xs text-muted-foreground font-mono">
                  SQL Query
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="h-7 px-2 text-xs"
                  >
                    {copied ? (
                      <Check className="h-3 w-3 text-success" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setQuery("")
                      setResult(null)
                    }}
                    className="h-7 px-2 text-xs"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <textarea
                ref={textareaRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                className="w-full min-h-[160px] resize-y bg-transparent p-4 font-mono text-sm text-foreground placeholder:text-muted-foreground outline-none"
                placeholder="Enter your SQL query..."
              />
              <div className="flex items-center justify-between border-t border-border px-4 py-2">
                <span className="text-[10px] text-muted-foreground">
                  {typeof navigator !== "undefined" && navigator.platform?.includes("Mac") ? "Cmd" : "Ctrl"}+Enter
                  to run
                </span>
                <Button
                  size="sm"
                  onClick={executeQuery}
                  disabled={!query.trim() || running}
                  className="gap-1.5"
                >
                  {running ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Play className="h-3.5 w-3.5" />
                  )}
                  Run Query
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {result && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {result.error ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                    ) : (
                      <Check className="h-3.5 w-3.5 text-success" />
                    )}
                    Results
                  </div>
                  <div className="flex items-center gap-3 text-xs font-normal text-muted-foreground">
                    {executionTime !== null && (
                      <span>
                        <Clock className="h-3 w-3 inline mr-1" />
                        {executionTime < 1000
                          ? `${Math.round(executionTime)}ms`
                          : `${(executionTime / 1000).toFixed(2)}s`}
                      </span>
                    )}
                    {!result.error && (
                      <Badge variant="secondary" className="text-[10px]">
                        {result.rowCount} row{result.rowCount !== 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.error ? (
                  <pre className="text-sm font-mono text-destructive bg-destructive/5 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap">
                    {result.error}
                  </pre>
                ) : result.rows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Query executed successfully. No rows returned.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-secondary/50">
                          {result.columns.map((col) => (
                            <th
                              key={col}
                              className="text-left px-3 py-2 text-xs text-muted-foreground font-medium border-b border-border whitespace-nowrap"
                            >
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.rows.map((row, i) => (
                          <tr
                            key={i}
                            className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors"
                          >
                            {result.columns.map((col) => (
                              <td
                                key={col}
                                className="px-3 py-1.5 font-mono text-xs text-foreground whitespace-nowrap max-w-[300px] truncate"
                              >
                                {row[col] === null ? (
                                  <span className="text-muted-foreground italic">
                                    null
                                  </span>
                                ) : typeof row[col] === "object" ? (
                                  JSON.stringify(row[col])
                                ) : (
                                  String(row[col])
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right sidebar: History */}
        <div className="w-60 shrink-0">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Query History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No queries run yet
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {history.map((entry, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setQuery(entry.query)}
                      className="text-left rounded-md p-2 hover:bg-secondary transition-colors"
                    >
                      <pre className="font-mono text-[10px] text-foreground truncate max-w-full">
                        {entry.query.slice(0, 60)}
                        {entry.query.length > 60 ? "..." : ""}
                      </pre>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                        {entry.error ? (
                          <Badge className="bg-destructive/10 text-destructive border-0 text-[8px] px-1">
                            Error
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[8px] px-1">
                            {entry.rowCount} rows
                          </Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
