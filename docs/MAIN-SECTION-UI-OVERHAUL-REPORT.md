# Main Section UI/UX Overhaul – Full Report

This report documents the research, design choices, and implementation of the Main section (www.moodmnky.com / `/main`) UI/UX overhaul. It traces how the plan was developed and executed, and summarizes practical implications for the brand site.

---

## Knowledge development

The overhaul was driven by a plan that drew on several research themes. First, the existing Main section already used root design tokens, glassmorphism (main-site.css and main-glass.css), and a subset of AI Elements (Conversation, Message, PromptInput, Agent). Chat was and remains OpenAI-only via `/api/main/chat-demo`. The goal was to extend the design system and component usage without changing the technical boundary: Main stays public, OpenAI-only for chat, and any Supabase use stays server-side.

Research into the Elements AI SDK (elements.ai-sdk.dev) showed a broader set of components than the project had locally: Suggestion, Queue, Chain of Thought, Open In Chat, Shimmer, and others. The plan therefore called for adding Suggestion and Suggestions in the chat empty state, Shimmer for streaming or loading, Chain of Thought for a “thinking” state before the first content arrives, Open In Chat to let users open the current or a default query in ChatGPT, Claude, v0, or Cursor, and Queue for a “What we’re building” / roadmap list. Design-system and luxury-brand references (GQ-style, Figma/Dribbble trends) emphasized minimalism, scroll-driven motion, and restrained typography, which aligned with the existing glass-first Main aesthetic. The plan also called for optional OpenAI programmatic use (e.g. structured outputs for hero or CTAs) and server-only Supabase for waitlist and contact; the implementation focused on the latter two so that the public site can collect leads and messages without exposing credentials.

Implementation proceeded in the order specified: design tokens and typography, hero and section motion, MainChatbot enhancements (Suggestion, Shimmer, Chain of Thought, Open In Chat), Queue section and waitlist on the main page, Supabase migrations and API routes for waitlist and contact, contact and waitlist forms, and finally documentation (DESIGN-SYSTEM.md and this report). Optional items such as an OpenAI-based hero/CTA API and moderation on contact submissions were left for future work.

---

## Comprehensive analysis

**Design tokens and motion.** Main-specific tokens were added in main-site.css (hero title size, subtitle size, hero min-height, section gaps) and main-glass.css (card hover lift and shadow). The hero (MainHero) was updated to use motion’s `useScroll` and `useTransform` so that scroll progress drives opacity and scale of the section and a light vertical offset for the hero image, giving a subtle parallax effect without overwhelming the content. Value-props cards use the new hover tokens for a consistent lift and shadow. Section spacing uses `--main-section-gap` so that vertical rhythm is controllable from one place.

**AI Elements integration.** The chat empty state now uses the Suggestion and Suggestions components instead of ad-hoc buttons, so suggestion chips are consistent and accessible. While the assistant is streaming and no text has arrived yet, a ChainOfThought block is shown with two steps (“Reading your question…”, “Generating response…”); it is hidden as soon as the first content appears. When the last assistant message has no text yet, a Shimmer “Thinking…” line is available as a fallback. OpenInChat was added below the chat input (with a “Powered by OpenAI” label) and in the footer, both using a default or last-user-query so visitors can open the same question in external AI tools. The Queue component is used in a new “What we’re building” section: a short list of steps (Join waitlist, Explore MNKY VERSE, Try the Blending Lab, Meet MOOD MNKY) with completed/pending state, followed by the waitlist form. Together, these changes increase the perceived quality of the chat and make it clear that AI is used beyond a single chat widget (open-in-chat, roadmap, and forms backed by server-side logic).

**Supabase and API design.** All Supabase access for Main is server-only. The migration adds `main_waitlist` (email, source, created_at) and `main_contact_submissions` (name, email, message, metadata, created_at). RLS is enabled; select is restricted to authenticated users with admin role. Inserts are performed from API routes using the admin (service role) client from `@/lib/supabase/admin`, so RLS is bypassed only on the server and no client ever receives credentials for these tables. The routes `/api/main/waitlist` and `/api/main/contact` validate input with Zod, apply the same rate-limiting pattern as the chat-demo route (per-IP), and return JSON success or error. The contact page now includes MainContactForm, which POSTs to `/api/main/contact`; the main landing page includes MainWaitlistForm in the “What we’re building” section, which POSTs to `/api/main/waitlist`. This keeps the public surface simple and safe.

