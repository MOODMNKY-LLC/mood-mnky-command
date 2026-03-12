"use client";

import { useCallback } from "react";
import { SpeechInput } from "@/components/ai-elements/speech-input";
import { usePromptInputController } from "@/components/ai-elements/prompt-input";

const LABZ_TRANSCRIBE_API = "/api/labz/transcribe";

export type LabzVoiceInputProps = {
  /** Called when listening starts/stops; parent can sync dock persona (e.g. listening vs idle). */
  onListeningChange?: (listening: boolean) => void;
};

/**
 * Voice input for LABZ chat: appends transcriptions to the prompt input.
 * Uses Web Speech API when available; otherwise records and sends audio to OpenAI Whisper.
 */
export function LabzVoiceInput({ onListeningChange }: LabzVoiceInputProps = {}) {
  const { textInput } = usePromptInputController();

  const handleTranscriptionChange = useCallback(
    (text: string) => {
      if (!text?.trim()) return;
      const current = textInput.value.trim();
      const next = current ? `${current} ${text.trim()}` : text.trim();
      textInput.setInput(next);
    },
    [textInput]
  );

  const handleAudioRecorded = useCallback(async (audioBlob: Blob): Promise<string> => {
    const formData = new FormData();
    formData.append("file", audioBlob, "audio.webm");

    const res = await fetch(LABZ_TRANSCRIBE_API, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data as { error?: string }).error ?? "Transcription failed");
    }

    const data = (await res.json()) as { text?: string };
    return data.text ?? "";
  }, []);

  return (
    <SpeechInput
      aria-label="Voice input"
      className="shrink-0"
      lang="en-US"
      onAudioRecorded={handleAudioRecorded}
      onListeningChange={onListeningChange}
      onTranscriptionChange={handleTranscriptionChange}
      size="icon"
      variant="ghost"
    />
  );
}
