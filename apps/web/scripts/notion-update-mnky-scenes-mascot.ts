/**
 * Updates existing MNKY Scenes rows with Mascot Prompt, Fragrance Mood,
 * and Wardrobe Direction for each of the 6 fragrance scenes.
 *
 * Run: pnpm tsx scripts/notion-update-mnky-scenes-mascot.ts
 * Requires: NOTION_API_KEY, MNKY Scenes database shared with integration.
 */

import "dotenv/config";
import { Client } from "@notionhq/client";

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const MNKY_SCENES_DATA_SOURCE_ID = "b4910fa4-57cc-44dd-a321-ef27927dee86";

const MASCOT_UPDATES: Array<{
  sceneName: string;
  fragranceMood: string;
  wardrobeDirection: string;
  mascotPrompt: string;
}> = [
  {
    sceneName: "Parisian Cafe",
    fragranceMood: "Warm, refined, indulgent, charming, golden-hour elegance.",
    wardrobeDirection:
      "Tailored café intellectual; soft cream or warm beige vest variation; rolled sleeves optional; subtle gold pocket watch chain; polished shoes; relaxed but confident stance.",
    mascotPrompt: `Full-body stylized anime 3D render of the MOOD MNKY mascot character in a refined Paris café styling. Wearing a tailored cream waistcoat layered over a crisp white shirt with sleeves slightly rolled, fitted charcoal trousers, and polished black shoes. Subtle gold chain detail at the vest pocket. Relaxed confident stance with one hand adjusting cuff and slight smirk expression. Warm golden rim lighting accentuating silhouette edges. Clean sculpted fur, glossy fabric highlights, smooth gradient shading, strong key light with subtle cool rim separation. Unreal Engine quality, ultra-polished esports hero aesthetic, sharp edges, strong silhouette clarity, soft depth of field edge separation.

No text. No logos. No signage. No watermark.`,
  },
  {
    sceneName: "Forested Escape",
    fragranceMood: "Fresh, grounded, invigorating, woodland clarity.",
    wardrobeDirection:
      "Modern stylized hiker; fitted forest green jacket; utility straps; fingerless gloves; clean hiking boots; wind motion in hair.",
    mascotPrompt: `Full-body stylized anime 3D render of the MOOD MNKY mascot styled as a modern forest explorer. Wearing a fitted deep evergreen outdoor jacket with subtle tactical seams, dark utility trousers, clean hiking boots, and fingerless gloves. Confident upright stance on a natural surface with shoulders squared and chin slightly lifted. Subtle wind motion in hair and fur edges. Soft green volumetric rim light separating silhouette from background. Glossy stylized materials, clean sculpted forms, smooth gradient shading, strong natural key light with cool rim separation. Unreal Engine quality, polished esports hero aesthetic, strong silhouette readability.

No text. No logos. No signage. No watermark.`,
  },
  {
    sceneName: "Beach House Cleansing",
    fragranceMood: "Airy, serene, coastal calm, refined relaxation.",
    wardrobeDirection:
      "Relaxed open-collar linen shirt; light neutral tones; barefoot or minimal footwear; soft wind movement; calm posture.",
    mascotPrompt: `Full-body stylized anime 3D render of the MOOD MNKY mascot styled in refined coastal attire. Wearing a relaxed open-collar soft ivory linen shirt with rolled sleeves, light neutral trousers, barefoot stance on smooth surface. Calm confident posture with one hand loosely resting at side and gentle composed expression. Subtle lavender-toned ambient fill light with warm sun key lighting and cool rim separation. Clean glossy stylized surfaces, smooth gradient shading, high contrast silhouette edges. Unreal Engine quality, ultra-polished esports hero aesthetic, strong shape clarity and soft atmospheric depth.

No text. No logos. No signage. No watermark.`,
  },
  {
    sceneName: "Caribbean Casita",
    fragranceMood: "Bold, tropical, confident, spice and warmth.",
    wardrobeDirection:
      "Fitted lightweight open tropical shirt; leather bracelet accents; rolled sleeves; slightly more dynamic pose; playful but strong energy.",
    mascotPrompt: `Full-body stylized anime 3D render of the MOOD MNKY mascot styled in bold tropical attire. Wearing a fitted open-collar lightweight shirt in deep teal tone, sleeves rolled, layered with subtle leather wrist bands and dark fitted trousers. Slight forward stance with confident playful smirk and one foot angled outward. Subtle teal ambient glow blending with warm amber key light. Strong rim lighting separating silhouette. Glossy stylized materials, smooth gradient shading, sharp clean edges, Unreal Engine quality, high-polish esports hero aesthetic, strong silhouette clarity.

No text. No logos. No signage. No watermark.`,
  },
  {
    sceneName: "Formal Affair",
    fragranceMood: "Sharp, clean, commanding, masculine elegance.",
    wardrobeDirection:
      "Elevated black tux variation; matte + gloss contrast; buttoned vest; strong power stance; minimal expression.",
    mascotPrompt: `Full-body stylized anime 3D render of the MOOD MNKY mascot in elevated formal attire. Wearing a tailored black tuxedo with satin lapels, fitted vest fully buttoned, crisp white shirt, polished dress shoes. Strong upright stance with hands in pockets and controlled confident expression. Cool ozone-toned rim light outlining silhouette against darker environment. Dramatic high-contrast key lighting, glossy fabric highlights, smooth gradient shading, ultra-clean sculpted forms. Unreal Engine quality, esports hero aesthetic, sharp edges and bold silhouette clarity.

No text. No logos. No signage. No watermark.`,
  },
  {
    sceneName: "Marrakesh Street Market",
    fragranceMood: "Vibrant, energetic, citrus-spice, exotic warmth.",
    wardrobeDirection:
      "Lightweight tailored jacket with warm accent stitching; rolled sleeves; slight movement pose; animated expression; confident stride.",
    mascotPrompt: `Full-body stylized anime 3D render of the MOOD MNKY mascot styled for a vibrant market setting. Wearing a fitted lightweight jacket with warm saffron-toned accent stitching over a clean white shirt, dark tapered trousers, and sleek boots. Slight forward stride pose with energetic confident expression and one arm mid-motion. Warm golden key lighting with subtle orange ambient glow and cool rim separation for depth. Glossy stylized materials, smooth gradient shading, strong silhouette clarity, Unreal Engine quality, polished esports hero aesthetic.

No text. No logos. No signage. No watermark.`,
  },
];

