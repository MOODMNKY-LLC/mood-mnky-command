# JotForm Integration: First-Principles Breakdown

A comprehensive, first-principles explanation of how the JotForm integration works, what it's for, and how to adjust it for your needs.

---

## 1. What Problem Does This Solve?

**MOOD MNKY** is a fragrance crafting platform. Users create candles, soaps, perfumes, etc., using fragrance oils, formulas, and the Product Builder. Before they can craft effectively, they need to express what they want:

- What mood or feeling? (calming, energizing, cozy)
- What product type? (candle, soap, room spray)
- What scent notes interest them? (vanilla, woods, citrus)
- Experience level? (beginner, intermediate, advanced)

**The JotForm integration** collects this information via an intake form (the "fragrance intake") and feeds it into:

1. **Product Builder** — Prefills product type and fragrance hints when you click "Build from Intake"
2. **AI Chat** — Personalizes recommendations (mood, notes, blend style) without re-asking questions

Without the funnel, users would have to answer the same questions in Chat or Product Builder each time. The funnel is the **single entry point** for preference capture.

---

## 2. Core Concepts (First Principles)

### Funnel

A **funnel** is a configuration that links:

- A **JotForm form** (the actual form hosted on JotForm)
- A **webhook** (so JotForm tells our app when someone submits)
- **Question mapping** (so we know which form field = `product_type`, `fragrance_hints`, etc.)

One funnel = one form. You can have multiple funnels (e.g. "Candle Intake", "Soap Intake") for different flows.

### Run

A **run** is one instance of a user going through a funnel. When a user visits the Run URL:

1. We create a `funnel_run` with `status: "started"` and `user_id: <their id>`
2. We embed the JotForm form with `run_id` and `user_id` in the URL
3. When they submit, the webhook receives their answers and updates the run to `status: "submitted"`

Why track runs? So we can **link the submission to the logged-in user** and associate answers with their account.

### Answers

Answers are stored in `funnel_answers` with keys like `q1`, `q2` (JotForm question IDs). With **question_mapping**, we also store semantic keys (`product_type`, `fragrance_hints`, `target_mood`, etc.) so Product Builder and Chat can read them reliably.

---

## 3. End-to-End Flow (Step by Step)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ ADMIN (Platform)                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 1. Create funnel (name, optional JotForm Form ID)                                │
│ 2. Open Form Builder → Add questions → "Create in JotForm"                       │
│    → Creates form in JotForm, sets provider_form_id, adds hidden run_id/user_id  │
│    → Optionally registers webhook, sets funnel status = active                    │
│ 3. Register webhook (if not done in step 2) — required for local dev with ngrok  │
│ 4. Copy Run URL: https://your-app.com/funnels/run/{funnelId}                     │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ USER (Must be logged in)                                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 5. Visits Run URL                                                                │
│    → App creates funnel_run (status: started, user_id: current user)              │
│    → Returns runId, userId                                                       │
│ 6. Form loads in iframe: form.jotform.com/{formId}?run_id=xxx&user_id=yyy        │
│    → JotForm prefills hidden fields run_id and user_id from URL params            │
│ 7. User fills form, clicks Submit                                                │
│    → JotForm shows thank-you page (stays in iframe)                               │
│    → JotForm sends webhook POST to our /api/jotform/webhook                      │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ WEBHOOK (Server-to-server)                                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 8. Webhook receives payload (formID, submissionID, answers, run_id, user_id)      │
│ 9. Finds funnel by provider_form_id                                              │
│ 10. If run_id present: updates that run (status=submitted), inserts answers       │
│     If run_id absent: creates new run (user_id may be null)                      │
│ 11. Returns 200 quickly (JotForm retries on non-2xx)                             │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ DOWNSTREAM (Product Builder, Chat)                                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 12. Product Builder: GET /api/funnels/submission/latest?withinHours=24           │
│     → Finds user's most recent submitted run + answers                            │
│     → Shows "Build from Intake" card if found                                     │
│     → User clicks → prefills product_type, fragrance_hints                        │
│                                                                                   │
│ 13. AI Chat: get_latest_funnel_submission tool                                    │
│     → Same query, returns mappedAnswers                                          │
│     → Model uses mood, product_type, fragrance_hints to personalize replies      │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Critical Requirements (Hidden Assumptions)

| Requirement | Why It Matters |
|-------------|----------------|
| **User must be logged in** when visiting Run URL | `POST /api/funnels/[id]/runs` returns 401 if no session. Run is created with `user_id = current user`. Product Builder and Chat filter by `user_id` — they will not find submissions from anonymous users. |
| **Funnel must be active** | `POST /api/funnels/[id]/runs` only accepts funnels with `status = 'active'`. Form Builder sets this when creating in JotForm with webhook. Sandbox funnels use `sandbox: true` and also need `status = 'active'` for runs (webhook accepts both). |
| **Webhook must be reachable** | JotForm sends POST from their servers. Localhost is not reachable. Use ngrok for local dev: `ngrok http 3000`, set `NEXT_PUBLIC_APP_URL` to ngrok URL, re-register webhook. |
| **Hidden fields run_id, user_id** | Form Builder adds these when creating the form. The Run URL passes them as query params. JotForm prefills hidden fields from URL params. The webhook reads `body.run_id` and `body.user_id` — if missing, it creates a new run with `user_id: null` and Product Builder/Chat won't find it. |
| **question_mapping** | Without it, Product Builder and Chat fall back to keyword extraction from raw answer text. With it, they use deterministic semantic keys. Map questions in Form Builder before syncing. |

