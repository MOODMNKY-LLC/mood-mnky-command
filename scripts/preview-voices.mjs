#!/usr/bin/env node
/**
 * Batch generate MP3 previews for all OpenAI TTS voices.
 * Run: OPENAI_API_KEY=your_key node scripts/preview-voices.mjs
 * Or: pnpm exec dotenv -e .env.local -- node scripts/preview-voices.mjs
 *
 * Output: ./{voice}.mp3 for each voice in ./voice-previews/
 */
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const VOICES = [
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
];

const OUT_DIR = path.join(process.cwd(), "voice-previews");

if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY is required");
  process.exit(1);
}

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

for (const voice of VOICES) {
  try {
    const response = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice,
      input: `Hello, this is the ${voice} voice from OpenAI.`,
    });
    const buffer = Buffer.from(await response.arrayBuffer());
    const outPath = path.join(OUT_DIR, `${voice}.mp3`);
    fs.writeFileSync(outPath, buffer);
    console.log(`Generated ${voice}.mp3`);
  } catch (err) {
    console.error(`Failed ${voice}:`, err.message);
  }
}

console.log(`\nDone. Files saved to ${OUT_DIR}/`);
