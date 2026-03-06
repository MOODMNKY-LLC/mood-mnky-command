"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export function ReportInsightsCard({ reportCode }: { reportCode: string }) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/reports/${reportCode}/insights?type=summary`)
      .then((res) => res.json())
      .then((data) => {
        if (data.content?.text) setContent(data.content.text);
      })
      .catch(() => {});
  }, [reportCode]);

  async function generateSummary() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/${reportCode}/insights`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "summary" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? res.statusText);
      const text = data.content?.text ?? (typeof data.content === "string" ? data.content : "");
      setContent(text || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Insights</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={generateSummary}
            disabled={loading}
          >
            {loading ? "Generating…" : "Generate summary"}
          </Button>
        </div>
        <CardDescription>
          AI-generated summary of this report. Requires OPENAI_API_KEY.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {content && (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{content}</p>
          </div>
        )}
        {!content && !error && !loading && (
          <p className="text-sm text-muted-foreground">
            Click &quot;Generate summary&quot; to get an AI summary of this report.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
