/**
 * OpenAI TTS voices for Realtime and gpt-4o-mini-tts.
 * Use in Labz agent config, Verse voice preview, and batch preview scripts.
 *
 * @see https://platform.openai.com/docs/guides/text-to-speech
 */
export const OPENAI_VOICES = [
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "fable",
  "marin",
  "nova",
  "onyx",
  "sage",
  "shimmer",
  "verse",
  "cedar",
] as const;

export type OpenAIVoice = (typeof OPENAI_VOICES)[number];

/** Default sample phrase for voice preview */
export const VOICE_PREVIEW_PHRASE =
  "Hello, this is the {voice} voice from OpenAI.";

/** MNKY persona voice recommendations per the guide */
export const VOICE_PERSONA_HINTS: Partial<Record<OpenAIVoice, string>> = {
  nova: "Energetic digital assistant",
  sage: "Reflective, guidance tone",
  onyx: "Strong, executive feel",
  ash: "Smooth conversational",
};