function richText(content: string): { rich_text: Array<{ text: { content: string } }> } {
  return { rich_text: [{ text: { content } }] };
}

async function main() {
  if (!NOTION_API_KEY) {
    console.error("NOTION_API_KEY is required. Set it in .env or .env.local");
    process.exit(1);
  }

  const notion = new Client({ auth: NOTION_API_KEY });

  for (const scene of MASCOT_UPDATES) {
    const { results } = await notion.dataSources.query({
      data_source_id: MNKY_SCENES_DATA_SOURCE_ID,
      filter: {
        property: "Scene Name",
        title: { equals: scene.sceneName },
      },
      page_size: 1,
      result_type: "page",
    });

    if (results.length === 0) {
      console.warn(`No row found for scene: ${scene.sceneName}. Skipping.`);
      continue;
    }

    const pageId = results[0].id;
    await notion.pages.update({
      page_id: pageId,
      properties: {
        "Mascot Prompt": richText(scene.mascotPrompt),
        "Fragrance Mood": richText(scene.fragranceMood),
        "Wardrobe Direction": richText(scene.wardrobeDirection),
      },
    });
    console.log(`Updated mascot styling: ${scene.sceneName}`);
  }

  console.log("Done. All 6 scenes have Mascot Prompt, Fragrance Mood, and Wardrobe Direction.");
}

main();
