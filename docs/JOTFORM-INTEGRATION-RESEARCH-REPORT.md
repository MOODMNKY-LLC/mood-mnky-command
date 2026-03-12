# JotForm Integration: End-to-End Research Report

## Executive Summary

This report documents the MOOD MNKY JotForm integration, how it works today, where it aligns with your use case, and what is required to achieve your goals: building forms in-app with AI assistance, testing the full user flow locally and in sandbox, and deploying forms to your website or other apps.

---

## Part One: Knowledge Development

The investigation began with a contradiction. JotForm’s public API FAQ states that the API is “mostly read only,” yet community threads and support responses indicate that forms can be created and edited via API. This tension led to a deeper review of JotForm’s capabilities and your current implementation.

The first phase focused on JotForm’s API. The official documentation emphasizes read operations: retrieving forms, questions, and submissions. Webhook registration is documented. Form creation is not prominently documented, but JotForm support has explicitly confirmed that “You can use POST /form endpoint” to create forms, and users have reported creating forms with question types such as `control_checkbox` and `control_button` using `x-www-form-urlencoded` payloads. The PUT endpoint for adding questions to existing forms is referenced in the docs. The conclusion is that form creation and editing via API is supported, but not well documented, and some behaviors may require clarification with the API team.

A second finding was Jotform Anywhere. This product embeds the full JotForm form builder into a third-party application, so users can create, edit, and manage forms without leaving the app. It matches the goal of “build forms in app” but is available only to Jotform Enterprise and Partner customers. For standard plans, the alternative is to use the API to create and manage forms programmatically.

The third phase examined your codebase. The integration is built around a funnel model: funnel definitions reference JotForm forms by ID, funnel runs track user sessions, and funnel answers store normalized responses. The webhook ingests JotForm submissions and writes to Supabase. The run page embeds the JotForm form in an iframe and passes `run_id` and `user_id` as URL parameters. The Product Builder and AI Chat consume funnel data via `get_latest_funnel_submission`. The architecture is sound; the main gap is that forms are built outside the app (on jotform.com) rather than inside it.

---

## Part Two: Comprehensive Analysis

### How the Current Integration Works

The flow has four stages: admin setup, user run, webhook ingestion, and downstream consumption.

**Admin setup.** An admin creates a funnel definition by providing a name and a JotForm form ID. The form must already exist in the JotForm account. The admin then registers a webhook for that form. The webhook URL points to your app (e.g. `https://your-domain.com/api/jotform/webhook?token=SECRET`). When a user submits the form, JotForm sends a POST request to this URL. Your route validates the token, parses the payload, finds the matching funnel by `provider_form_id`, and either updates an existing run (when `run_id` is present) or creates a new run. Answers are stored in `funnel_answers` with keys like `q1`, `q2` (JotForm question IDs). The raw payload is stored in `funnel_events` for auditing.

**User run.** A user visits `/funnels/run/[funnelId]`. The page fetches the funnel, creates a funnel run via `POST /api/funnels/[id]/runs`, and embeds the JotForm form in an iframe. The embed URL includes `run_id` and `user_id` as query parameters. For the webhook to associate the submission with the run, the JotForm form must include hidden fields that capture these parameters. JotForm’s prefill behavior depends on how those hidden fields are configured; the exact mapping (e.g. `q1=run_id`) must be set in the JotForm form builder.

**Webhook ingestion.** JotForm sends either a JSON `rawRequest` or form-urlencoded fields. Your route handles both. It extracts `submissionID`, `formID`, and `answers`, looks up the funnel by `provider_form_id`, and performs an idempotent upsert using `provider_submission_id` as the unique key. If `run_id` is in the payload, it updates that run; otherwise it creates a new run. This supports both embedded runs (with `run_id`/`user_id`) and standalone submissions (e.g. form filled outside your app).

**Downstream consumption.** The AI Chat tool `get_latest_funnel_submission` fetches the user’s most recent submitted run and its answers. The system prompt instructs the model to use this data for mood, product type, notes, blend style, and fragrance hints. The Product Builder calls `GET /api/funnels/submission/latest?withinHours=24` and, when a recent submission exists, shows a “Build from Intake” card. Clicking it extracts `product_type` and `fragrance_hints` from the answers and prefills the fragrance and formula steps.

### Gaps Relative to Your Use Case

Your goals are to design and edit forms inside the MOOD MNKY app (with AI assistance), test the full flow (local, sandbox, E2E), and deploy forms to your website or other apps.

