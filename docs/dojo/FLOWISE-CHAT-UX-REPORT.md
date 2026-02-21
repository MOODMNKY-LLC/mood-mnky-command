# Flowise stream fix and Dojo chat UX — user-facing summary

This report describes what you’ll see and do after the Flowise stream fix and Dojo chat UX changes.

---

## When I chat and get no visible reply

**Before:** Sometimes the chat showed only metadata and “end” and no assistant text, so it looked like nothing was returned.

**Now:**

- You still get a clear message when the stream ends with no tokens: e.g. **“Response completed (tools used).”**, **“Response completed (sources retrieved).”**, or **“No text in response.”** The UI scrolls so that message is in view.
- If the flow sent the full reply in **metadata** or **end** (instead of token events), that text is now shown.
- A **“Get response (non-streaming)”** button can appear once when a reply had no streamed text. Click it to fetch the same question again without streaming so you get a single JSON answer and see the reply in the bubble.

So even when the Flowise chatflow doesn’t stream tokens, you get either a fallback line, parsed metadata/end text, or a way to retry and see the answer.

---

## Configuring my chatflow (Dojo profile / config panel)

**Before:** You could edit raw JSON override config and many options.

**Now:**

- **Identifying stuff is automatic:** Your **session** (for Upstash memory) and **user id** (for Supabase RAG filtering) are set by the app. You don’t configure those in the panel.
- **What you can change:** Only:
  - **Include source documents in response** — one toggle (on/off).
  - **System prompt override** — one text area to change the system prompt for that chatflow.
- Saving uses the new **PATCH** API: only these fields are sent and merged with your existing config (e.g. document store and profile filter are kept). You get a “Saved” toast on success and a “Could not save” toast on failure.

So the panel is simpler and focused on the one text field and one toggle that affect your chat experience.

---

## Uploading documents for RAG

**Before:** You picked a store and used a basic file input.

**Now:**

- You still pick a **document store** from the dropdown.
- You use a **dropzone**: click or drag files into the dashed area. You see a list of chosen files and can remove single files or clear all, then click **Upload** to send them. Upload still goes to the same API and tags documents with your profile for per-user retrieval.

So document upload is the same in behavior but easier to use with drag-and-drop and a clear file list.

---

## Chat header and status

**Before:** The header showed a generic “MNKY CHAT” title.

**Now:**

- When a Flowise chatflow is active, the **center of the header** shows that chatflow’s **name** (the assignment display name or the chatflow id).
- Next to the name you see a **green dot** when the Flowise chatflow is **healthy** (ping OK). So you can tell at a glance that the agent is active and reachable.

---

## First load / new chat (welcome and agent card)

**Before:** An empty chat showed a generic empty state and starter prompts.

**Now:**

- When the chat is **empty** and you have an assigned chatflow, you see:
  - An **agent card** (with a light shimmer style) that shows:
    - The **chatflow name** and id.
    - An **“About this agent”** section: a short description, or your custom system prompt preview if you set one in config.
  - Below that, the same **empty state** and **starter prompt** buttons as before.
- So the first screen acts as a small **landing** for the agent: you see who you’re talking to and a brief intro before you send a message.

---

## Ticker under the header

**Now:**

- When a Flowise chatflow is active, a **thin ticker bar** appears under the header.
- It scrolls a short summary: **chatflow name • Sources on/off • Custom prompt / Default prompt**.
- It’s subtle and doesn’t block the chat; it gives a quick read of which agent is active and a minimal config summary.

---

## Summary

As a user you get:

1. **Visible replies** even when the flow doesn’t stream tokens (fallback text, metadata/end parsing, and optional “Get response (non-streaming)”).
2. **Simpler config**: one toggle and one system-prompt field, with saving that only updates those and keeps the rest.
3. **Easier document upload** with a dropzone and file list.
4. **Clear chat identity**: header shows the **chatflow name** and a **green status** when the agent is healthy.
5. **Agent welcome** on first load: a small card and intro so the empty chat feels like an agent landing.
6. A **ticker** under the header with the agent name and a minimal config summary.

All of this stays within the existing Dojo and Flowise integration; no new product flows, just clearer behavior and a more focused, readable UX.
