/**
 * Creates 6 fragrance scene rows in the MNKY Scenes database with
 * Scene Prompt, palettes, notes, Style Anchor, and Style Version.
 *
 * Run: pnpm tsx scripts/notion-seed-mnky-scenes.ts
 * Requires: NOTION_API_KEY in .env or .env.local
 * Prerequisite: MNKY Scenes database must be shared with your Notion integration.
 */

import "dotenv/config";
import { Client } from "@notionhq/client";

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const MNKY_SCENES_DATABASE_ID = "ba157ea97eee4983bcdcf81c71645d7b";

const UNIFIED_STYLE_ANCHOR =
  "Semi-realistic anime proportions, slightly exaggerated forms, clean stylized geometry, glossy highlights on surfaces, strong key light + cool rim separation, smooth gradient shading, hyper-polished materials, Unreal Engine / high-end game render feel, esports hero aesthetic, strong silhouette clarity, subtle depth haze, controlled depth of field, no painterly textures, no photorealism grain, ultra-clean surfaces.";

const SCENES: Array<{
  sceneName: string;
  dominantPalette: string; // existing DB select: Yellow | Evergreen | Lavender | Teal | Monochrome | Terracotta
  secondaryPalette: string[];
  topNotes: string[];
  middleNotes: string[];
  baseNotes: string[];
  scenePrompt: string;
}> = [
  {
    sceneName: "Parisian Cafe",
    dominantPalette: "Yellow",
    secondaryPalette: ["Soft Sky Blue", "Cream", "Warm Brown Wood"],
    topNotes: ["Lemon", "Bergamot", "Cake"],
    middleNotes: ["Butter", "Honey", "Amber"],
    baseNotes: ["Vanilla", "Tonka Bean", "Dark Musk"],
    scenePrompt: `A 16:9 stylized anime café interior at golden hour, dominated by warm butter-yellow and golden crema tones. Marble bistro table in the foreground with freshly sliced lemon wedges and bergamot zest scattered naturally beside a delicate vanilla sponge cake glazed with honey drizzle. A small glass dish of melted butter catching strong warm highlights. Amber-toned glass votives softly glowing in the midground. Whole vanilla pods and tonka beans resting near a porcelain espresso cup. A subtle dark musk gradient shadow grounding the lower frame.

Cinematic semi-realistic anime 3D rendering in the same polished style as a premium mascot character, Unreal Engine quality, ultra-clean materials, glossy high-contrast surfaces, sharp edges, smooth gradient shading, dramatic warm key light with subtle cool blue rim light separation, volumetric light shafts, strong silhouette clarity, stylized but not photorealistic, esports hero aesthetic.

No people. No signage. No text. No labels. No logos. No watermark.`,
  },
  {
    sceneName: "Forested Escape",
    dominantPalette: "Evergreen",
    secondaryPalette: ["Cedar Brown", "Deep Pine", "Misty Sage"],
    topNotes: ["Camphor", "Citrus", "Cypress"],
    middleNotes: ["Pear", "Pine", "Evergreen", "Cedar"],
    baseNotes: ["Juniper", "Sage", "Moss"],
    scenePrompt: `A 16:9 stylized anime forest clearing dominated by luminous moss green and evergreen tones. Soft sunlight filtering through cypress trees with volumetric light beams. Fresh pear slices resting on a natural cedar wood stump. Pine needles and evergreen branches framing the composition. Juniper berries and sage leaves scattered naturally on damp moss. Subtle camphor resin textures embedded in bark surfaces. Light citrus peel resting near moss-covered stones. Misty atmosphere with layered depth and controlled negative space centered.

Cinematic semi-realistic anime 3D environment rendering matching a high-polish mascot character style, Unreal Engine quality, glossy stylized materials, smooth gradient shading, strong key lighting with subtle cool rim separation, sharp clean edges, exaggerated but clean forms, strong silhouette readability, esports hero lighting aesthetic.

No people. No signage. No text. No labels. No logos. No watermark.`,
  },
  {
    sceneName: "Beach House Cleansing",
    dominantPalette: "Lavender",
    secondaryPalette: ["Sand Beige", "Muted Coastal White", "Soft Sage Green", "Driftwood Brown", "Smoky Amber"],
    topNotes: ["Lavender", "Citrus", "Cardamom"],
    middleNotes: ["Chamomile", "Sage", "Rosemary", "Saffron"],
    baseNotes: ["Cedar", "Sandalwood", "Smoke", "Amber"],
    scenePrompt: `A 16:9 stylized anime coastal beach house interior dominated by soft lavender and warm sand tones. Driftwood table with bundles of fresh lavender and chamomile blossoms arranged naturally. Citrus slices and cracked green cardamom pods resting nearby. Sage and rosemary sprigs gently layered across smooth cedar planks. A subtle saffron thread detail catching light. Soft amber glow near a sandalwood surface with faint atmospheric smoke wisps drifting upward. Coastal white walls and sheer curtains illuminated by warm natural sunlight. Clean centered negative space.

Cinematic semi-realistic anime 3D environment rendering in polished mascot style, Unreal Engine quality, glossy stylized surfaces, smooth gradients, high-contrast lighting, warm natural key light with subtle cool rim separation, volumetric haze, strong silhouette clarity, esports hero aesthetic.

No people. No signage. No text. No labels. No logos. No watermark.`,
  },
  {
    sceneName: "Caribbean Casita",
    dominantPalette: "Teal",
    secondaryPalette: ["Warm Stone", "Deep Palm Green", "Amber Brown"],
    topNotes: ["Leather", "Allspice", "Pineapple"],
    middleNotes: ["Lavender", "Bamboo", "Teakwood", "Clove"],
    baseNotes: ["Peppercorn", "Sandalwood", "Amber", "Dark Musk"],
    scenePrompt: `A 16:9 stylized anime tropical courtyard dominated by vibrant teal and aqua tones. Warm stone walls and bamboo elements framing the composition. Fresh pineapple slices arranged on a teakwood table. Whole allspice berries and clove buds scattered naturally across the surface. Subtle leather texture draped across a chair arm. Lavender sprigs softening the scene. Black peppercorns resting near smooth sandalwood pieces. Amber glass reflecting sunlight with a faint dark musk gradient grounding the lower frame. Palm shadows cast across turquoise stone.

Cinematic semi-realistic anime 3D rendering matching high-polish mascot character style, Unreal Engine quality, glossy stylized materials, strong key lighting, cool rim light separation, sharp silhouette forms, smooth gradient shading, high dynamic range lighting, esports hero aesthetic.

No people. No signage. No text. No labels. No logos. No watermark.`,
  },
  {
    sceneName: "Formal Affair",
    dominantPalette: "Monochrome",
    secondaryPalette: ["Silver Grey", "Cool Blue Highlight", "Warm Amber Accent"],
    topNotes: ["Sage", "Grapefruit", "Ozone"],
    middleNotes: ["Lavender", "Sea Salt", "Eucalyptus"],
    baseNotes: ["Amber", "Oakmoss", "Sandalwood"],
    scenePrompt: `A 16:9 stylized anime luxury formal interior dominated by deep charcoal and graphite tones with crisp white contrast. Polished black marble table reflecting soft cool highlights. Fresh grapefruit slices arranged beside eucalyptus leaves and sage sprigs. Sea salt crystals resting on smooth stone. Lavender stems placed elegantly near brushed metal accents. Oakmoss and sandalwood pieces subtly layered in the background. Warm amber glow contrasting cool ozone-toned light beams. Strong negative space centered for subject placement.

Cinematic semi-realistic anime 3D rendering in the same polished mascot aesthetic, Unreal Engine quality, ultra-clean glossy materials, sharp edges, smooth gradient shading, dramatic high-contrast key light with subtle blue rim separation, strong silhouette clarity, esports hero lighting style.

No people. No signage. No text. No labels. No logos. No watermark.`,
  },
  {
    sceneName: "Marrakesh Street Market",
    dominantPalette: "Terracotta",
    secondaryPalette: ["Rich Red", "Golden Yellow", "Earthy Brown"],
    topNotes: ["Lemon", "Grapefruit", "Orange Peel"],
    middleNotes: ["Ginger", "Green Leaves", "Lemon Verbena"],
    baseNotes: ["Saffron", "Vetiver", "Cedar"],
    scenePrompt: `A 16:9 stylized anime market courtyard dominated by deep saffron and burnt orange tones. Clay bowls filled with bright lemon peel, grapefruit slices, and fresh orange zest. Ginger root arranged beside vibrant green leaves and lemon verbena sprigs. Loose saffron threads catching warm sunlight. Vetiver roots and cedar wood pieces grounding the composition. Rich textured fabric draped softly in the background. Warm clay walls reflecting golden light. Clean centered negative space for subject placement.

Cinematic semi-realistic anime 3D environment rendering matching polished mascot character style, Unreal Engine quality, glossy stylized materials, smooth gradients, high-contrast lighting, dramatic warm key light with cool rim separation, strong silhouette clarity, esports hero aesthetic.

No people. No signage. No text. No labels. No logos. No watermark.`,
  },
];