**Form building in-app.** Today, forms are built on jotform.com. The app only stores a reference (`provider_form_id`) and embeds the form. There is no in-app form builder. Two paths exist: Jotform Anywhere (Enterprise/Partner only) or a custom builder that uses the JotForm API to create and update forms. The API path is viable but requires implementing `POST /form` and `PUT /form/{id}/questions` (and related endpoints) and mapping your schema to JotForm’s question format.

**AI assistance.** AI can help in several ways: suggesting questions for fragrance intakes, mapping fields to `target_mood`, `product_type`, `fragrance_hints`, etc., and generating form structure from a brief description. This can be implemented regardless of whether forms are built via Jotform Anywhere or via the API. The AI would produce a form definition (questions, types, order), and your app would either pass it to the embedded builder or translate it into API calls.

**Testing.** Webhooks fire only when a user submits the form through the JotForm UI, not when submissions are created via `POST /form/{id}/submissions`. So E2E testing requires a real form submit. For local development, the webhook URL must be reachable from the internet. Tools like ngrok or localtunnel expose `localhost` and provide a public URL (e.g. `https://abc123.ngrok.io/api/jotform/webhook`). You register this URL with JotForm for a test form, submit the form, and verify that the webhook is received and that data appears in Supabase. A sandbox can be implemented by using a separate JotForm form and a funnel definition with `status = 'draft'`, so test submissions do not affect production funnels.

**Deployment and serving elsewhere.** Once a form exists in JotForm, the embed URL `https://form.jotform.com/{formId}` works anywhere. Your run page adds `run_id` and `user_id` for tracking. To serve the same form on your main website or another app, you can embed the same URL (with or without those parameters, depending on whether you need run association). The form lives in your JotForm account; the embed is just an iframe. No additional deployment step is required beyond ensuring the form is published and the webhook is registered.

### Contradictions and Limitations

JotForm’s documentation is inconsistent. The FAQ describes the API as “mostly read only,” while support and community reports confirm form creation and editing. The POST /form and PUT /form/{id}/questions endpoints exist but are not fully documented in the public docs. Validation, required fields, and question properties may need to be confirmed with the API team (api@jotform.com).

Jotform Anywhere is the cleanest solution for in-app form building but requires an Enterprise or Partner plan. The API-based approach works on standard plans but demands more development effort and ongoing maintenance as the API evolves.

The `run_id` and `user_id` prefill depends on hidden fields in the JotForm form. If those fields are missing or misconfigured, the webhook will create a new run without linking to the started run, and the user association may be lost. This is a configuration requirement that must be enforced when forms are created or when using templates.

---

## Part Three: Practical Implications

### Immediate Applications

You can use the current integration today for the reference-and-embed workflow. Create a form on jotform.com with the desired questions (including hidden `run_id` and `user_id`), create a funnel in the app with that form ID, register the webhook, and direct users to `/funnels/run/[funnelId]`. Submissions will flow into Supabase and be available to Chat and Product Builder. This validates the crafting experience and downstream integrations before investing in an in-app builder.

For local testing, run your app locally, start ngrok pointing to `localhost:3000`, and use the ngrok URL as the webhook base. Register that webhook for a test form. Submitting the form will hit your local webhook route. Verify in Supabase that `funnel_runs` and `funnel_answers` are populated. You can also add a test mode that logs webhook payloads or writes to a separate schema for easier inspection.

### Paths to In-App Form Building

**Path A: Jotform Anywhere (Enterprise).** If you have or adopt Jotform Enterprise, you can embed the form builder in a page such as `/platform/funnels/[id]/builder`. Users build forms in-place, and the resulting form ID is stored in `funnel_definitions`. This requires no custom form engine and minimal backend work. The main cost is the Enterprise license.

**Path B: API-driven builder.** Implement an in-app form builder that stores form schema in your database (e.g. a `form_schema` or `form_questions` table). When the user saves, your backend calls JotForm’s `POST /form` to create a form and `PUT /form/{id}/questions` to add questions. You then create or update a funnel definition with the new `provider_form_id` and register the webhook. AI can generate the schema (questions, types, order) from a natural-language description, and your builder UI can allow editing before syncing to JotForm. This works on standard JotForm plans but requires implementing and maintaining the API integration.

**Path C: Hybrid.** Use a template form in JotForm as a starting point. Your app creates a copy via the API (if cloning is supported) or guides the user to duplicate it manually. The user then edits the copy in JotForm’s builder (either in a new tab or via Anywhere if available). Your app only needs to manage the funnel definition and webhook registration.

### Testing Strategy

