# Chat Blending Flow — End-to-End Testing Walkthrough

This guide walks you through testing the **Unified Chat + JotForm Fragrance Crafting Flow** end-to-end. Intake can come from JotForm (run page) or the inline form in chat; `get_latest_funnel_submission` fetches prior submissions from either source. Follow each step and validate at the checkpoints.

---

## Prerequisites

### Programmatic setup (Supabase CLI + MCP)

Migrations and seed data are applied so the following are ready:

1. **E2E test funnel** — `Test Fragrance Intake` (active, `form_schema` with 3 questions: target_mood, product_type, fragrance_hints)
2. **Fragrance oils** — 6 seed oils (Leather, Vanilla, Blood Orange, Lavender, Cedar, Cinnamon) for blend suggestions
3. **Migrations** — `supabase migration up` applies `20260214000002_seed_e2e_test_funnel.sql`; `seed.sql` adds oils on `supabase db reset`

### Manual steps

1. **Environment variables** — `.env` with `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JOTFORM_API_KEY`, `OPENAI_API_KEY`
2. **App running** — `pnpm dev` at `http://localhost:3000`
3. **Sign in** — Create account or sign in at the app
4. **Admin role** — After first sign-in, run (replace with your user email):
   ```sql
   update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'your@email.com');
   ```
   Or use Supabase Studio / MCP `execute_sql`.

Optional: ngrok + webhook if testing JotForm form submissions (webhook flow).

---

## Step 1: Verify funnel has form schema

**Why:** `show_intake_form` needs `form_schema` or `provider_form_id` to render the inline intake form. Without it, the form will not appear.

### 1a. Check via Supabase

```sql
select id, name, status, provider_form_id,
       (form_schema is not null) as has_form_schema,
       (form_schema::jsonb) #> '{}' as form_schema_preview
from funnel_definitions
where status = 'active'
limit 5;
```

You should see at least one row with `has_form_schema = true` OR `provider_form_id` not null. If a funnel has `provider_form_id` but no `form_schema`, the tool will fetch questions from JotForm as a fallback.

### 1b. Or create a funnel if needed

1. Go to `http://localhost:3000/platform/funnels`
2. Create a funnel (or open an existing one)
3. Go to **Form Builder** (`/platform/funnels/[id]/builder`)
4. Add questions (e.g. Target mood, Product type, Fragrance hints)
5. Click **Create in JotForm**
6. Ensure the funnel status is **active**

**Checkpoint 1:** At least one active funnel has `form_schema` or `provider_form_id`.

---

## Step 2: Open Chat and enable Blending mode

1. Go to `http://localhost:3000/chat`
2. Enable **Blending mode** — click the flask icon (or "Blending mode off") in the footer until it shows **Blending mode on** and the badge appears
3. You should see: `Blending mode on – step-by-step fragrance blend guided flow`

**Checkpoint 2:** Blending mode badge is visible; chat requests include `mode: "blending"`.

---

## Step 3: Test Stage 0 — Intake form

**Goal:** The AI collects preferences (mood, product type, fragrance hints) when the user has not completed intake recently. Intake can come from JotForm (run page) or the inline form in chat.

### 3a. Clear recent submissions (optional)

To force the AI to show the intake form, clear any recent funnel submissions:

```sql
-- Optional: delete recent runs for your user to force intake
-- delete from funnel_runs where user_id = 'YOUR_USER_ID';
```

### 3b. Send a blending prompt

Send: `I want to blend a custom fragrance. Guide me through it.`

Or click the suggested prompt: **"Blend a custom fragrance"**.

### 3c. What to expect

The AI can take any of these paths (Stage 0 — Intake):

- **Option A:** Call `get_latest_funnel_submission` with no arguments. If it returns `submission: null`, call `show_intake_form`.
- **Option B (preferred for "guide me" prompts):** Call `show_intake_form` directly when the user asks to be guided (e.g. "guide me through selecting oils, proportions, and making a candle"). Avoids the two-step get_latest → show_intake sequence.
- **Option C:** Ask 1–2 clarifying questions in natural language (mood, product type), then call `show_intake_form` or proceed with what the user shares.

In all paths, an **InlineIntakeForm** should appear when the AI calls `show_intake_form`. Fill the form and submit.

For prompts like "guide me through selecting oils, proportions, and making a candle", the model should prefer **Option B** (show_intake_form directly) to avoid the two-step sequence and reduce the chance of stalling at reasoning.

**Checkpoint 3:** InlineIntakeForm appears; you can submit and see answers reflected in the next AI response.

**Troubleshooting:**
- No form → Funnel has no `form_schema` and no `provider_form_id`, or both fetch failed.
- Form is empty → Check `form_schema` in DB or JotForm API for that funnel’s `provider_form_id`.

---

## Step 4: Test Stage 1–2 — Blend suggestions

**Goal:** The AI searches oils, calculates proportions, and **must** call `show_blend_suggestions` to render the BlendSuggestionsCard.

### 4a. Provide a concrete blend request

After intake (or if you skip it), send something like:

`I want a blend with leather, blood orange, and vanilla.`

Or:

`Help me blend lavender with vanilla and a bit of cedar.`

### 4b. What to expect

1. AI uses `search_fragrance_oils` to find matching oils.
2. AI uses `calculate_blend_proportions` to get proportions.
3. **AI must call `show_blend_suggestions`** — a **BlendSuggestionsCard** should appear with oils, proportions, and Refine/Proceed actions.
4. If the AI only describes the blend in text and no card appears, the prompt/tool rules are not being followed (check system prompt and BLENDING_MODE_SUFFIX).

