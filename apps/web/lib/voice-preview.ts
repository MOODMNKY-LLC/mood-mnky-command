/**
 * OpenAI voices supported by Realtime API (and gpt-4o-mini-tts).
 * Use in Labz agent config, Verse voice preview, and batch preview scripts.
 * Restricted to Realtime-supported set: alloy, ash, ballad, coral, echo,
 * sage, shimmer, verse, marin, cedar (no fable/nova/onyx).
 *
 * @see https://platform.openai.com/docs/guides/text-to-speech
 * @see https://platform.openai.com/docs/api-reference/realtime
 */
export const OPENAI_VOICES = [
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "sage",
  "shimmer",
  "verse",
  "marin",
  "cedar",
] as const;

export type OpenAIVoice = (typeof OPENAI_VOICES)[number];

/** Default sample phrase for voice preview */
export const VOICE_PREVIEW_PHRASE =
  "Hello, this is the {voice} voice from OpenAI.";

/** MNKY persona voice recommendations per the guide */
export const VOICE_PERSONA_HINTS: Partial<Record<OpenAIVoice, string>> = {
  sage: "Reflective, guidance tone",
  ash: "Smooth conversational",
  ballad: "Narrative, storytelling",
  coral: "Warm, friendly",
  marin: "Calm, reassuring",
};
