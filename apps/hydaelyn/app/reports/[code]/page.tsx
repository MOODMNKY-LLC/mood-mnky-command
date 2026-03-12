import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchReportDetail } from "@/lib/fflogs/client";
import { getCached, setCached, reportDetailCacheKey } from "@/lib/fflogs/cache";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReportInsightsCard } from "@/components/report-insights-card";
import { ReportViewerTabs } from "@/components/report-viewer-tabs";
import { SaveReportButton } from "@/components/save-report-button";
import type { FFLogsReportDetail } from "@/lib/fflogs/client";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: rawCode } = await params;
  const code = rawCode?.trim() ?? "";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/signin?redirect=/reports/${encodeURIComponent(code)}`);
  }

  const { data: tokenRow } = await supabase
    .from("user_fflogs_tokens")
    .select("access_token")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!tokenRow?.access_token) {
    return (
      <main className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-md space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Link your FFLogs account</CardTitle>
              <CardDescription>
                You need to link your FFLogs account to view reports. Go to the dashboard and connect FFLogs, then try again.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/dashboard/fflogs">Go to FFLogs dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (!code) {
    return (
      <main className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-md space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invalid report</CardTitle>
              <CardDescription>Report code is missing. Use a link from the dashboard or enter a valid report code.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/dashboard/fflogs">Back to My Reports</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const cacheKey = reportDetailCacheKey(code, "detail_meta");
  let report: FFLogsReportDetail | null = (await getCached<FFLogsReportDetail>(
    supabase,
    cacheKey,
  )) as FFLogsReportDetail | null;

  if (!report) {
    let fetchError: string | null = null;
    try {
      report = await fetchReportDetail(tokenRow.access_token, code, {
        includeFights: true,
        expandMeta: true,
      });
      await setCached(supabase, cacheKey, "report_detail", report, code);
    } catch (e) {
      fetchError = e instanceof Error ? e.message : "FFLogs request failed";
    }

    if (!report) {
      const { data: savedReport } = await supabase
        .from("fflogs_reports")
        .select("code, title, start_time_ms, end_time_ms")
        .eq("profile_id", user.id)
        .eq("code", code)
        .maybeSingle();

      return (
        <main className="min-h-screen bg-background p-6">
          <div className="mx-auto max-w-md space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Report not found or no access</CardTitle>
                <CardDescription className="space-y-2">
                  <span className="block">
                    {fetchError ?? "This report may be private, the code may be wrong, or FFLogs may be temporarily unavailable."}
                  </span>
                  {savedReport && (
                    <span className="block text-muted-foreground">
                      This report is saved in Hydaelyn for AI/import, but FFLogs did not return full data. You can view imported fight data from the dashboard.
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button variant="outline" asChild>
                  <Link href="/dashboard/fflogs">Back to My Reports</Link>
                </Button>
                {savedReport && (
                  <Button asChild>
                    <Link href="/dashboard/fflogs">Open FFLogs dashboard</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      );
    }
  }

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">← Dashboard</Link>
          </Button>
          <SaveReportButton reportCode={code} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{report.title || report.code}</CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>Report code: {report.code}</span>
              {report.owner && <span>· Owner: {report.owner.name}</span>}
              <span>· {new Date(report.startTime).toLocaleString()} – {new Date(report.endTime).toLocaleString()}</span>
              {report.zone && (report.zone as { name?: string }).name && (
                <span>· Zone: {(report.zone as { name: string }).name}</span>
              )}
              {report.region && (report.region as { name?: string }).name && (
                <span>· Region: {(report.region as { name: string }).name}</span>
              )}
              {report.guild && (report.guild as { name?: string }).name && (
                <span>· Guild: {(report.guild as { name: string }).name}</span>
              )}
              {report.visibility && (
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs capitalize">{report.visibility}</span>
              )}
            </CardDescription>
          </CardHeader>
        </Card>
        {report.fights && report.fights.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fights</CardTitle>
              <CardDescription>Encounters in this report.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {report.fights.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{f.name}</span>
                    <span className="text-muted-foreground">
                      {f.kill ? "Kill" : "Wipe"} ·{" "}
                      {((f.endTime - f.startTime) / 1000).toFixed(0)}s
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
        {(!report.fights || report.fights.length === 0) && (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No fights in this report.
            </CardContent>
          </Card>
        )}

        {report.fights && report.fights.length > 0 && (
          <ReportViewerTabs reportCode={code} fights={report.fights} reportStartTime={report.startTime} reportEndTime={report.endTime} />
        )}

        <ReportInsightsCard reportCode={code} />
      </div>
    </main>
  );
}