**Local webhook testing.** Use ngrok (or similar) to expose your local server. Register the ngrok webhook URL for a test form. Submit the form and confirm the webhook is received, the payload is parsed correctly, and the database is updated. This validates the webhook route and idempotency logic without deploying.

**Sandbox mode.** Maintain a separate funnel (and optionally a separate JotForm form) for testing. Use `status = 'draft'` or a `sandbox: true` flag so test submissions are clearly separated. Optionally, use a different Supabase schema or table prefix for sandbox data.

**E2E testing.** Automate the flow: create a funnel, start a run, load the embed URL (or use a headless browser to submit the form), wait for the webhook, and assert that the run is marked submitted and that Chat/Product Builder can read the data. This requires either a test JotForm form that can be submitted programmatically or a mock webhook that simulates JotForm’s payload.

### Deployment and Serving

Deployment is straightforward. The form is hosted by JotForm. Your app stores the form ID and provides the run page that embeds it. To serve the form on your main website, embed `https://form.jotform.com/{formId}` in an iframe. If you need run tracking on the external site, you must either pass `run_id` and `user_id` in the URL (which requires creating a run via your API first) or accept that submissions from the external embed will create runs without a pre-started run ID. The webhook will still receive the submission and create a run; the only difference is the lack of association with a specific started run.

For multi-app or white-label scenarios, the same form can be embedded in multiple places. Each embed uses the same form ID and webhook. The funnel definition is shared; the only variable is where the form is displayed.

### Risk Factors and Mitigation

**Webhook reliability.** JotForm retries failed webhooks, but if your endpoint is down or returns an error, some retries may be lost. Mitigation: return 200 quickly, process asynchronously if needed, and log failures for manual reconciliation.

**Question key mapping.** Answers are stored with keys like `q1`, `q2`. The Product Builder infers `product_type` and `fragrance_hints` from answer text. If the form uses different wording or structure, extraction may fail. Mitigation: define a standard question mapping (e.g. question ID to semantic key) in funnel metadata and use it for extraction.

**API rate limits.** JotForm enforces daily request limits (e.g. 1000–100000 depending on plan). Creating forms via API consumes quota. Mitigation: cache form metadata, batch operations where possible, and monitor usage.

---

## Part Four: Recommendations

To align the integration with your goals:

1. **Short term.** Use the current setup to validate the crafting experience. Create a fragrance intake form on jotform.com with the recommended fields (target_mood, product_type, experience_level, preferred_notes, blend_style, fragrance_hints) and hidden run_id/user_id. Create a funnel, register the webhook, and test the full flow: run page, submit, Chat, Product Builder. Set up ngrok for local webhook testing.

2. **In-app builder decision.** If Jotform Enterprise is feasible, evaluate Jotform Anywhere for the fastest path to in-app form building. If not, prototype an API-driven builder: a simple UI to add questions (type, text, order), an AI step to suggest questions from a prompt, and a sync step that calls `POST /form` and `PUT /form/{id}/questions`. Confirm the exact API contract with JotForm (api@jotform.com) before committing.

3. **Testing infrastructure.** Add a sandbox funnel type or flag. Document the ngrok setup for local webhook testing. Consider an E2E test that uses a fixed test form and a mock or real webhook to validate the pipeline.

4. **Question mapping.** Introduce a `question_mapping` field in funnel definitions (or a separate table) that maps JotForm question IDs to semantic keys (product_type, fragrance_hints, etc.). Use this mapping in the Product Builder and Chat for more reliable extraction.

---

## Appendix: Current Data Flow Diagram

```
Admin                    User                      JotForm                 Your App
  |                        |                          |                        |
  |--Create funnel-------->|                          |                        |
  |  (form ID from         |                          |                        |
  |   jotform.com)         |                          |                        |
  |                        |                          |                        |
  |--Register webhook----->|                          |                        |
  |                        |                          |--webhook URL stored--->|
  |                        |                          |                        |
  |                        |--Visit /funnels/run/[id]->|                        |
  |                        |                          |                        |--Create run
  |                        |<--Embed form.jotform.com/{id}?run_id=&user_id=-----|
  |                        |                          |                        |
  |                        |--Fill & submit form----->|                        |
  |                        |                          |--POST webhook--------->|
  |                        |                          |                        |--Upsert run
  |                        |                          |                        |--Insert answers
  |                        |                          |                        |
  |                        |--Chat / Product Builder->|                        |
  |                        |                          |                        |--get_latest_funnel
  |                        |<--Personalized response--|                        |
```

---

*Report generated from deep research on JotForm API, Jotform Anywhere, current MOOD MNKY implementation, and testing/deployment patterns.*
