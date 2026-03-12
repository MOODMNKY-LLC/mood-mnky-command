# JotForm Integration — End-to-End Testing Walkthrough

This guide walks you through testing the full JotForm funnel flow: create funnel → build form → sync to JotForm → register webhook → run and submit.

---

## Prerequisites

### 1. Environment variables (`.env`)

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
JOTFORM_API_KEY=...              # From jotform.com → My Account → API

# For webhook testing (local dev)
NEXT_PUBLIC_APP_URL=...          # Set to ngrok URL when testing webhooks (see Step 6)
JOTFORM_WEBHOOK_SECRET=...       # Optional; adds ?token= to webhook URL for validation
```

### 2. Admin access

You need one of:

- **Session auth:** A user with `profiles.role = 'admin'` (log in via the app)
- **API key:** Set `FUNNEL_ADMIN_API_KEY` in `.env` and pass `x-api-key: YOUR_KEY` on API calls

To set admin role in Supabase:

```sql
-- Replace USER_ID with your auth.users id
update public.profiles set role = 'admin' where id = 'USER_ID';
```

### 3. JotForm API key

1. Go to [jotform.com](https://www.jotform.com) → My Account → API
2. Create an API key
3. Add it to `.env` as `JOTFORM_API_KEY`

---

## Step 1: Start the app

```bash
pnpm install
pnpm dev
```

App runs at `http://localhost:3000`.

---

## Step 2: Create a funnel

1. Go to **http://localhost:3000/platform/funnels**
2. Click **New Funnel**
3. Fill in:
   - **Name:** e.g. `Test Fragrance Intake`
   - **JotForm Form ID:** leave blank (we'll create the form in the builder)
   - **Use as sandbox:** check this for testing
4. Click **Create**

You’ll see the new funnel in the list with a "Sandbox" badge.

---

## Step 3: Build the form (Form Builder)

1. Click the funnel name to open its detail page
2. Click **Form Builder** (or go to `/platform/funnels/[id]/builder`)

### Option A: Add questions manually

1. Click **Add question**
2. For each question:
   - **Type:** Text, Text area, Dropdown, Radio, Checkbox, or Header
   - **Text:** The label (e.g. "What mood are you targeting?")
   - **Required:** Check if needed
   - **Semantic key:** Map to `product_type`, `fragrance_hints`, `target_mood`, etc. (used by Product Builder and Chat)
3. Add a few questions, e.g.:
   - Text: "Target mood" → semantic key `target_mood`
   - Dropdown: "Product type" (options: Candle, Soap, Perfume) → `product_type`
   - Text area: "Fragrance hints" → `fragrance_hints`

### Option B: Generate with AI

1. In **Generate with AI**, enter a prompt like:  
   `Fragrance intake for candle makers: mood, product type, experience level, preferred notes`
2. Click **Suggest**
3. Review the suggested questions and add them to the list (or edit first)

### Create in JotForm

1. Click **Create in JotForm**
2. Wait for the request to complete
3. The funnel’s **JotForm Form ID** will be set
4. Hidden fields `run_id` and `user_id` are added automatically for run tracking

---

## Step 4: Register the webhook (for local testing)

Webhooks need a public URL. For local dev you’ll use ngrok.

### 4a. Start ngrok (separate terminal)

```bash
ngrok http 3000
```

Note the URL, e.g. `https://abc123.ngrok-free.app`.

### 4b. Set the app URL

In `.env`:

```env
NEXT_PUBLIC_APP_URL=https://abc123.ngrok-free.app
```

Restart the dev server (`pnpm dev`).

### 4c. Register the webhook

1. Go to the funnel detail page: `/platform/funnels/[id]`
2. In the **Webhook** card, click **Register Webhook**
3. The webhook URL will be something like:  
   `https://abc123.ngrok-free.app/api/jotform/webhook?token=YOUR_SECRET`

---

## Step 5: Run the funnel and submit

1. On the funnel detail page, copy the **Run URL** or click **Open Run Page**
2. Use the **ngrok URL** (not localhost), e.g.:  
   `https://abc123.ngrok-free.app/funnels/run/[funnelId]`
3. The JotForm form will load in an iframe
4. Fill and submit the form

---

## Step 6: Verify the flow

### In ngrok

- ngrok terminal: you should see a POST to `/api/jotform/webhook`

### In Supabase

```sql
-- Check runs
select * from funnel_runs order by created_at desc limit 5;

-- Check answers
select * from funnel_answers order by created_at desc limit 10;
```

### In the app

- **Product Builder:** If you have a run with mapped answers, the Product Builder will use `question_mapping` to prefill `product_type`, `fragrance_hints`, etc.
- **AI Chat:** The chat tool `get_latest_funnel_submission` returns `mappedAnswers` when `question_mapping` exists.

---

## Quick reference: URLs

| Action              | URL                                              |
|---------------------|--------------------------------------------------|
| Funnels list        | `/platform/funnels`                              |
| Funnel detail       | `/platform/funnels/[id]`                         |
| Form builder        | `/platform/funnels/[id]/builder`                 |
| Run funnel (embed)  | `/funnels/run/[funnelId]`                         |
| Webhook URL         | `{NEXT_PUBLIC_APP_URL}/api/jotform/webhook?token=...` |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 403 Admin role required | Set `profiles.role = 'admin'` for your user, or use `FUNNEL_ADMIN_API_KEY` |
| Form not ready on run page | Funnel has no `provider_form_id`; use Form Builder → Create in JotForm |
| Webhook 404 | Use ngrok URL, not localhost; ensure `NEXT_PUBLIC_APP_URL` is set |
| 401 Invalid token | `JOTFORM_WEBHOOK_SECRET` must match the token in the webhook URL |
| JotForm API errors | Check `JOTFORM_API_KEY`; verify at jotform.com → My Account → API |

---

## Optional: CLI setup (no UI)

If you already have a JotForm form ID:

```bash
pnpm funnel:setup --name "My Funnel" --form-id 241234567890
```

This creates the funnel and registers the webhook. Requires `NEXT_PUBLIC_APP_URL` (or `VERCEL_URL`) and `JOTFORM_API_KEY`.
