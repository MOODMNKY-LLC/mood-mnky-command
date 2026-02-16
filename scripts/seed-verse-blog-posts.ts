/**
 * Seed MNKY VERSE Blog with intro posts.
 * Run: pnpm verse:seed-blog
 * Requires: NOTION_API_KEY in .env or .env.local (MNKY MIND key from Notion Credentials)
 */

import "./env-loader"
import {
  createPageInDatabase,
  NOTION_DATABASE_IDS,
  richTextChunks,
  isConfigured,
} from "../lib/notion"

const NOTION_API_KEY = process.env.NOTION_API_KEY
const NOTION_BASE = "https://api.notion.com/v1"

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

/** Convert markdown-ish content to Notion blocks (paragraph, heading_1, heading_2) */
function mdToBlocks(md: string): Array<Record<string, unknown>> {
  const blocks: Array<Record<string, unknown>> = []
  const lines = md.split(/\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (trimmed.startsWith("### ")) {
      blocks.push({
        object: "block",
        type: "heading_3",
        heading_3: {
          rich_text: [{ type: "text", text: { content: trimmed.slice(4) } }],
        },
      })
    } else if (trimmed.startsWith("## ")) {
      blocks.push({
        object: "block",
        type: "heading_2",
        heading_2: {
          rich_text: [{ type: "text", text: { content: trimmed.slice(3) } }],
        },
      })
    } else if (trimmed.startsWith("# ")) {
      blocks.push({
        object: "block",
        type: "heading_1",
        heading_1: {
          rich_text: [{ type: "text", text: { content: trimmed.slice(2) } }],
        },
      })
    } else if (trimmed.startsWith("- ")) {
      blocks.push({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [{ type: "text", text: { content: trimmed.slice(2) } }],
        },
      })
    } else {
      blocks.push({
        object: "block",
        type: "paragraph",
        paragraph: {
          rich_text: [{ type: "text", text: { content: trimmed } }],
        },
      })
    }
  }
  return blocks
}

async function appendBlocksToPage(pageId: string, blocks: Array<Record<string, unknown>>) {
  const url = `${NOTION_BASE}/blocks/${pageId}/children`
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ children: blocks }),
    cache: "no-store",
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Append blocks failed: ${res.status} ${err}`)
  }
}

const POSTS = [
  {
    title: "Welcome to MNKY VERSE",
    slug: "welcome-to-mnky-verse",
    excerpt: "Your portal to fragrance discovery, blending, and the art of scenting your mood. Meet the features that make MNKY VERSE unique.",
    order: 1,
    publishedDate: "2025-02-16",
    content: `# Welcome to MNKY VERSE

MNKY VERSE **scents the mood**. It's your portal to the universe of fragrances—where discovery, education, and intention meet.

## What is MNKY VERSE?

MNKY VERSE is a fragrance discovery and self-care app by MOOD MNKY. Whether you're new to perfumery or a seasoned enthusiast, the portal gives you tools to explore scent families, learn how fragrances work together, and curate your own ritual.

## What You'll Find Here

- Shop Products — Bespoke fragrances and self-care rituals from MOOD MNKY
- Explore Fragrances — A glossary of notes, educational content, and olfactive profiles
- AI Chat — Meet SAGE MNKY and MOOD MNKY, AI guides for personalized discovery
- Fragrance Wheel — Interactive scent families: floral, oriental, woody, fresh
- Blending Guide — Learn how top, middle, and base notes layer and harmonize
- Profile — Save your preferences and track your scent journey

## Start Your Journey

Head to the Fragrance Wheel to explore families, or chat with SAGE MNKY to find your next favorite scent. The universe of scents is waiting.`,
  },
  {
    title: "Understanding the Fragrance Wheel",
    slug: "understanding-fragrance-wheel",
    excerpt: "A guide to the major fragrance families—floral, oriental, woody, fresh—and how the MNKY VERSE Fragrance Wheel helps you discover your preferences.",
    order: 2,
    publishedDate: "2025-02-16",
    content: `# Understanding the Fragrance Wheel

The fragrance wheel organizes scents into families that share common characteristics. Knowing them helps you navigate the vast world of perfumery—and the MNKY VERSE Fragrance Wheel lets you explore them interactively.

## Major Olfactive Families

Floral — Rose, jasmine, iris. Romance and softness.

Oriental — Amber, vanilla, spice. Warmth and depth.

Woody — Cedar, sandalwood, vetiver. Grounding and comfort.

Fresh — Citrus, aquatic, green. Energy and clarity.

## How the Wheel Works

In MNKY VERSE, each segment of the wheel represents a family. Click a segment to see kindred notes (similar profiles) and complementary notes (contrast and balance). Use this to find new directions for your scent journey.

## Next Steps

