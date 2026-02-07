/**
 * Complete Whole Elise Formula Catalog
 * All 74 formulas from https://wholeelise.com/calculators/
 * Maps calculator names to blog URLs and tracks ingestion status
 */

export interface FormulaCatalogEntry {
  name: string
  slug: string
  category: "skincare" | "haircare" | "diy"
  calculatorUrl: string
  blogUrl: string
  status: "exists" | "missing" | "duplicate"
  notes?: string
}

/**
 * Convert formula name to URL slug
 * Handles special characters, quotes, apostrophes, plus signs
 */
export function formulaNameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['"]/g, "") // Remove quotes
    .replace(/\+/g, "plus") // Fix+ → fixplus
    .replace(/[^a-z0-9]+/g, "-") // Non-alphanumeric to hyphens
    .replace(/^-+|-+$/g, "") // Trim hyphens
}

/**
 * Generate blog URL from formula name
 * Tries common patterns: /blog/{slug}/ or /blog/{slug}-formula/
 */
export function generateBlogUrl(name: string, slug: string): string[] {
  const base = slug.replace(/-formula$/, "") // Remove trailing -formula if present
  return [`/blog/${base}/`, `/blog/${base}-formula/`, `/blog/${slug}/`]
}

// Existing formulas in seed_formulas.sql
const EXISTING_SLUGS = new Set([
  "whipped-body-butter",
  "emulsified-body-butter",
  "body-butter-bars",
  "lotion-bars",
  "candy-cane-whipped-butter",
  "whipped-shea-body-butter",
  "gingerbread-body-butter-bars",
  "peppermint-lip-scrub",
  "foaming-whipped-sugar-scrub",
  "shimmer-body-butter-bars",
  "natural-shampoo-bar",
])

