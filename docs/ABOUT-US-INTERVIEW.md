# About Us — Founder & MOOD MNKY Interview Questionnaire

Use this document to capture the founder’s voice and the MOOD MNKY brand story. Complete every section; answers will be synthesized into the Main About page (`/main/about`) and related copy.

**Instructions:** Answer in your own words. Keep panel copy concise (1–3 sentences for the split section); longer answers are used for the founder dialog, meta descriptions, and future content.

---

## Part 1: The Founder

### 1.1 Identity & role
- **Full name (for display):**  
  _e.g. Simeon Bowman_
- **Title / role:**  
  _e.g. Founder & CEO_
- **Organization / legal entity:**  
  _e.g. MOOD MNKY LLC_
- **One-line descriptor (for cards/headers):**  
  _e.g. “Founder & CEO, MOOD MNKY LLC”_

### 1.2 Origin & motivation
- **What problem or gap did you see that led to starting MOOD MNKY?**  
  _2–4 sentences._
- **What personal experience or values drive you in this space?**  
  _2–4 sentences._
- **Why fragrance, and why “MOOD MNKY” as the name?**  
  _2–4 sentences._

### 1.3 Journey to today
- **When did you start (year or milestone), and what was the first version of the idea?**  
  _2–3 sentences._
- **What’s one turning point or lesson that shaped how MOOD MNKY works today?**  
  _2–3 sentences._
- **What are you most proud of so far (product, community, moment)?**  
  _2–3 sentences._

### 1.4 Short bios (for UI)
- **Panel bio (split section, ~1–2 sentences):**  
  _Used in the “The Founder” card on /main/about._
- **Dialog bio (full “About the Founder” modal, 2–4 sentences):**  
  _Used when visitors click “Meet the founder”._

### 1.5 Call to action
- **What should someone do after reading about you?**  
  _e.g. “Get in touch”, “Book a call”, “Join the VERSE” — we use “Get in touch” linking to /main/contact._

---

## Part 2: MOOD MNKY (the brand / “brain child”)

### 2.1 What MOOD MNKY is
- **In one sentence, what is MOOD MNKY?**  
  _e.g. “A technological organism that integrates physical products, digital experiences, and AI-driven personalization to transform self-care into a meaningful journey.”_
- **How would you explain it to a friend in 2–3 sentences?**
- **How is it different from other fragrance or wellness brands?**  
  _2–3 sentences (positioning)._

### 2.2 Mission & values
- **What is MOOD MNKY’s mission (one sentence)?**
- **Name 2–4 core values and one short line for each.**  
  _e.g. “Bespoke — every scent can be yours alone.”_
- **What does “MNKY VERSE” mean to you, and what do you want people to find there?**  
  _2–3 sentences._

### 2.3 Offerings & experience
- **What can someone do today with MOOD MNKY (products, Blending Lab, VERSE, AI, etc.)?**  
  _3–5 bullet points or 2–3 sentences._
- **What’s the one thing you want visitors to remember after reading the About page?**  
  _1–2 sentences._

### 2.4 Short copy (for UI)
- **Panel bio (split section, “The brain child” card, ~2–3 sentences):**  
  _Used next to the MOOD MNKY mascot on /main/about._
- **Meta description (for SEO, ~1 sentence):**  
  _Used in page metadata and social previews._

### 2.5 Call to action
- **What’s the primary action for someone who just met MOOD MNKY?**  
  _e.g. “Meet MOOD MNKY” (voice/talk), “Join MNKY VERSE”, “Try the Blending Guide” — we currently use “Meet MOOD MNKY” to open the talk dialog._

---

## Part 3: Synthesis — How we use your answers

After you complete the questionnaire, the following will be updated:

| Source (this doc) | Used in |
|-------------------|--------|
| 1.1 Name, title, org | Founder panel and dialog: name, title, org line |
| 1.4 Panel bio | “The Founder” card short copy |
| 1.4 Dialog bio | “About the Founder” modal body |
| 1.5 CTA | Founder dialog button (e.g. “Get in touch” → /main/contact) |
| 2.1 One sentence + 2.2 Mission | “The brain child” panel copy and brand positioning |
| 2.4 Panel bio | MOOD MNKY card short copy on /main/about |
| 2.4 Meta description | `/main/about` page metadata and social description |
| 2.5 CTA | “Meet MOOD MNKY” or other primary CTA on brand panel |

**Where copy lives in the codebase:**
- **Founder + brand copy:** `apps/web/lib/main-about-data.ts` (single source for panel and dialog text).
- **Component:** `apps/web/components/main/main-about-split-section.tsx` (reads from `main-about-data.ts`).
- **Page:** `apps/web/app/(main)/main/about/page.tsx` (title, intro line, meta).

**After you submit:** Update `main-about-data.ts` with your answers (panel bios, dialog bio, meta description). Optionally add a “Longer story” section on the About page or a blog post using 1.2, 1.3, 2.2, 2.3.