Visit the Fragrance Wheel and click around. Pair it with the Blending Guide when you're ready to layer.`,
  },
  {
    title: "Blending Lab Basics: Craft Your Signature Scent",
    slug: "blending-lab-basics",
    excerpt: "Perfumes are built in layers. Learn top, middle, and base notes—and how to experiment in the MNKY VERSE Blending Lab.",
    order: 3,
    publishedDate: "2025-02-16",
    content: `# Blending Lab Basics

Perfumes are built in layers. Understanding top, middle, and base notes is the first step to crafting your signature scent.

## The Three Layers

Top notes — Hit first. Citrus, herbs, light accords. They fade within 15–30 minutes.

Middle (heart) notes — Define the character. Florals, spices. Last 2–4 hours.

Base notes — Linger longest. Woods, musks, resins. Ground the blend.

## Kindred vs Complementary

Kindred scents harmonize (e.g., rose and jasmine). Complementary scents create contrast (e.g., citrus and vanilla). The MNKY VERSE Blending Guide shows how families work together.

## Experiment in the Lab

Start simple: one note from each layer. Add complexity as you develop your palette. Your signature scent is waiting to be discovered in the Blending Guide.`,
  },
  {
    title: "The Science of Scent and Memory",
    slug: "scent-and-memory",
    excerpt: "Why smells evoke powerful memories. The neuroscience behind scent, emotion, and how to use fragrance intentionally.",
    order: 4,
    publishedDate: "2025-02-16",
    content: `# The Science of Scent and Memory

Smell is processed by the olfactory bulb, which connects directly to the amygdala and hippocampus—brain regions tied to emotion and memory. That's why a whiff of a childhood scent can transport you instantly.

## More Than Poetry

Scents bypass the thalamus and reach the limbic system faster than other senses. This isn't just poetic; it's neuroscience. Use this power intentionally.

## Practical Tips

- Pair fragrance with moments — Choose a scent for moments you want to remember
- Lean on familiarity — Familiar scents can provide comfort when you need it
- Curate by intention — Select scents based on how you want to feel, not just how you want to smell

## Scent Your Rituals

Morning rituals might call for something bright—citrus, mint, or green. Evening wind-downs benefit from warmer profiles: vanilla, amber, sandalwood. MNKY VERSE gives you the tools to build these rituals.`,
  },
  {
    title: "Meet SAGE MNKY: Your AI Fragrance Guide",
    slug: "meet-sage-mnky",
    excerpt: "SAGE MNKY and MOOD MNKY are AI assistants built to help you discover fragrances. Learn how to get personalized recommendations.",
    order: 5,
    publishedDate: "2025-02-16",
    content: `# Meet SAGE MNKY

SAGE MNKY and MOOD MNKY are AI assistants built into MNKY VERSE. They help you discover fragrances, answer questions about notes and families, and suggest blends based on your preferences.

## What They Do

Discovery — Describe what you like (or don't), get personalized recommendations.

Education — Ask about olfactive families, blending, or specific notes.

Experimentation — Explore combinations for your next blend.

## How to Use It

Go to AI Chat and start a conversation. Tell SAGE MNKY about a fragrance you love, a mood you're aiming for, or a note you're curious about. The assistant draws on the MOOD MNKY catalog and fragrance knowledge to guide you.

## Your Scent Journey

Combine the chat with the Fragrance Wheel and Blending Guide. Use SAGE MNKY to narrow options, then explore the wheel and lab to deepen your understanding. The universe of scents is at your fingertips.`,
  },
]

async function main() {
  if (!isConfigured()) {
    console.error("NOTION_API_KEY is required. Set it in .env or .env.local")
    process.exit(1)
  }

  const dbId = NOTION_DATABASE_IDS.blog

  for (let i = 0; i < POSTS.length; i++) {
    const post = POSTS[i]
    const toRich = (s: string) => {
      const chunks = richTextChunks(s ?? "")
      return chunks.length > 0 ? chunks : [{ text: { content: "" } }]
    }

    const props: Record<string, unknown> = {
      Title: { title: [{ text: { content: post.title } }] },
      Slug: { rich_text: toRich(post.slug) },
      Excerpt: { rich_text: toRich(post.excerpt) },
      Status: { select: { name: "Published" } },
      Order: { number: post.order },
      "Published Date": { date: { start: post.publishedDate } },
    }

    console.log(`Creating: ${post.title}...`)
    const { id } = await createPageInDatabase(dbId, props)
    await sleep(500)

    const blocks = mdToBlocks(post.content)
    if (blocks.length > 0) {
      for (let j = 0; j < blocks.length; j += 100) {
        const chunk = blocks.slice(j, j + 100)
        await appendBlocksToPage(id, chunk)
        await sleep(500)
      }
    }

    console.log(`  Created: https://notion.so/${id.replace(/-/g, "")}`)
  }

  console.log(`\nDone. Created ${POSTS.length} blog posts.`)
  console.log("Run sync: POST /api/notion/sync/blog to push to Supabase.")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
