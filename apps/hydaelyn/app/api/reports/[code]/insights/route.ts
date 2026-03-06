import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chatCompletion } from "@/lib/openai";
import { buildReportContext, serializeReportContextForPrompt } from "@/lib/fflogs/fight-context";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const INSIGHT_TYPES = ["summary", "briefing", "coaching"] as const;

function inputHash(reportCode: string, type: string, extra?: string): string {
  const str = `${reportCode}:${type}${extra ? `:${extra}` : ""}`;
  return crypto.createHash("sha256").update(str).digest("hex").slice(0, 32);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  if (!code) {
    return NextResponse.json({ error: "Missing report code" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { type?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const type = body.type ?? "summary";
  if (!INSIGHT_TYPES.includes(type as (typeof INSIGHT_TYPES)[number])) {
    return NextResponse.json(
      { error: `Invalid type. Use one of: ${INSIGHT_TYPES.join(", ")}` },
      { status: 400 },
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 503 },
    );
  }

  const hash = inputHash(code, type);

  const { data: existing } = await supabase
    .from("report_insights")
    .select("id, content, model_used")
    .eq("report_code", code)
    .eq("type", type)
    .eq("input_hash", hash)
    .maybeSingle();

  if (existing?.content) {
    return NextResponse.json({
      content: existing.content,
      model_used: existing.model_used,
      cached: true,
    });
  }

  const systemPrompt =
    type === "summary"
      ? "You are a helpful assistant that summarizes FFXIV raid reports from FFLogs. Be concise and focus on key pulls, wipes, and outcomes."
      : type === "briefing"
        ? "You are a raid lead assistant. Provide a short briefing style summary of an FFXIV raid report: main goals, notable pulls, and one or two takeaways."
        : "You are an FFXIV raid coach. Based on the report context, give brief coaching-style feedback: what went well and one concrete improvement suggestion.";

  let reportContextStr: string | null = null;
  try {
    const reportCtx = await buildReportContext(supabase, code, user.id);
    if (reportCtx && reportCtx.fights.length > 0) {
      reportContextStr = serializeReportContextForPrompt(reportCtx);
    }
  } catch {
    // proceed without context
  }

  const userPrompt = reportContextStr
    ? `Generate a ${type} for this FFLogs report. Use the following imported data:\n\n${reportContextStr}\n\nWrite your ${type} based on this data. Keep it under 300 words.`
    : `Generate a ${type} for FFLogs report code: ${code}. The user has access to this report; write as if summarizing or advising based on typical raid report data (pulls, wipes, kills, composition). Keep it under 300 words.`;

  try {
    const content = await chatCompletion(systemPrompt, userPrompt, {
      maxTokens: 500,
    });
    const modelUsed = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

    await supabase.from("report_insights").insert({
      report_code: code,
      type,
      input_hash: hash,
      content: { text: content },
      model_used: modelUsed,
    });

    return NextResponse.json({
      content: { text: content },
      model_used: modelUsed,
      cached: false,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "OpenAI request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const url = new URL(request.url);
  const type = url.searchParams.get("type") ?? "summary";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hash = inputHash(code, type);
  const { data } = await supabase
    .from("report_insights")
    .select("content, model_used")
    .eq("report_code", code)
    .eq("type", type)
    .eq("input_hash", hash)
    .maybeSingle();

  if (!data) {
    return NextResponse.json({ content: null, cached: false });
  }
  return NextResponse.json({
    content: data.content,
    model_used: data.model_used,
    cached: true,
  });
}
