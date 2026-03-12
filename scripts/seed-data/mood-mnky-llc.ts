/**
 * Seed data for MOOD MNKY LLC (first tenant / platform owner).
 * Source: docs.moodmnky.com (Brand Bible, welcome), docs/DESIGN-SYSTEM.md, apps/web/app/globals.css.
 * Used by provision-mt-tenant with --seed-organization when slug is mood-mnky.
 */

export const MOOD_MNKY_LLC_SLUG = "mood-mnky";
export const MOOD_MNKY_LLC_NAME = "MOOD MNKY LLC";

export type BrandCopyRow = { scope: string; key: string; content: string };
export type DesignTokenRow = { token_key: string; value: string; mode?: "light" | "dark"; palette?: string };
export type ContentRow = { content_type: string; slug?: string; key?: string; body: string; metadata?: Record<string, unknown> };

export const brandCopy: BrandCopyRow[] = [
  { scope: "main", key: "hero_headline", content: "Discover your scent. Define your mood." },
  { scope: "main", key: "hero_subline", content: "MOOD MNKY transforms self-care into a journey of personalized discovery through multi-sensory experiences that adapt to individual needs and foster authentic connection." },
  { scope: "dojo", key: "hero_headline", content: "The Dojo" },
  { scope: "dojo", key: "hero_subline", content: "Members' private hub—XP, quests, Blending Lab, MNKY CHAT, and preferences." },
  { scope: "labz", key: "hero_headline", content: "MNKY LABZ" },
  { scope: "labz", key: "hero_subline", content: "Command center for formulas, oils, glossary, Shopify Admin, and CODE MNKY." },
  { scope: "brand", key: "essence", content: "MOOD MNKY transforms self-care into a journey of personalized discovery through multi-sensory experiences that adapt to individual needs and foster authentic connection." },
  { scope: "brand", key: "value_proposition", content: "Accessible Premium Experience. Engaged Community. AI-Augmented Wellness. Multi-sensory Integration. Extreme Personalization." },
  { scope: "agents", key: "mood_mnky_description", content: "Your personal guide through the world of custom fragrances and self-care." },
  { scope: "agents", key: "sage_mnky_description", content: "Your mentor and guide through personalized learning experiences." },
  { scope: "agents", key: "code_mnky_description", content: "Your technical companion for development and infrastructure." },
  { scope: "verse", key: "tagline", content: "Web experiential portal—storefront, blog, agents, gamification, and fragrance tools. Always scentsing the MOOD." },
];

export const designTokens: DesignTokenRow[] = [
  { token_key: "--background", value: "0 0% 100%", mode: "light", palette: "main" },
  { token_key: "--foreground", value: "0 0% 3.9%", mode: "light", palette: "main" },
  { token_key: "--primary", value: "0 0% 25%", mode: "light", palette: "main" },
  { token_key: "--background", value: "0 0% 3.9%", mode: "dark", palette: "main" },
  { token_key: "--foreground", value: "0 0% 93%", mode: "dark", palette: "main" },
  { token_key: "--primary", value: "0 0% 65%", mode: "dark", palette: "main" },
  { token_key: "--verse-bg", value: "#f1f5f9", mode: "light", palette: "main" },
  { token_key: "--verse-text", value: "#0f172a", mode: "light", palette: "main" },
  { token_key: "--verse-bg", value: "#181619", mode: "dark", palette: "main" },
  { token_key: "--verse-text", value: "#c8c4c4", mode: "dark", palette: "main" },
  { token_key: "--background", value: "210 40% 97%", mode: "light", palette: "dojo" },
  { token_key: "--foreground", value: "222 47% 11%", mode: "light", palette: "dojo" },
  { token_key: "--primary", value: "215 20% 37%", mode: "light", palette: "dojo" },
  { token_key: "--background", value: "30 8% 9%", mode: "dark", palette: "dojo" },
  { token_key: "--foreground", value: "30 5% 78%", mode: "dark", palette: "dojo" },
  { token_key: "--primary", value: "213 24% 65%", mode: "dark", palette: "dojo" },
  { token_key: "--verse-bg", value: "#f1f5f9", mode: "light", palette: "dojo" },
  { token_key: "--verse-text", value: "#0f172a", mode: "light", palette: "dojo" },
  { token_key: "--verse-bg", value: "#181619", mode: "dark", palette: "dojo" },
  { token_key: "--verse-text", value: "#c8c4c4", mode: "dark", palette: "dojo" },
];

export const content: ContentRow[] = [
  {
    content_type: "mission_vision",
    key: "mission",
    body: "MOOD MNKY delivers unique value through accessible premium experience, engaged community, AI-augmented wellness, multi-sensory integration, and extreme personalization.",
  },
  {
    content_type: "mission_vision",
    key: "vision",
    body: "A technological organism that integrates physical products, digital experiences, and AI-driven personalization to transform self-care from a routine task into a meaningful, personalized journey.",
  },
  {
    content_type: "ecosystem",
    slug: "overview",
    body: "The MNKY VERSE brings together three complementary domains: the web experiential portal (storefront, blog, agents, gamification), The Dojo (members' hub with XP, quests, Blending Lab, MNKY CHAT), and MNKY LABZ (command center for formulas, oils, glossary, and CODE MNKY).",
  },
  {
    content_type: "brand_dna",
    key: "core_attributes",
    body: "Authentic: We embrace genuine expression over curated perfection. Exploratory: We approach every interaction with curiosity and encourage venturing beyond comfort zones. Adaptive: We create experiences that respond to individual contexts and evolve over time.",
    metadata: { source: "Brand Bible" },
  },
];
