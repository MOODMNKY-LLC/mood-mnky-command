import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  uploadFile,
  saveMediaAsset,
  getPublicUrl,
  BUCKETS,
  type BucketId,
} from "@/lib/supabase/storage";
import { createSpeech } from "@/lib/openai/audio";
import type { TTSVoice, TTSFormat, TTSModel } from "@/lib/openai/audio";
import { OPENAI_VOICES } from "@/lib/voice-preview";

export const maxDuration = 60;

/** Realtime-supported voices (align with labz config) */
const VOICE_NAMES: TTSVoice[] = [...OPENAI_VOICES];

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    input: string;
    voice?: TTSVoice | string;
    model?: TTSModel;
    response_format?: TTSFormat;
    speed?: number;
    instructions?: string;
    saveToLibrary?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { input, voice, model, response_format, speed, instructions, saveToLibrary = true } = body;

  if (!input || typeof input !== "string") {
    return NextResponse.json({ error: "input is required" }, { status: 400 });
  }

  // ~4096 tokens ≈ ~16k chars; cap at 12k for safety
  if (input.length > 12000) {
    return NextResponse.json(
      { error: "Input text is too long. Maximum ~12,000 characters." },
      { status: 400 }
    );
  }

  const voiceParam: TTSVoice | { id: string } =
    typeof voice === "string" && !VOICE_NAMES.includes(voice as TTSVoice)
      ? { id: voice }
      : (VOICE_NAMES.includes(voice as TTSVoice) ? voice : "ballad") as TTSVoice;

  try {
    const buffer = await createSpeech({
      input,
      voice: voiceParam,
      model,
      response_format: response_format ?? "mp3",
      speed,
      instructions,
    });

    const ext = response_format ?? "mp3";
    const mimeType = ext === "mp3" ? "audio/mpeg" : ext === "wav" ? "audio/wav" : `audio/${ext}`;
    const timestamp = Date.now();
    const fileName = `tts-${timestamp}.${ext}`;

    if (!saveToLibrary) {
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": mimeType,
          "Content-Disposition": `inline; filename="${fileName}"`,
        },
      });
    }

    const { path } = await uploadFile(
      supabase,
      BUCKETS.aiAudio as BucketId,
      user.id,
      fileName,
      new Blob([buffer], { type: mimeType }),
      { contentType: mimeType }
    );

    const publicUrl = getPublicUrl(supabase, BUCKETS.aiAudio as BucketId, path);

    const asset = await saveMediaAsset(supabase, {
      user_id: user.id,
      bucket_id: BUCKETS.aiAudio,
      storage_path: path,
      file_name: fileName,
      mime_type: mimeType,
      file_size: buffer.length,
      public_url: publicUrl,
      category: "tts",
      source_model: model ?? "gpt-4o-mini-tts",
      generation_prompt: input,
      audio_codec: ext,
      tts_voice_id: typeof voiceParam === "string" ? voiceParam : voiceParam.id,
      tts_model: model ?? "gpt-4o-mini-tts",
      tts_instructions: instructions ?? undefined,
      tts_speed: speed ?? undefined,
    });

    return NextResponse.json({ asset });
  } catch (err) {
    console.error("Create speech error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate speech" },
      { status: 500 }
    );
  }
}
 
