/**
 * Prompt templates for AI-generated fragrance scene images.
 * Used in Studio to pre-fill prompts for mascot-in-scene imagery.
 */
export const FRAGRANCE_SCENE_PROMPTS: Record<string, string> = {
  "Caribbean Casita":
    "The MOOD MNKY mascot in a tropical Caribbean casita, palm trees swaying, ocean breeze, warm golden hour lighting, elegant candle on a wooden table, luxurious and relaxed atmosphere, photorealistic style",
  "Formal Affair":
    "The MOOD MNKY mascot at an elegant formal gala, ballroom setting, crystal chandeliers, sophisticated ambiance, luxury candle on marble surface, black-tie elegance, photorealistic style",
  "Parisian Cafe":
    "The MOOD MNKY mascot at a Parisian cafe terrace, croissants and espresso, classic Parisian architecture, wrought iron details, warm afternoon light, romantic and refined atmosphere, photorealistic style",
  "Marakesh Street Market":
    "The MOOD MNKY mascot in a vibrant Marrakesh street market, spices and textiles, colorful lanterns, exotic ambiance, artisan candle among market stalls, golden hour, photorealistic style",
  "Forest Chai":
    "The MOOD MNKY mascot in a cozy forest cabin, steaming chai, warm wood interiors, soft fireplace glow, woodland atmosphere, hygge aesthetic, photorealistic style",
  "Lavender Dreams":
    "The MOOD MNKY mascot in a lavender field at sunset, Provence-style, purple and gold tones, gentle breeze, romantic and peaceful, photorealistic style",
  "Beach House Cleansing":
    "The MOOD MNKY mascot at a serene beach house, ocean views, cool tranquility, cleansing candles, coastal minimalism, soft natural light, photorealistic style",
}

export function getPromptForFragrance(fragranceName: string): string {
  return FRAGRANCE_SCENE_PROMPTS[fragranceName] ?? `The MOOD MNKY mascot in a scene representing ${fragranceName}, elegant candle, warm ambient lighting, photorealistic style`
}