**Checkpoint 4:** BlendSuggestionsCard appears with oils and proportions.

**If tools run but no response:** The model may have exhausted `maxSteps` (e.g. 4× search used steps, then stopped before calculate_blend_proportions + show_blend_suggestions). We use `maxSteps: 10` and prompt the model to prefer one combined search. Retry; if it persists, the model may need stronger sequencing instructions.

---

## Step 5: Test Stage 3 — Product picker

**Goal:** When the user confirms the blend, the AI calls `show_product_picker` and a ProductPickerCard appears.

### 5a. Confirm the blend

Reply: `I like it, let's proceed` or `That looks good.`

### 5b. What to expect

1. AI calls `show_product_picker` with `productType` (e.g. Candle, Soap, Room Spray).
2. A **ProductPickerCard** appears:
   - If Shopify is configured: Grid of products with images and links.
   - If Shopify is not configured: Message "Shopify is not configured..." plus a **Browse our store** link.

**Checkpoint 5:** ProductPickerCard appears. If no products, the fallback link "Browse our store" is visible.

---

## Step 6: Test Stage 4 — Personalization form

**Goal:** When the user wants to save but hasn’t given a name, the AI calls `show_personalization_form` (not `save_custom_blend` directly).

### 6a. Indicate you want to save (without a name)

Reply: `Let's save it` or `I want to save this blend.`

Do **not** say: `Save as Cozy Vanilla` (that would justify calling `save_custom_blend` directly).

### 6b. What to expect

1. AI calls `show_personalization_form` with `blendSummary`.
2. A **PersonalizationFormCard** appears with fields for blend name and optional signature.
3. Fill the name, submit.
4. The AI (or follow-up tool) saves the blend and may show a **SavedBlendCard**.

**Checkpoint 6:** PersonalizationFormCard appears; submitting it leads to a saved blend.

---

## Step 7: Test direct save (optional)

**Goal:** When the user provides a name, the AI can call `save_custom_blend` directly.

Start a new blend, get to the confirmation step, then say:

`Save it as "Spiced Leather Citrus".`

The AI should call `save_custom_blend` with the name instead of showing the personalization form.

---

## Step 8: Validate data in Supabase

After a full run, check:

```sql
-- Funnel runs (from inline intake)
select * from funnel_runs order by created_at desc limit 5;

-- Funnel answers (if using POST /api/funnels/[id]/runs/[runId]/answers)
select * from funnel_answers order by created_at desc limit 10;

-- Saved blends
select id, name, product_type, user_id, created_at
from saved_blends
order by created_at desc limit 5;
```

---

## Quick reference: flow stages

| Stage | Tool(s) | Card/Component |
|-------|---------|----------------|
| 0 – Intake | `get_latest_funnel_submission` (optional), `show_intake_form`, or clarifying questions | InlineIntakeForm |
| 1 – Search | `search_fragrance_oils`, `get_fragrance_oil_by_id` | — |
| 2 – Proportions | `calculate_blend_proportions`, **`show_blend_suggestions`** | BlendSuggestionsCard |
| 3 – Products | `show_product_picker` | ProductPickerCard |
| 4 – Personalize | `show_personalization_form` | PersonalizationFormCard |
| 5 – Save | `save_custom_blend` | SavedBlendCard |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| InlineIntakeForm never appears | Ensure funnel has `form_schema` or `provider_form_id`. Create form via Form Builder → Create in JotForm. Check funnel status = active. |
| BlendSuggestionsCard never appears | Model may describe in text instead of calling the tool. Ensure Blending mode is on. Check `BLENDING_MODE_SUFFIX` in `app/api/chat/route.ts`. |
| ProductPickerCard is empty | Shopify env vars missing or product type has no matches. Card should still show "Browse our store" link. |
| PersonalizationFormCard never appears | Model may call `save_custom_blend` directly. Say "I want to save it" without a name to encourage `show_personalization_form`. |
| get_latest_funnel_submission returns data | AI skips intake. Delete recent runs or use a fresh user to force intake. |
| Stuck at "Calling for funnel submission" / tool errors | The Responses API may pass `funnelId: ""` for omitted optional params. The tool schema accepts `""` and transforms to undefined. Stage 0 offers three paths; Option B (show_intake_form directly) is preferred for "guide me" prompts. Check `getLatestFunnelSubmissionTool` in `lib/chat/tools.ts`, Stage 0 in `lib/chat/system-prompt.ts`, and `BLENDING_MODE_SUFFIX` in `app/api/chat/route.ts`. |
| Stops at "View reasoning" with no tool call or form | Reasoning models (GPT-5, o3-mini) may emit reasoning but not execute the tool. BLENDING_MODE_SUFFIX rule 7 instructs: "Do not stop after reasoning—execute the call." Prefer Option B for "guide me" prompts so the model goes straight to `show_intake_form`. If it persists, try `gpt-4o-mini` (no reasoning) or check network tab for tool calls/errors. |

---

## Environment variables summary

```env
# Required for Chat + Blending
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...

# For intake (JotForm)
JOTFORM_API_KEY=...

# For product picker (optional — fallback link still works)
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=...
SHOPIFY_STORE_DOMAIN=...
SHOPIFY_ADMIN_API_TOKEN=...
```