function buildProperties(
  scene: (typeof SCENES)[0]
): Record<string, Record<string, unknown>> {
  return {
    "Scene Name": {
      title: [{ text: { content: scene.sceneName } }],
    },
    "Scene Prompt": {
      rich_text: [{ text: { content: scene.scenePrompt } }],
    },
    "Style Anchor": {
      rich_text: [{ text: { content: UNIFIED_STYLE_ANCHOR } }],
    },
    "Style Version": {
      select: { name: "Anime Unified" },
    },
    Status: {
      select: { name: "Draft" },
    },
    "Aspect Ratio": {
      select: { name: "16:9" },
    },
    "Dominant Palette": {
      select: { name: scene.dominantPalette },
    },
    "Secondary Palette": {
      multi_select: scene.secondaryPalette.map((name) => ({ name })),
    },
    "Top Notes": {
      multi_select: scene.topNotes.map((name) => ({ name })),
    },
    "Middle Notes": {
      multi_select: scene.middleNotes.map((name) => ({ name })),
    },
    "Base Notes": {
      multi_select: scene.baseNotes.map((name) => ({ name })),
    },
    "Hero Ready": {
      checkbox: false,
    },
  };
}

async function main() {
  if (!NOTION_API_KEY) {
    console.error("NOTION_API_KEY is required. Set it in .env or .env.local");
    process.exit(1);
  }

  const notion = new Client({ auth: NOTION_API_KEY });

  for (const scene of SCENES) {
    try {
      await notion.pages.create({
        parent: { database_id: MNKY_SCENES_DATABASE_ID },
        properties: buildProperties(scene) as Parameters<
          typeof notion.pages.create
        >[0]["properties"],
      });
      console.log(`Created in MNKY Scenes: ${scene.sceneName}`);
    } catch (err) {
      console.error(`Failed for ${scene.sceneName}:`, err);
      throw err;
    }
  }

  console.log("Done. All 6 scenes created in MNKY Scenes with full properties.");
}

main();