export const FORMULA_CATALOG: FormulaCatalogEntry[] = [
  // SKINCARE (42 formulas)
  {
    name: "Candy Cane Whipped Butter Formula",
    slug: "candy-cane-whipped-butter",
    category: "skincare",
    calculatorUrl: "/calculators/candy-cane-whipped-butter-formula/",
    blogUrl: "/blog/candy-cane-whipped-butter/",
    status: "exists",
  },
  {
    name: "Gingerbread Body Butter Bars Formula",
    slug: "gingerbread-body-butter-bars",
    category: "skincare",
    calculatorUrl: "/calculators/gingerbread-body-butter-bars-formula/",
    blogUrl: "/blog/gingerbread-body-butter-bars/",
    status: "exists",
  },
  {
    name: "Body Butter Bronzer Formula",
    slug: "body-butter-bronzer",
    category: "skincare",
    calculatorUrl: "/calculators/body-butter-bronzer-formula/",
    blogUrl: "/blog/body-butter-bronzer/",
    status: "missing",
  },
  {
    name: "Body Balm Tube Formula",
    slug: "body-balm-tube",
    category: "skincare",
    calculatorUrl: "/calculators/body-balm-tube-formula/",
    blogUrl: "/blog/diy-body-balm-tube/",
    status: "missing",
  },
  {
    name: "Cleansing Balm Formula",
    slug: "cleansing-balm",
    category: "skincare",
    calculatorUrl: "/calculators/cleansing-balm-formula/",
    blogUrl: "/blog/cleansing-balm-formula/",
    status: "missing",
  },
  {
    name: "Homemade Body Cream Formula",
    slug: "homemade-body-cream",
    category: "skincare",
    calculatorUrl: "/calculators/homemade-body-cream-formula/",
    blogUrl: "/blog/homemade-body-cream-formula/",
    status: "missing",
  },
  {
    name: "Body Milk Lotion Formula",
    slug: "body-milk-lotion",
    category: "skincare",
    calculatorUrl: "/calculators/body-milk-lotion-formula/",
    blogUrl: "/blog/body-milk-lotion-formula/",
    status: "missing",
  },
  {
    name: "Basic Natural Face Cream",
    slug: "basic-natural-face-cream",
    category: "skincare",
    calculatorUrl: "/calculators/basic-natural-face-cream-formula/",
    blogUrl: "/blog/basic-natural-face-cream/",
    status: "missing",
  },
  {
    name: "Emulsified Body Butter Formula",
    slug: "emulsified-body-butter",
    category: "skincare",
    calculatorUrl: "/calculators/emulsified-body-butter-formula/",
    blogUrl: "/blog/emulsified-body-butter-formula/",
    status: "exists",
  },
  {
    name: "Cocoa Butter Hand Cream",
    slug: "cocoa-butter-hand-cream",
    category: "skincare",
    calculatorUrl: "/calculators/cocoa-butter-hand-cream-formula/",
    blogUrl: "/blog/cocoa-butter-hand-cream/",
    status: "missing",
  },
  {
    name: "Magnesium Oil Foot Butter",
    slug: "magnesium-oil-foot-butter",
    category: "skincare",
    calculatorUrl: "/calculators/magnesium-oil-foot-butter-formula/",
    blogUrl: "/blog/magnesium-oil-foot-butter/",
    status: "missing",
  },
  {
    name: "Emulsified Sugar Scrub",
    slug: "emulsified-sugar-scrub",
    category: "skincare",
    calculatorUrl: "/calculators/emulsified-sugar-scrub-formula/",
    blogUrl: "/blog/emulsified-sugar-scrub/",
    status: "missing",
  },
  {
    name: "Foaming Whipped Sugar Scrub",
    slug: "foaming-whipped-sugar-scrub",
    category: "skincare",
    calculatorUrl: "/calculators/foaming-whipped-sugar-scrub-formula/",
    blogUrl: "/blog/foaming-whipped-sugar-scrub/",
    status: "exists",
  },
  {
    name: "Body Butter Bars",
    slug: "body-butter-bars",
    category: "skincare",
    calculatorUrl: "/calculators/body-butter-bars-formula/",
    blogUrl: "/blog/body-butter-bars/",
    status: "exists",
  },
  {
    name: "Lotion Bars",
    slug: "lotion-bars",
    category: "skincare",
    calculatorUrl: "/calculators/lotion-bars-formula/",
    blogUrl: "/blog/lotion-bars/",
    status: "exists",
  },
  {
    name: "Hair Conditioner Bars",
    slug: "hair-conditioner-bars",
    category: "skincare",
    calculatorUrl: "/calculators/hair-conditioner-bars-formula/",
    blogUrl: "/blog/hair-conditioner-bars/",
    status: "missing",
  },
  {
    name: "DIY 'Mac' Fix+ Prep Prime Formula",
    slug: "diy-mac-fix-plus-prep-prime",
    category: "skincare",
    calculatorUrl: "/calculators/diy-mac-fix-plus-prep-prime-formula/",
    blogUrl: "/blog/diy-mac-fix-plus-prep-prime/",
    status: "missing",
  },
  {
    name: "Face Mist Formula",
    slug: "face-mist",
    category: "skincare",
    calculatorUrl: "/calculators/face-mist-formula/",
    blogUrl: "/blog/face-mist-formula/",
    status: "missing",
  },
  {
    name: "Lotion Formula",
    slug: "lotion-formula",
    category: "skincare",
    calculatorUrl: "/calculators/lotion-calculator/",
    blogUrl: "/blog/lotion-formula/",
    status: "missing",
  },
  {
    name: "DIY 'Fenty Skin' Fat Water Toner",
    slug: "diy-fenty-skin-fat-water-toner",
    category: "skincare",
    calculatorUrl: "/calculators/diy-fenty-skin-fat-water-toner-formula/",
    blogUrl: "/blog/diy-fenty-skin-fat-water-toner/",
    status: "missing",
  },
  {
    name: "In Shower Body Lotion Formula",
    slug: "in-shower-body-lotion",
    category: "skincare",
    calculatorUrl: "/calculators/in-shower-body-lotion-formula/",
    blogUrl: "/blog/in-shower-body-lotion/",
    status: "missing",
  },
  {
    name: "Shaving Cream",
    slug: "shaving-cream",
    category: "skincare",
    calculatorUrl: "/calculators/shaving-cream-formula/",
    blogUrl: "/blog/shaving-cream/",
    status: "missing",
  },
  {
    name: "Toner Serum Formula",
    slug: "toner-serum",
    category: "skincare",
    calculatorUrl: "/calculators/toner-serum-formula/",
    blogUrl: "/blog/toner-serum-formula/",
    status: "missing",
  },
  {
    name: "Creamy Body Wash",
    slug: "creamy-body-wash",
    category: "skincare",
    calculatorUrl: "/calculators/creamy-body-wash-formula/",
    blogUrl: "/blog/creamy-body-wash/",
    status: "missing",
  },
  {
    name: "DIY 'Body Shop' Body Butter",
    slug: "diy-body-shop-body-butter",
    category: "skincare",
    calculatorUrl: "/calculators/diy-body-shop-body-butter-formula/",
    blogUrl: "/blog/diy-body-shop-body-butter/",
    status: "missing",
  },
  {
    name: "Intensive Oat Lotion",
    slug: "intensive-oat-lotion",
    category: "skincare",
    calculatorUrl: "/calculators/intensive-oat-lotion-formula/",
    blogUrl: "/blog/intensive-oat-lotion/",
    status: "missing",
  },
  {
    name: "Luxury Hand Wash",
    slug: "luxury-hand-wash",
    category: "skincare",
    calculatorUrl: "/calculators/luxury-hand-wash-formula/",
    blogUrl: "/blog/luxury-hand-wash/",
    status: "missing",
  },
  {
    name: "DIY 'Aesop' Hand Wash",
    slug: "diy-aesop-hand-wash",
    category: "skincare",
    calculatorUrl: "/calculators/diy-aesop-hand-wash-formula/",
    blogUrl: "/blog/diy-aesop-hand-wash/",
    status: "missing",
  },
  {
    name: "Micellar Water Formula",
    slug: "micellar-water",
    category: "skincare",
    calculatorUrl: "/calculators/micellar-water-formula/",
    blogUrl: "/blog/micellar-water-formula/",
    status: "missing",
  },
  {
    name: "Natural Body Yogurt Formula",
    slug: "natural-body-yogurt",
    category: "skincare",
    calculatorUrl: "/calculators/natural-body-yogurt-formula/",
    blogUrl: "/blog/natural-body-yogurt/",
    status: "missing",
  },
  {
    name: "Non-Comedogenic Face Moisturiser",
    slug: "non-comedogenic-face-moisturiser",
    category: "skincare",
    calculatorUrl: "/calculators/non-comedogenic-face-moisturiser-formula/",
    blogUrl: "/blog/non-comedogenic-face-moisturiser/",
    status: "missing",
  },
  {
    name: "Oil Body Wash Formula",
    slug: "oil-body-wash",
    category: "skincare",
    calculatorUrl: "/calculators/oil-body-wash-formula/",
    blogUrl: "/blog/oil-body-wash/",
    status: "missing",
  },
  {
    name: "Oil-Free Face Cleanser",
    slug: "oil-free-face-cleanser",
    category: "skincare",
    calculatorUrl: "/calculators/oil-free-face-cleanser-formula/",
    blogUrl: "/blog/oil-free-face-cleanser/",
    status: "missing",
  },
  {
    name: "Orange Clove Hand Lotion",
    slug: "orange-clove-hand-lotion",
    category: "skincare",
    calculatorUrl: "/calculators/orange-clove-hand-lotion-formula/",
    blogUrl: "/blog/orange-clove-hand-lotion/",
    status: "missing",
  },
  {
    name: "Peppermint Lip Scrub Formula",
    slug: "peppermint-lip-scrub",
    category: "skincare",
    calculatorUrl: "/calculators/peppermint-lip-scrub-formula/",
    blogUrl: "/blog/peppermint-lip-scrub/",
    status: "exists",
  },
  {
    name: "Shimmer Body Butter Bars",
    slug: "shimmer-body-butter-bars",
    category: "skincare",
    calculatorUrl: "/calculators/shimmer-body-butter-bars-formula/",
    blogUrl: "/blog/shimmer-body-butter-bars/",
    status: "exists",
  },
  {
    name: "Shimmer Body Lotion Formula",
    slug: "shimmer-body-lotion",
    category: "skincare",
    calculatorUrl: "/calculators/shimmer-body-lotion-formula/",
    blogUrl: "/blog/shimmer-body-lotion/",
    status: "missing",
  },
  {
    name: "Shimmer Oil Formula",
    slug: "shimmer-oil",
    category: "skincare",
    calculatorUrl: "/calculators/shimmer-oil-formula/",
    blogUrl: "/blog/shimmer-oil/",
    status: "missing",
  },
  {
    name: "Whipped Body Butter",
    slug: "whipped-body-butter",
    category: "skincare",
    calculatorUrl: "/calculators/whipped-body-butter-formula/",
    blogUrl: "/blog/whipped-body-butter/",
    status: "exists",
  },
  {
    name: "Whipped Butter Formula",
    slug: "whipped-butter",
    category: "skincare",
    calculatorUrl: "/calculators/whipped-butter-formula/",
    blogUrl: "/blog/whipped-butter/",
    status: "missing",
  },
  {
    name: "Whipped Shea Body Butter Formula",
    slug: "whipped-shea-body-butter",
    category: "skincare",
    calculatorUrl: "/calculators/whipped-shea-body-butter-formula/",
    blogUrl: "/blog/whipped-shea-body-butter/",
    status: "exists",
  },
  {
    name: "Winter Face Moisturiser",
    slug: "winter-face-moisturiser",
    category: "skincare",
    calculatorUrl: "/calculators/winter-face-moisturiser-formula/",
    blogUrl: "/blog/winter-face-moisturiser/",
    status: "missing",
  },

  // HAIRCARE (26 formulas)
  {
    name: "Ayurvedic Hair Butter Formula",
    slug: "ayurvedic-hair-butter",
    category: "haircare",
    calculatorUrl: "/calculators/ayurvedic-hair-butter-formula/",
    blogUrl: "/blog/ayurvedic-hair-butter/",
    status: "missing",
  },
  {
    name: "Ayurvedic Hair Cream Formula",
    slug: "ayurvedic-hair-cream",
    category: "haircare",
    calculatorUrl: "/calculators/ayurvedic-hair-cream-formula/",
    blogUrl: "/blog/ayurvedic-hair-cream/",
    status: "missing",
  },
  {
    name: "Ayurvedic Hair Oil Formula",
    slug: "ayurvedic-hair-oil",
    category: "haircare",
    calculatorUrl: "/calculators/ayurvedic-hair-oil-formula/",
    blogUrl: "/blog/ayurvedic-hair-oil/",
    status: "missing",
  },
  {
    name: "Curl Defining Hair Gel",
    slug: "curl-defining-hair-gel",
    category: "haircare",
    calculatorUrl: "/calculators/curl-defining-hair-gel-formula/",
    blogUrl: "/blog/curl-defining-hair-gel/",
    status: "missing",
  },
  {
    name: "Deep Conditioning Hair Mask",
    slug: "deep-conditioning-hair-mask",
    category: "haircare",
    calculatorUrl: "/calculators/deep-conditioning-hair-mask-formula/",
    blogUrl: "/blog/deep-conditioning-hair-mask/",
    status: "missing",
  },
  {
    name: "DIY Eco Styler Gel",
    slug: "diy-eco-styler-gel",
    category: "haircare",
    calculatorUrl: "/calculators/diy-eco-styler-gel-formula/",
    blogUrl: "/blog/diy-eco-styler-gel/",
    status: "missing",
  },
  {
    name: "DIY Hair Grease",
    slug: "diy-hair-grease",
    category: "haircare",
    calculatorUrl: "/calculators/diy-hair-grease-formula/",
    blogUrl: "/blog/diy-hair-grease/",
    status: "missing",
  },
  {
    name: "DIY Hair Serum Formula",
    slug: "diy-hair-serum",
    category: "haircare",
    calculatorUrl: "/calculators/diy-hair-serum-formula/",
    blogUrl: "/blog/diy-hair-serum/",
    status: "missing",
  },
  {
    name: "DIY Moroccan Oil Treatment",
    slug: "diy-moroccan-oil-treatment",
    category: "haircare",
    calculatorUrl: "/calculators/diy-moroccan-oil-treatment-formula/",
    blogUrl: "/blog/diy-moroccan-oil-treatment/",
    status: "missing",
  },
  {
    name: "DIY 'Shea Moisture' Deep Conditioner",
    slug: "diy-shea-moisture-deep-conditioner",
    category: "haircare",
    calculatorUrl: "/calculators/diy-shea-moisture-deep-conditioner-formula/",
    blogUrl: "/blog/diy-shea-moisture-deep-conditioner/",
    status: "missing",
  },
  {
    name: "Hair and Scalp Balm Formula",
    slug: "hair-and-scalp-balm",
    category: "haircare",
    calculatorUrl: "/calculators/hair-and-scalp-balm-formula/",
    blogUrl: "/blog/hair-and-scalp-balm/",
    status: "missing",
  },
  {
    name: "Hair Conditioner Bars",
    slug: "hair-conditioner-bars",
    category: "haircare",
    calculatorUrl: "/calculators/hair-conditioner-bars-formula/",
    blogUrl: "/blog/hair-conditioner-bars/",
    status: "missing",
  },
  {
    name: "Hair Conditioner",
    slug: "hair-conditioner",
    category: "haircare",
    calculatorUrl: "/calculators/hair-conditioner-formula/",
    blogUrl: "/blog/hair-conditioner/",
    status: "missing",
  },
  {
    name: "Hair Pomade",
    slug: "hair-pomade",
    category: "haircare",
    calculatorUrl: "/calculators/hair-pomade-formula/",
    blogUrl: "/blog/hair-pomade/",
    status: "missing",
  },
  {
    name: "Hair Shine Spray",
    slug: "hair-shine-spray",
    category: "haircare",
    calculatorUrl: "/calculators/hair-shine-spray-formula/",
    blogUrl: "/blog/hair-shine-spray/",
    status: "missing",
  },
  {
    name: "Leave-In Conditioner",
    slug: "leave-in-conditioner",
    category: "haircare",
    calculatorUrl: "/calculators/leave-in-conditioner-formula/",
    blogUrl: "/blog/leave-in-conditioner/",
    status: "missing",
  },
  {
    name: "Leave In Conditioning Spray",
    slug: "leave-in-conditioning-spray",
    category: "haircare",
    calculatorUrl: "/calculators/leave-in-conditioning-spray-formula/",
    blogUrl: "/blog/leave-in-conditioning-spray/",
    status: "missing",
  },
  {
    name: "Lightweight Hair Oil Formula",
    slug: "lightweight-hair-oil",
    category: "haircare",
    calculatorUrl: "/calculators/lightweight-hair-oil-formula/",
    blogUrl: "/blog/lightweight-hair-oil/",
    status: "missing",
  },
  {
    name: "Mango Hair Butter",
    slug: "mango-hair-butter",
    category: "haircare",
    calculatorUrl: "/calculators/mango-hair-butter-formula/",
    blogUrl: "/blog/mango-hair-butter/",
    status: "missing",
  },
  {
    name: "Moisturising Hair Cream",
    slug: "moisturising-hair-cream",
    category: "haircare",
    calculatorUrl: "/calculators/moisturising-hair-cream-formula/",
    blogUrl: "/blog/moisturising-hair-cream/",
    status: "missing",
  },
  {
    name: "Moisturising Shampoo",
    slug: "moisturising-shampoo",
    category: "haircare",
    calculatorUrl: "/calculators/moisturising-shampoo-formula/",
    blogUrl: "/blog/moisturising-shampoo/",
    status: "missing",
  },
  {
    name: "Natural Clarifying Shampoo",
    slug: "natural-clarifying-shampoo",
    category: "haircare",
    calculatorUrl: "/calculators/natural-clarifying-shampoo-formula/",
    blogUrl: "/blog/natural-clarifying-shampoo/",
    status: "missing",
  },
  {
    name: "Natural Hair Grease",
    slug: "natural-hair-grease",
    category: "haircare",
    calculatorUrl: "/calculators/natural-hair-grease-formula/",
    blogUrl: "/blog/natural-hair-grease/",
    status: "missing",
  },
  {
    name: "Natural Shampoo Bar Formula",
    slug: "natural-shampoo-bar",
    category: "haircare",
    calculatorUrl: "/calculators/natural-shampoo-bar-formula/",
    blogUrl: "/blog/natural-shampoo-bar/",
    status: "exists",
  },
  {
    name: "Shea Butter Edge Control",
    slug: "shea-butter-edge-control",
    category: "haircare",
    calculatorUrl: "/calculators/shea-butter-edge-control-formula/",
    blogUrl: "/blog/shea-butter-edge-control/",
    status: "missing",
  },
  {
    name: "Strengthening Deep Conditioner",
    slug: "strengthening-deep-conditioner",
    category: "haircare",
    calculatorUrl: "/calculators/strengthening-deep-conditioner-formula/",
    blogUrl: "/blog/strengthening-deep-conditioner/",
    status: "missing",
  },

  // DIY (6 formulas - some are duplicates)
  {
    name: "Body Butter Bars",
    slug: "body-butter-bars",
    category: "diy",
    calculatorUrl: "/calculators/body-butter-bars-formula/",
    blogUrl: "/blog/body-butter-bars/",
    status: "duplicate",
    notes: "Duplicate of skincare version",
  },
  {
    name: "DIY 'Aesop' Hand Wash",
    slug: "diy-aesop-hand-wash",
    category: "diy",
    calculatorUrl: "/calculators/diy-aesop-hand-wash-formula/",
    blogUrl: "/blog/diy-aesop-hand-wash/",
    status: "duplicate",
    notes: "Duplicate of skincare version",
  },
  {
    name: "DIY 'Body Shop' Body Butter",
    slug: "diy-body-shop-body-butter",
    category: "diy",
    calculatorUrl: "/calculators/diy-body-shop-body-butter-formula/",
    blogUrl: "/blog/diy-body-shop-body-butter/",
    status: "duplicate",
    notes: "Duplicate of skincare version",
  },
  {
    name: "DIY Tinted Lip Balm",
    slug: "diy-tinted-lip-balm",
    category: "diy",
    calculatorUrl: "/calculators/diy-tinted-lip-balm-formula/",
    blogUrl: "/blog/diy-tinted-lip-balm/",
    status: "missing",
  },
  {
    name: "DIY Vegan Lip Balm",
    slug: "diy-vegan-lip-balm",
    category: "diy",
    calculatorUrl: "/calculators/diy-vegan-lip-balm-formula/",
    blogUrl: "/blog/diy-vegan-lip-balm/",
    status: "missing",
  },
  {
    name: "Shimmer Body Butter Bars",
    slug: "shimmer-body-butter-bars",
    category: "diy",
    calculatorUrl: "/calculators/shimmer-body-butter-bars-formula/",
    blogUrl: "/blog/shimmer-body-butter-bars/",
    status: "duplicate",
    notes: "Duplicate of skincare version",
  },
]

// Helper to get missing formulas by category
export function getMissingFormulas(category?: "skincare" | "haircare" | "diy"): FormulaCatalogEntry[] {
  return FORMULA_CATALOG.filter(
    (f) => f.status === "missing" && (!category || f.category === category)
  )
}

// Helper to get all formulas by category
export function getFormulasByCategory(category: "skincare" | "haircare" | "diy"): FormulaCatalogEntry[] {
  return FORMULA_CATALOG.filter((f) => f.category === category)
}