**Chat and OpenAI.** The Main chat remains the only AI interaction on the brand site and remains OpenAI-only (no Flowise). No changes were made to the chat-demo route’s model or system prompt; the overhaul was limited to UI (Suggestion, Shimmer, Chain of Thought, Open In Chat) and documentation.

---

## Practical implications

**Immediate use.** The Main site now has a clearer visual hierarchy (hero tokens, section gaps), scroll-linked hero motion, and a more cohesive use of AI Elements. Visitors can use suggestions to start the chat, see a short “thinking” state, open the conversation in external AI tools, and follow a short roadmap with a waitlist signup. Contact and waitlist submissions are stored in Supabase and are readable only by admins; rate limiting reduces abuse.

**Rollout and testing.** After deploying, run the new migration (`main_waitlist`, `main_contact_submissions`) in the target Supabase project. Ensure `SUPABASE_SERVICE_ROLE_KEY` (and related env) is set in the deployment environment so the waitlist and contact API routes can insert. Test the contact and waitlist forms from the public site and confirm rows appear in Supabase; verify that non-admin users cannot read these tables (e.g. via the dashboard or API with anon key). Verify that Open In Chat links (ChatGPT, Claude, v0, Cursor) open with the expected query. If Upstash rate limiting is configured, confirm that repeated submissions from the same IP are limited as intended.

**Optional follow-ups.** The plan mentioned optional OpenAI programmatic use: a structured hero/CTA API or a “next step” suggestion at the end of a chat turn. Those were not implemented but can be added later with the same server-only and rate-limiting discipline. Moderation of contact or waitlist input (e.g. OpenAI Moderation API) before insert can be added in the same API routes if desired. An analytics or events table for high-level conversion events (e.g. hero CTA click) could be added with the same RLS and server-only pattern.

**Risks and constraints.** Main remains public and does not use Flowise. Supabase credentials are not exposed to the client. Rate limiting applies to chat-demo, waitlist, and contact. Accessibility and reduced-motion preferences were considered in the use of motion and standard components.

---

## Three core next steps for UI/UX optimization

1. **Collections page and search UX**  
   Build out `/main/collections` with real data: list collections from Shopify (Storefront API or MNKY LABZ-backed API), grid of collection cards (image, title, product count), links to collection pages or VERSE, and optional filters (e.g. by product type). Refine `/main/search` with debounced input, loading/empty states, and optional filters (e.g. type: fragrances vs formulas) and result highlighting.

2. **ElevenLabs transcript and waveform**  
   Wire real transcript data into the voice block when `showTranscriptViewer` is on (e.g. from `useConversation` or Scribe), and drive `MainLiveWaveform` from actual audio when `showWaveformInVoiceBlock` is on so the waveform reflects live input/output instead of decorative-only state.

3. **Design system and performance**  
   Resolve Tailwind “ambiguous class” warnings for custom easing (`ease-[cubic-bezier(...)]`) and standardize one pattern. Add optional reduced-motion variants for hero parallax and floating panels. Consider lazy-loading or blur-placeholder for mascot images on below-the-fold sections to improve LCP and perceived performance.

---

## References

- Plan: Main Section UI/UX Overhaul (Cohesive Plan and Report)
- [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) — Main tokens, glass, components, motion, AI Elements
- [MAIN-SECTION-EXECUTION-REPORT.md](MAIN-SECTION-EXECUTION-REPORT.md) — Original Main implementation
- [MAIN-SECTION-NAVIGATION.md](MAIN-SECTION-NAVIGATION.md) — In-app and theme navigation
- `app/(main)/main/` — Layout, pages, main-site.css, main-glass.css
- `components/main/` — All Main components including MainContactForm, MainWaitlistForm
- `components/ai-elements/` — Suggestion, Queue, ChainOfThought, OpenInChat, Shimmer, etc.
- `app/api/main/` — chat-demo, waitlist, contact routes
- `supabase/migrations/20260221120000_main_waitlist_contact.sql` — Tables and RLS