---

## 5. What Happens After Submit? (The Gap)

**Today:** After the user submits, JotForm shows a thank-you page inside the iframe. The user stays on `/funnels/run/[funnelId]`. **There is no automatic redirect** to Product Builder or any "next step."

**So the user must manually:**
1. Navigate to `/products` (Product Builder)
2. See the "Build from Intake" card
3. Click "Build from Intake"

If they don't go to Product Builder, the intake data just sits in the database until they do. Chat will use it when they open a conversation and the model calls `get_latest_funnel_submission`.

---

## 6. Data Model Summary

| Table | Purpose |
|-------|---------|
| `funnel_definitions` | Funnel config: name, provider_form_id, question_mapping, status, sandbox |
| `funnel_runs` | One row per user session: funnel_id, user_id, status (started/submitted), provider_submission_id |
| `funnel_answers` | Answers per run: run_id, question_key (q1, q2...), answer (JSON with text) |
| `funnel_events` | Audit: webhook payloads, etc. |

---

## 7. How to Use Your Test Fragrance Intake

Given what you've built, here's the minimal path to see it work:

1. **Ensure the form exists in JotForm**  
   If you created the funnel but haven't clicked "Create in JotForm" in the Form Builder, do that first. Otherwise the Run URL will show "Form not ready."

2. **Ensure the funnel is active**  
   After "Create in JotForm" with webhook registration, status should be `active`. Check the funnel detail page. If it's `draft`, you'll get "Funnel not found or inactive" when trying to run.

3. **Register webhook (local dev)**  
   - Run `ngrok http 3000`  
   - Set `NEXT_PUBLIC_APP_URL=https://your-ngrok-url.ngrok-free.app` in `.env`  
   - Restart dev server  
   - On funnel detail, click "Register Webhook"

4. **Run the funnel**  
   - Be logged in  
   - Visit `/funnels/run/{funnelId}` (or the ngrok URL if local)  
   - Fill and submit the form

5. **See the result**  
   - Go to `/products`  
   - You should see "Build from Intake"  
   - Click it to prefill from your submission

6. **Verify in Supabase**  
   ```sql
   SELECT * FROM funnel_runs ORDER BY created_at DESC LIMIT 5;
   SELECT * FROM funnel_answers ORDER BY created_at DESC LIMIT 10;
   ```

---

## 8. Possible Adjustments (Based on Your Needs)

| Need | Current State | Possible Change |
|------|---------------|-----------------|
| **Redirect after submit** | User stays on form thank-you | Add post-submit redirect: JotForm supports `thankurl` param; point to `/products` or a custom "next step" page |
| **Anonymous submissions** | Runs require logged-in user | Allow unauthenticated run creation (create run with `user_id: null`), use cookie/session to link later; or collect email and match on backend |
| **Visibility of Run URL** | Admin copies from funnel detail | Add "Share this intake" flow in app; surface Run URL in onboarding; embed in marketing pages |
| **Multiple intakes for different products** | One funnel = one form | Create separate funnels (Candle Intake, Soap Intake); Product Builder could filter by funnel type when prefilling |
| **In-app form (no JotForm)** | All forms live in JotForm | Build a native form component, POST to an API that creates runs/answers; removes JotForm dependency but requires more dev |
| **Stale intake handling** | Product Builder uses 24h window | Extend `withinHours` or add "use this intake" even if older; let user pick which intake to use |
| **Intake as Chat entry point** | User finds Chat separately | Add "Start with intake" or "Tell me your preferences" in Chat that deep-links to Run URL |

---

## 9. Is This Integration Right for You?

**It fits if:**
- You want a flexible form builder (JotForm) without building one
- Users are logged in when taking the intake
- The main goal is to prefill Product Builder and personalize Chat
- You're okay with JotForm hosting the form (iframe embed)
- Webhook + run tracking is acceptable for your architecture

**Reconsider if:**
- You need fully anonymous, public forms (e.g. lead capture before signup)
- You want the form to live entirely in your app UI (no iframe)
- You need very high availability for webhooks (JotForm retries; you still need a stable endpoint)
- You have strict data residency or compliance requirements (data flows through JotForm)

---

## 10. Quick Reference

| Resource | Location |
|----------|----------|
| Funnels list | `/platform/funnels` |
| Funnel detail | `/platform/funnels/[id]` |
| Form Builder | `/platform/funnels/[id]/builder` |
| Run page (embed) | `/funnels/run/[funnelId]` |
| Product Builder | `/products` |
| Webhook | `{APP_URL}/api/jotform/webhook?token=...` |

| Semantic keys (for question_mapping) | Used by |
|--------------------------------------|---------|
| `product_type`, `fragrance_hints` | Product Builder prefill |
| `target_mood`, `product_type`, `experience_level`, `preferred_notes`, `blend_style`, `fragrance_hints` | AI Chat personalization |

---

*This document was generated from a first-principles analysis of the JotForm integration, the research report, and the codebase.*
