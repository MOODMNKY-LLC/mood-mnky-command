# Flowise Chatflow Setup — Fragrance Crafting

> **Notice (2025-02):** Flowise integration has been **temporarily removed** from the app. This document and tool definitions in `docs/archive/flowise/` are preserved for reintroduction. See [AI-SEPARATION-PLAN.md](./AI-SEPARATION-PLAN.md).

Step-by-step guide to configure the **mood-mnky-command** chatflow in Flowise with Custom Tools that call the MOOD MNKY API.

## Prerequisites

- Flowise at `https://flowise-dev.moodmnky.com` — chatflow: [05ba7573-aab4-4c63-8f96-1c9be92252cc](https://flowise-dev.moodmnky.com/canvas/05ba7573-aab4-4c63-8f96-1c9be92252cc)
- MOOD MNKY app deployed and reachable (e.g. `https://mnky-command.moodmnky.com`)
- **Flowise Variables** are configured in Flowise's UI (Variables sidebar), **not** in the app's `.env`. The app passes `userId` and `moodMnkyApiUrl` via the embed; `moodMnkyApiKey` must remain in Flowise (secret).

---

## Security: Two Different Keys

| Key | Protects | Where used |
|-----|----------|------------|
| **FLOWISE_API_KEY** | Flowise prediction endpoint (`/api/v1/prediction/...`) | Flowise chatflow Configuration; embed / API clients use this to call Flowise |
| **MOODMNKY_API_KEY** | MOOD MNKY backend (`/api/flowise/tools/*`) | Flowise Custom Tools send this when calling our API; we validate it server-side |

Do not conflate them. A 401 from Flowise vs a 401 from our proxy indicates which layer failed.

---

## Step 1: Configure Flowise Variables

**Where:** Flowise left sidebar → **Variables** (“Create and manage global variables”). Variables created here are available as `$vars.<name>` in Custom Tools, Custom Functions, and other nodes.

**Important:** Per [Flowise docs](https://docs.flowiseai.com/using-flowise/variables), variables must be **created first** in the Variables UI. `overrideConfig.vars` only overrides existing variables; if a variable does not exist, it will be `undefined` and tools report "Missing $vars.moodMnkyApiKey".

**Static vs Runtime:** Static variables have a value field in the UI. Runtime variables have **no value input** — they read from `process.env.<variableName>` at runtime. For `moodMnkyApiKey`, use **Static** to avoid env-name mismatches (see below).

| Variable | Type | Value |
|----------|------|-------|
| `moodMnkyApiUrl` | **Static** (fallback) | `https://mnky-command.moodmnky.com`. Overridden by embed from `NEXT_PUBLIC_MOODMNKY_API_URL` when set. |
| `moodMnkyApiKey` | **Static** | Same value as `FLOWISE_API_KEY` in your MOOD MNKY app’s environment. Must match what `/api/flowise/tools/*` expects. |

**Why Static for moodMnkyApiKey:** Runtime variables map to `process.env.<variableName>`. If the variable is named `moodMnkyApiKey`, Flowise looks up `process.env.moodMnkyApiKey` (case-sensitive). Many envs use `MOODMNKY_API_KEY`, which would not match. Static avoids this; store the key as a Static variable. Ensure the Flowise instance is secured and variables are not exported publicly.

**Workspace scope:** If using Flowise Workspaces (Cloud/Enterprise), variables are workspace-scoped. Create variables in the **same workspace** as the mood-mnky-command chatflow.

**Override Configuration:** Enable **Override Configuration** in chatflow **Settings → Configuration → Security**. The app embed passes `chatflowConfig.vars`: `userId`, `moodMnkyApiUrl` (from `NEXT_PUBLIC_MOODMNKY_API_URL`). `moodMnkyApiKey` stays in Flowise (secret); variables must exist in Flowise first.

---

## Step 2: Add Custom Tools

Create each Custom Tool in Flowise. You can:

- **Upload via API**: Use the JSON files in `flowise/tools/` with `POST /api/v1/tools`. See `flowise/README.md` for curl/PowerShell examples.
- **Create manually**: For each tool:

1. Go to **Tools** → **Add Tool** → **Custom Tool**
2. Set **Name** and **Description** as below
3. Add **Input Schema** properties
4. Paste the **JavaScript Function** code

**Variable syntax:** Input schema props are `$propName` (e.g. `$funnelId`, `$query`). Flow metadata: `$flow.sessionId`, `$flow.chatId`, `$flow.chatflowId`. Variables: `$vars.<name>`.

**Optional params:** When the LLM omits an optional parameter, Flowise does not inject it — referencing `$funnelId` throws `ReferenceError: $funnelId is not defined`. Use `typeof $param !== 'undefined' && $param` (or a ternary) before accessing optional schema params.

**Fetch portability:** Flowise's NodeVM sandbox does not support dynamic `import()`. Tools use `fetch` when available, else `require('node-fetch')`. Ensure `TOOL_FUNCTION_EXTERNAL_DEP=node-fetch` (or `node-fetch@2`) in Flowise env if native fetch is unavailable.

**Error handling:** Each tool uses a 15s timeout, guards `AbortController` availability, catches fetch failures (DNS, refused, AbortError), and returns structured `{ ok: false, layer, ... }` so failures are debuggable in Flowise chat history.

**Fail-fast config checks:** If `moodMnkyApiUrl`, `moodMnkyApiKey`, or `userId` is missing, the tool returns immediately with `{ ok: false, layer: 'config', message: '...' }` instead of a cryptic network error.

**Correlation headers:** Each request sends `x-moodmnky-session-id`, `x-moodmnky-chat-id`, and `x-moodmnky-chatflow-id` for log correlation across Flowise and the backend.

**baseUrl:** Trailing slashes are stripped to avoid `//api/...` paths.

**Flowise schema format:** Flowise's Custom Tool expects schema as an **array** of `{ property, type, description, required }` objects—**not** JSON Schema (`{ type: "object", properties: {...} }`). Using JSON Schema causes `TypeError: parsedSchema is not iterable`. The tools in `flowise/tools/*.json` use the correct array format. Flowise only supports `string`, `number`, `boolean`, `date`; for arrays/objects use `string` and `JSON.parse` in the func.

---

### Tool 1: getLatestFunnelSubmission

**Name:** `getLatestFunnelSubmission`

**Description:** Get the user's latest fragrance intake funnel submission. Use when the user has completed intake and you want to personalize recommendations (mood, product type, notes). Returns structured answers from their most recent submission.

**Input Schema:**
| Property | Type | Description | Required |
|----------|------|-------------|----------|
| funnelId | string | Funnel definition ID. Omit to fetch from any funnel. | false |

**JavaScript Function:**
```javascript
const baseUrl = String($vars.moodMnkyApiUrl || '').replace(/\/+$/, '');
const apiKey = $vars.moodMnkyApiKey;

if (!baseUrl) return JSON.stringify({ ok: false, layer: 'config', message: 'Missing $vars.moodMnkyApiUrl' });
if (!apiKey) return JSON.stringify({ ok: false, layer: 'config', message: 'Missing $vars.moodMnkyApiKey (Runtime var / env)' });
if (!$vars.userId) return JSON.stringify({ ok: false, layer: 'config', message: 'Missing $vars.userId (override vars.userId from embed)' });

const fetchFn = (typeof fetch === 'function') ? fetch : (globalThis && globalThis.fetch) ? globalThis.fetch.bind(globalThis) : require('node-fetch');

const body = { userId: $vars.userId, sessionId: $flow.sessionId, chatId: $flow.chatId };
if ($funnelId) body.funnelId = $funnelId;

const timeoutMs = 15000;
const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

try {
  const res = await fetchFn(`${baseUrl}/api/flowise/tools/submission`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'x-moodmnky-session-id': String($flow.sessionId || ''),
      'x-moodmnky-chat-id': String($flow.chatId || ''),
      'x-moodmnky-chatflow-id': String($flow.chatflowId || ''),
    },
    body: JSON.stringify(body),
    ...(controller ? { signal: controller.signal } : {}),
  });
  const text = await res.text();
  if (!res.ok) {
    return JSON.stringify({ ok: false, layer: 'moodmnky_api', status: res.status, statusText: res.statusText, body: text?.slice(0, 2000) });
  }
  try { return JSON.stringify(JSON.parse(text)); } catch { return text; }
} catch (err) {
  const msg = err?.name === 'AbortError' ? `Request timed out after ${timeoutMs}ms` : (err?.message || String(err));
  return JSON.stringify({ ok: false, layer: 'network', error: err?.name || 'Error', message: msg });
} finally {
  if (timer) clearTimeout(timer);
}
```

---

### Tool 2: showIntakeForm

**Name:** `showIntakeForm`

**Description:** Show an intake form to collect mood, product type, fragrance hints. Call when the user is starting a blend and getLatestFunnelSubmission returned no submission or null. Returns funnelId, runId, formSchema.

**Input Schema:**
| Property | Type | Description | Required |
|----------|------|-------------|----------|
| funnelId | string | Funnel definition ID. Omit to use first active funnel. | false |

**JavaScript Function:**
```javascript
const baseUrl = String($vars.moodMnkyApiUrl || '').replace(/\/+$/, '');
const apiKey = $vars.moodMnkyApiKey;

if (!baseUrl) return JSON.stringify({ ok: false, layer: 'config', message: 'Missing $vars.moodMnkyApiUrl' });
if (!apiKey) return JSON.stringify({ ok: false, layer: 'config', message: 'Missing $vars.moodMnkyApiKey (Runtime var / env)' });
if (!$vars.userId) return JSON.stringify({ ok: false, layer: 'config', message: 'Missing $vars.userId (override vars.userId from embed)' });

const fetchFn = (typeof fetch === 'function') ? fetch : (globalThis && globalThis.fetch) ? globalThis.fetch.bind(globalThis) : require('node-fetch');

const body = { userId: $vars.userId, sessionId: $flow.sessionId, chatId: $flow.chatId };
if ($funnelId) body.funnelId = $funnelId;

const timeoutMs = 15000;
const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

try {
  const res = await fetchFn(`${baseUrl}/api/flowise/tools/intake-form`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'x-moodmnky-session-id': String($flow.sessionId || ''),
      'x-moodmnky-chat-id': String($flow.chatId || ''),
      'x-moodmnky-chatflow-id': String($flow.chatflowId || ''),
    },
    body: JSON.stringify(body),
    ...(controller ? { signal: controller.signal } : {}),
  });
  const text = await res.text();
  if (!res.ok) {
    return JSON.stringify({ ok: false, layer: 'moodmnky_api', status: res.status, statusText: res.statusText, body: text?.slice(0, 2000) });
  }
  try { return JSON.stringify(JSON.parse(text)); } catch { return text; }
} catch (err) {
  const msg = err?.name === 'AbortError' ? `Request timed out after ${timeoutMs}ms` : (err?.message || String(err));
  return JSON.stringify({ ok: false, layer: 'network', error: err?.name || 'Error', message: msg });
} finally {
  if (timer) clearTimeout(timer);
}
```

---

### Tool 3: submitIntakeAnswers

**Name:** `submitIntakeAnswers`

**Description:** Submit answers from the intake form after collecting them from the user in chat. Use when the user provided mood, product type, fragrance hints and you have runId and funnelId from showIntakeForm.

**Input Schema:**
| Property | Type | Description | Required |
|----------|------|-------------|----------|
| runId | string | Run ID from showIntakeForm | true |
| funnelId | string | Funnel ID from showIntakeForm | true |
| answers | object | Map of semantic keys to values, e.g. { target_mood: "Cozy", product_type: "Candle", fragrance_hints: "leather vanilla citrus" } | true |

**JavaScript Function:**
```javascript
const baseUrl = String($vars.moodMnkyApiUrl || '').replace(/\/+$/, '');
const apiKey = $vars.moodMnkyApiKey;

if (!baseUrl) return JSON.stringify({ ok: false, layer: 'config', message: 'Missing $vars.moodMnkyApiUrl' });
if (!apiKey) return JSON.stringify({ ok: false, layer: 'config', message: 'Missing $vars.moodMnkyApiKey (Runtime var / env)' });
if (!$vars.userId) return JSON.stringify({ ok: false, layer: 'config', message: 'Missing $vars.userId (override vars.userId from embed)' });

const fetchFn = (typeof fetch === 'function') ? fetch : (globalThis && globalThis.fetch) ? globalThis.fetch.bind(globalThis) : require('node-fetch');

const body = {
  userId: $vars.userId,
  sessionId: $flow.sessionId,
  chatId: $flow.chatId,
  runId: $runId,
  funnelId: $funnelId,
  answers: typeof $answers === 'string' ? JSON.parse($answers) : $answers,
};

const timeoutMs = 15000;
const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

try {
  const res = await fetchFn(`${baseUrl}/api/flowise/tools/intake-answers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'x-moodmnky-session-id': String($flow.sessionId || ''),
      'x-moodmnky-chat-id': String($flow.chatId || ''),
      'x-moodmnky-chatflow-id': String($flow.chatflowId || ''),
    },
    body: JSON.stringify(body),
    ...(controller ? { signal: controller.signal } : {}),
  });
  const text = await res.text();
  if (!res.ok) {
    return JSON.stringify({ ok: false, layer: 'moodmnky_api', status: res.status, statusText: res.statusText, body: text?.slice(0, 2000) });
  }
  try { return JSON.stringify(JSON.parse(text)); } catch { return text; }
} catch (err) {
  const msg = err?.name === 'AbortError' ? `Request timed out after ${timeoutMs}ms` : (err?.message || String(err));
  return JSON.stringify({ ok: false, layer: 'network', error: err?.name || 'Error', message: msg });
} finally {
  if (timer) clearTimeout(timer);
}
```

---

### Tool 4: searchFragranceOils

**Name:** `searchFragranceOils`

**Description:** Search fragrance oils by name, family, or notes. When the user names multiple oils (e.g. leather, vanilla, blood orange), use ONE call with a combined query like "leather vanilla blood orange". After this returns, you must call calculateBlendProportions and showBlendSuggestions.

**Input Schema:**
| Property | Type | Description | Required |
|----------|------|-------------|----------|
| query | string | Search term for fragrance name, family, or notes | true |
| limit | number | Max results (default 5) | false |

**JavaScript Function:**
```javascript
const baseUrl = String($vars.moodMnkyApiUrl || '').replace(/\/+$/, '');
const apiKey = $vars.moodMnkyApiKey;

if (!baseUrl) return JSON.stringify({ ok: false, layer: 'config', message: 'Missing $vars.moodMnkyApiUrl' });
if (!apiKey) return JSON.stringify({ ok: false, layer: 'config', message: 'Missing $vars.moodMnkyApiKey (Runtime var / env)' });
if (!$vars.userId) return JSON.stringify({ ok: false, layer: 'config', message: 'Missing $vars.userId (override vars.userId from embed)' });

const fetchFn = (typeof fetch === 'function') ? fetch : (globalThis && globalThis.fetch) ? globalThis.fetch.bind(globalThis) : require('node-fetch');

const body = { userId: $vars.userId, sessionId: $flow.sessionId, chatId: $flow.chatId, query: $query, limit: $limit || 5 };

const timeoutMs = 15000;
const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

try {
  const res = await fetchFn(`${baseUrl}/api/flowise/tools/search-oils`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'x-moodmnky-session-id': String($flow.sessionId || ''),
      'x-moodmnky-chat-id': String($flow.chatId || ''),
      'x-moodmnky-chatflow-id': String($flow.chatflowId || ''),
    },
    body: JSON.stringify(body),
    ...(controller ? { signal: controller.signal } : {}),
  });
  const text = await res.text();
  if (!res.ok) {
    return JSON.stringify({ ok: false, layer: 'moodmnky_api', status: res.status, statusText: res.statusText, body: text?.slice(0, 2000) });
  }
  try { return JSON.stringify(JSON.parse(text)); } catch { return text; }
} catch (err) {
  const msg = err?.name === 'AbortError' ? `Request timed out after ${timeoutMs}ms` : (err?.message || String(err));
  return JSON.stringify({ ok: false, layer: 'network', error: err?.name || 'Error', message: msg });
} finally {
  if (timer) clearTimeout(timer);
}
```

---

### Tool 5: calculateBlendProportions

**Name:** `calculateBlendProportions`

**Description:** Calculate suggested proportions for a blend of fragrance oils. Use when the user has selected oils and wants ratios, or when they ask to adjust (e.g. "more leather, less citrus").

**Input Schema:**
| Property | Type | Description | Required |
|----------|------|-------------|----------|
| oils | array | Array of { oilId, oilName } objects | true |
| preferences | string | User preferences e.g. "more leather, less citrus" | false |
| productType | string | candle, soap, room-spray, etc. (default: candle) | false |

**JavaScript Function:**
```javascript
const baseUrl = String($vars.moodMnkyApiUrl || '').replace(/\/+$/, '');
const apiKey = $vars.moodMnkyApiKey;

if (!baseUrl) return JSON.stringify({ ok: false, layer: 'config', message: 'Missing $vars.moodMnkyApiUrl' });
if (!apiKey) return JSON.stringify({ ok: false, layer: 'config', message: 'Missing $vars.moodMnkyApiKey (Runtime var / env)' });
if (!$vars.userId) return JSON.stringify({ ok: false, layer: 'config', message: 'Missing $vars.userId (override vars.userId from embed)' });

const fetchFn = (typeof fetch === 'function') ? fetch : (globalThis && globalThis.fetch) ? globalThis.fetch.bind(globalThis) : require('node-fetch');

const body = {
  userId: $vars.userId,
  sessionId: $flow.sessionId,
  chatId: $flow.chatId,
  oils: typeof $oils === 'string' ? JSON.parse($oils) : $oils,
  preferences: $preferences,
  productType: $productType || 'candle',
};

const timeoutMs = 15000;
const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

try {
  const res = await fetchFn(`${baseUrl}/api/flowise/tools/proportions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'x-moodmnky-session-id': String($flow.sessionId || ''),
      'x-moodmnky-chat-id': String($flow.chatId || ''),
      'x-moodmnky-chatflow-id': String($flow.chatflowId || ''),
    },
    body: JSON.stringify(body),
    ...(controller ? { signal: controller.signal } : {}),
  });
  const text = await res.text();
  if (!res.ok) {
    return JSON.stringify({ ok: false, layer: 'moodmnky_api', status: res.status, statusText: res.statusText, body: text?.slice(0, 2000) });
  }
  try { return JSON.stringify(JSON.parse(text)); } catch { return text; }
} catch (err) {
  const msg = err?.name === 'AbortError' ? `Request timed out after ${timeoutMs}ms` : (err?.message || String(err));
  return JSON.stringify({ ok: false, layer: 'network', error: err?.name || 'Error', message: msg });
} finally {
  if (timer) clearTimeout(timer);
}
```

---

### Tool 6: showBlendSuggestions

**Name:** `showBlendSuggestions`

**Description:** REQUIRED after calculateBlendProportions. Present the blend suggestion with oils and proportions to the user. Do not merely describe the blend in text—call this tool so the user sees the structured output. Include a short explanation of why this blend works.

**Input Schema:**
| Property | Type | Description | Required |
|----------|------|-------------|----------|
| oils | array | Array of { oilId, oilName } | true |
| proportions | array | Array of { oilId, oilName, proportionPct } | true |
| explanation | string | Short explanation of why this blend works | false |

**JavaScript Function:**
```javascript
const baseUrl = String($vars.moodMnkyApiUrl || '').replace(/\/+$/, '');
const apiKey = $vars.moodMnkyApiKey;

if (!baseUrl) return JSON.stringify({ ok: false, layer: 'config', message: 'Missing $vars.moodMnkyApiUrl' });
if (!apiKey) return JSON.stringify({ ok: false, layer: 'config', message: 'Missing $vars.moodMnkyApiKey (Runtime var / env)' });
if (!$vars.userId) return JSON.stringify({ ok: false, layer: 'config', message: 'Missing $vars.userId (override vars.userId from embed)' });

const fetchFn = (typeof fetch === 'function') ? fetch : (globalThis && globalThis.fetch) ? globalThis.fetch.bind(globalThis) : require('node-fetch');

const body = {
  userId: $vars.userId,
  sessionId: $flow.sessionId,
  chatId: $flow.chatId,
  oils: typeof $oils === 'string' ? JSON.parse($oils) : $oils,
  proportions: typeof $proportions === 'string' ? JSON.parse($proportions) : $proportions,
  explanation: $explanation,
};

const timeoutMs = 15000;
const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

try {
  const res = await fetchFn(`${baseUrl}/api/flowise/tools/blend-suggestions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'x-moodmnky-session-id': String($flow.sessionId || ''),
      'x-moodmnky-chat-id': String($flow.chatId || ''),
      'x-moodmnky-chatflow-id': String($flow.chatflowId || ''),
    },
    body: JSON.stringify(body),
    ...(controller ? { signal: controller.signal } : {}),
  });
  const text = await res.text();
  if (!res.ok) {
    return JSON.stringify({ ok: false, layer: 'moodmnky_api', status: res.status, statusText: res.statusText, body: text?.slice(0, 2000) });
  }
  try { return JSON.stringify(JSON.parse(text)); } catch { return text; }
} catch (err) {
  const msg = err?.name === 'AbortError' ? `Request timed out after ${timeoutMs}ms` : (err?.message || String(err));
  return JSON.stringify({ ok: false, layer: 'network', error: err?.name || 'Error', message: msg });
} finally {
  if (timer) clearTimeout(timer);
}
```

---

### Tool 7: showProductPicker

**Name:** `showProductPicker`

**Description:** Show product picker with Shopify products (candles, soaps, room sprays). Use after the user confirms their blend to suggest where to make it.

**Input Schema:**
| Property | Type | Description | Required |
|----------|------|-------------|----------|
| blendName | string | Name of the blend for context | false |
| productType | string | Candle, Soap, Room Spray, etc. (default: Candle) | false |
| limit | number | Max products (default 6) | false |

**JavaScript Function:**
```javascript
const baseUrl = String($vars.moodMnkyApiUrl || '').replace(/\/+$/, '');
const apiKey = $vars.moodMnkyApiKey;

if (!baseUrl) return JSON.stringify({ ok: false, layer: 'config', message: 'Missing $vars.moodMnkyApiUrl' });
if (!apiKey) return JSON.stringify({ ok: false, layer: 'config', message: 'Missing $vars.moodMnkyApiKey (Runtime var / env)' });
if (!$vars.userId) return JSON.stringify({ ok: false, layer: 'config', message: 'Missing $vars.userId (override vars.userId from embed)' });

const fetchFn = (typeof fetch === 'function') ? fetch : (globalThis && globalThis.fetch) ? globalThis.fetch.bind(globalThis) : require('node-fetch');

const body = {
  userId: $vars.userId,
  sessionId: $flow.sessionId,
  chatId: $flow.chatId,
  blendName: $blendName,
  productType: $productType || 'Candle',
  limit: $limit || 6,
};

const timeoutMs = 15000;
const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

try {
  const res = await fetchFn(`${baseUrl}/api/flowise/tools/product-picker`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'x-moodmnky-session-id': String($flow.sessionId || ''),
      'x-moodmnky-chat-id': String($flow.chatId || ''),
      'x-moodmnky-chatflow-id': String($flow.chatflowId || ''),
    },
    body: JSON.stringify(body),
    ...(controller ? { signal: controller.signal } : {}),
  });
  const text = await res.text();
  if (!res.ok) {
    return JSON.stringify({ ok: false, layer: 'moodmnky_api', status: res.status, statusText: res.statusText, body: text?.slice(0, 2000) });
  }
  try { return JSON.stringify(JSON.parse(text)); } catch { return text; }
} catch (err) {
  const msg = err?.name === 'AbortError' ? `Request timed out after ${timeoutMs}ms` : (err?.message || String(err));
  return JSON.stringify({ ok: false, layer: 'network', error: err?.name || 'Error', message: msg });
} finally {
  if (timer) clearTimeout(timer);
}
```

---

### Tool 8: showPersonalizationForm

**Name:** `showPersonalizationForm`

**Description:** Show a personalization form to collect blend name and optional signature. Use when the user has confirmed their blend but has NOT yet provided a name (e.g. they said "I like it" or "let's save it"). Only call saveCustomBlend directly when they explicitly gave a name (e.g. "Save as Cozy Vanilla").

**Input Schema:**
| Property | Type | Description | Required |
|----------|------|-------------|----------|
| blendSummary | object | { productType, fragrances: [{ oilId, oilName, proportionPct }], batchWeightG?, fragranceLoadPct?, notes? } | true |
| promptForImage | string | Optional prompt for AI image generation | false |

**JavaScript Function:**
```javascript
const baseUrl = String($vars.moodMnkyApiUrl || '').replace(/\/+$/, '');
const apiKey = $vars.moodMnkyApiKey;

if (!baseUrl) return JSON.stringify({ ok: false, layer: 'config', message: 'Missing $vars.moodMnkyApiUrl' });
if (!apiKey) return JSON.stringify({ ok: false, layer: 'config', message: 'Missing $vars.moodMnkyApiKey (Runtime var / env)' });
if (!$vars.userId) return JSON.stringify({ ok: false, layer: 'config', message: 'Missing $vars.userId (override vars.userId from embed)' });

const fetchFn = (typeof fetch === 'function') ? fetch : (globalThis && globalThis.fetch) ? globalThis.fetch.bind(globalThis) : require('node-fetch');

const body = {
  userId: $vars.userId,
  sessionId: $flow.sessionId,
  chatId: $flow.chatId,
  blendSummary: typeof $blendSummary === 'string' ? JSON.parse($blendSummary) : $blendSummary,
  promptForImage: $promptForImage,
};

const timeoutMs = 15000;
const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

try {
  const res = await fetchFn(`${baseUrl}/api/flowise/tools/personalization-form`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'x-moodmnky-session-id': String($flow.sessionId || ''),
      'x-moodmnky-chat-id': String($flow.chatId || ''),
      'x-moodmnky-chatflow-id': String($flow.chatflowId || ''),
    },
    body: JSON.stringify(body),
    ...(controller ? { signal: controller.signal } : {}),
  });
  const text = await res.text();
  if (!res.ok) {
    return JSON.stringify({ ok: false, layer: 'moodmnky_api', status: res.status, statusText: res.statusText, body: text?.slice(0, 2000) });
  }
  try { return JSON.stringify(JSON.parse(text)); } catch { return text; }
} catch (err) {
  const msg = err?.name === 'AbortError' ? `Request timed out after ${timeoutMs}ms` : (err?.message || String(err));
  return JSON.stringify({ ok: false, layer: 'network', error: err?.name || 'Error', message: msg });
} finally {
  if (timer) clearTimeout(timer);
}
```

---

### Tool 9: saveCustomBlend

**Name:** `saveCustomBlend`

**Description:** Save a custom fragrance blend for the user. Use when they confirm they are satisfied with their blend and want to save it. Include a descriptive name and notes.

**Input Schema:**
| Property | Type | Description | Required |
|----------|------|-------------|----------|
| name | string | Descriptive name for the blend | true |
| productType | string | Product type: candle, soap, etc. | true |
| fragrances | array | Array of { oilId, oilName, proportionPct } (must sum to 100) | true |
| batchWeightG | number | Batch weight in grams (optional, default 400) | false |
| fragranceLoadPct | number | Fragrance load % (optional, default 10) | false |
| notes | string | Tags, descriptors, or replication notes | false |

**JavaScript Function:**
```javascript
const baseUrl = String($vars.moodMnkyApiUrl || '').replace(/\/+$/, '');
const apiKey = $vars.moodMnkyApiKey;

if (!baseUrl) return JSON.stringify({ ok: false, layer: 'config', message: 'Missing $vars.moodMnkyApiUrl' });
if (!apiKey) return JSON.stringify({ ok: false, layer: 'config', message: 'Missing $vars.moodMnkyApiKey (Runtime var / env)' });
if (!$vars.userId) return JSON.stringify({ ok: false, layer: 'config', message: 'Missing $vars.userId (override vars.userId from embed)' });

const fetchFn = (typeof fetch === 'function') ? fetch : (globalThis && globalThis.fetch) ? globalThis.fetch.bind(globalThis) : require('node-fetch');

const body = {
  userId: $vars.userId,
  sessionId: $flow.sessionId,
  chatId: $flow.chatId,
  name: $name,
  productType: $productType,
  fragrances: typeof $fragrances === 'string' ? JSON.parse($fragrances) : $fragrances,
  batchWeightG: $batchWeightG,
  fragranceLoadPct: $fragranceLoadPct || 10,
  notes: $notes,
};

const timeoutMs = 15000;
const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

try {
  const res = await fetchFn(`${baseUrl}/api/flowise/tools/save-blend`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'x-moodmnky-session-id': String($flow.sessionId || ''),
      'x-moodmnky-chat-id': String($flow.chatId || ''),
      'x-moodmnky-chatflow-id': String($flow.chatflowId || ''),
    },
    body: JSON.stringify(body),
    ...(controller ? { signal: controller.signal } : {}),
  });
  const text = await res.text();
  if (!res.ok) {
    return JSON.stringify({ ok: false, layer: 'moodmnky_api', status: res.status, statusText: res.statusText, body: text?.slice(0, 2000) });
  }
  try { return JSON.stringify(JSON.parse(text)); } catch { return text; }
} catch (err) {
  const msg = err?.name === 'AbortError' ? `Request timed out after ${timeoutMs}ms` : (err?.message || String(err));
  return JSON.stringify({ ok: false, layer: 'network', error: err?.name || 'Error', message: msg });
} finally {
  if (timer) clearTimeout(timer);
}
```

---

## Step 3: System Prompt for the Chatflow

Use this as the **System Message** (or equivalent) for your Chatflow/Agentflow:

```
You are the MOOD MNKY fragrance crafting assistant. You guide users through creating custom fragrance blends step-by-step.

## Blending Knowledge
- **Top notes**: Lighter, citrusy or soft florals. Fade quickly.
- **Middle notes**: Balance—florals, gourmands, fruits, lighter woods. Usually most prominent.
- **Base notes**: Anchor—vanilla, spices, musks, woods. Linger longest.
- **Kindred notes**: Adjacent on the wheel—harmonious. **Complementary notes**: Opposite—complex contrasts.

## Workflow (Follow Strictly)

**Stage 0 – Intake**
- Call getLatestFunnelSubmission first. If it returns submission: null and user is starting a blend, call showIntakeForm.
- If user says "guide me" or "help me create a fragrance", call showIntakeForm directly.
- Cache the intake result in flow state once retrieved—do not re-call getLatestFunnelSubmission on every message. (Use Flowise Set/Get Variable nodes if available.)
- Once you have formSchema from showIntakeForm, describe the questions in chat and collect answers. Then call submitIntakeAnswers with runId, funnelId, and the answers object.

**Stage 1 – Search & Proportions**
- Use ONE searchFragranceOils call with a combined query (e.g. "leather blood orange cinnamon vanilla"). Never make multiple separate searches.
- If searchFragranceOils returns no oils or empty results: ask one targeted follow-up (e.g. "Do you want this more leathery, sweeter, or brighter?") then re-search once with adjusted query.
- After search returns oils, call calculateBlendProportions with the oil IDs, then call showBlendSuggestions with oils and proportions.
- Always write a friendly summary for the user after showBlendSuggestions.

**Stage 2 – Refinement**
- If user wants changes ("more leather", "less citrus"), call calculateBlendProportions again with preferences, then showBlendSuggestions again.

**Stage 3 – Products**
- When user confirms the blend ("I like it", "let's proceed"), call showProductPicker with productType (Candle, Soap, Room Spray).

**Stage 4 – Personalization**
- If user wants to save but hasn't given a name, call showPersonalizationForm with blendSummary. Describe the form fields and collect name + optional signature in chat.
- If they give a name directly ("Save as Spiced Leather"), call saveCustomBlend with that name.

**Stage 5 – Save**
- Call saveCustomBlend with name, productType, fragrances (oilId, oilName, proportionPct). Proportions must sum to 100.
- After saving, confirm and offer next steps (e.g. vessel selection, wax calculation).

Be conversational, concise, and always end with 1–2 follow-up options. Use the tool results to inform your responses—never fabricate oil names or proportions.
```

---

## Step 4: Connect Tools to Your Agent

1. Create or open your **Chatflow** or **Agentflow** (mood-mnky-command).
2. Add an **OpenAI Function Agent** (or equivalent) node.
3. Select all 9 Custom Tools you created.
4. Paste the System Prompt above into the agent's system message.
5. Ensure the LLM model supports function calling (e.g. gpt-4o, gpt-4o-mini).

---

## Step 5: Assign FLOWISE_API_KEY to Chatflow

This is **Flowise's** access control—it protects the Flowise prediction endpoint (`/api/v1/prediction/...`). It is **not** the same as MOODMNKY_API_KEY (which protects our `/api/flowise/tools/*` endpoints).

1. In Flowise, go to **API Keys** and ensure your Flowise API key is created.
2. Open the chatflow → **Settings** → **Configuration**.
3. Assign the Flowise API key to this chatflow so only authenticated requests can access the prediction endpoint.

---

## Step 6: Test the Embed

1. Ensure MOOD MNKY app has `NEXT_PUBLIC_FLOWISE_HOST`, `NEXT_PUBLIC_FLOWISE_CHATFLOW_ID`, and `NEXT_PUBLIC_FLOWISE_CHATFLOW_API_KEY` set. The embed passes `apiKey` to Flowise's prediction endpoint; use the same value as the key assigned to the chatflow in Flowise (Settings → Configuration).
2. Sign in to the app and go to `/craft`.
3. The Flowise chat should load. Try: "I want to blend a custom fragrance. Guide me through it."

**401 disambiguation:** If the embed loads but tool calls fail with 401, check `MOODMNKY_API_KEY` (Flowise → vars). If the prediction call itself 401s, check `FLOWISE_API_KEY` (embed/API client).

---

## Troubleshooting: "predictionsServices.buildChatflow - Unauthorized"

If the embed shows **Unauthorized** when sending a message:

| Cause | Fix |
|-------|-----|
| Chatflow has API key assigned | Add `NEXT_PUBLIC_FLOWISE_CHATFLOW_API_KEY` to your app env with the same value as the key assigned to the chatflow in Flowise. |
| Key not passed to embed | The craft page passes `apiKey` to `Chatbot.init()` when `NEXT_PUBLIC_FLOWISE_CHATFLOW_API_KEY` is set. Restart dev server after adding the env var. |
| Wrong key | Verify in Flowise: chatflow **Settings → Configuration** shows which API key is assigned. Use that exact value. |

---

## Troubleshooting: "Missing $vars.moodMnkyApiKey"

If the chat reports *"Missing $vars.moodMnkyApiUrl"* or *"Missing $vars.moodMnkyApiKey"*, the Custom Tools cannot resolve those variables. Per [Flowise Variables docs](https://docs.flowiseai.com/using-flowise/variables) and community reports:

### Location and method

| Step | Action |
|------|--------|
| 1 | Go to **Variables** (left sidebar) — "Create and manage global variables". |
| 2 | Click **+ Add Variable**. Create **both** `moodMnkyApiUrl` and `moodMnkyApiKey` with exact names. |
| 3 | **moodMnkyApiUrl**: Type **Static**, Value `https://mnky-command.moodmnky.com`. |
| 4 | **moodMnkyApiKey**: Type **Static**, Value = same as `FLOWISE_API_KEY` in your app env. (Runtime has no value input; use Static.) |
| 5 | If using **Workspaces**: Create variables in the **same workspace** as the chatflow (resources are isolated per workspace). |
| 6 | Chatflow **Settings → Configuration → Security**: Enable **Override Configuration** (for `userId` from embed). |
| 7 | **Allowed Domains**: Add `https://mnky-command.moodmnky.com` so the embed is allowed. |
| 8 | Restart or re-run the chatflow after adding variables. |

**Why variables must exist first:** `overrideConfig.vars` only **overrides** existing variables. If a variable is not created in the Variables UI, it stays undefined and tools see "Missing $vars.xxx".

---

## Troubleshooting: 405 Method Not Allowed

If Flowise reports **405 Method Not Allowed** when calling `intake-form` or other tools:

| Cause | Fix |
|-------|-----|
| **CORS preflight** | The route handler exports `OPTIONS` to handle preflight. Ensure the latest `app/api/flowise/tools/[tool]/route.ts` is deployed. |
| **Vercel deployment** | Redeploy after adding the OPTIONS handler; Vercel caches builds. |
| **Wrong URL** | Tools must call `POST ${baseUrl}/api/flowise/tools/intake-form` (with `tools` in the path). |
| **Proxy/CDN** | If mnky-command.moodmnky.com is behind Cloudflare or similar, check that POST is allowed and no rule strips or rewrites the method. |

The route accepts `POST` and `OPTIONS`. If the error persists after redeploy, inspect the request in Flowise logs (method, URL, response status) or use browser DevTools Network tab when the embed loads.

---

## Debugging with Filesystem MCP

To debug Flowise and related projects more comprehensively, the **Filesystem MCP** (Docker) is configured in `.cursor/mcp.json` with access to `C:\DEV-MNKY` — the development root.

**Setup:**

| Setting | Value |
|---------|-------|
| **Path** | `C:\DEV-MNKY` (mounts to `/projects` in the container) |
| **Image** | `mcp/filesystem` |
| **Transport** | Docker stdio |

**Requirements:** Docker Desktop running; `C:\` must be shared for bind mounts (default in Docker Desktop).

**What you get access to:**

- **Flowise:** Config, env files, Docker Compose, tool definitions, logs (when Flowise runs locally or you inspect its repo under `C:\DEV-MNKY`)
- **mood-mnky-command:** This repo (`flowise/tools/*.json`, `app/api/flowise/`, etc.)
- **Other projects:** Any folder under `C:\DEV-MNKY`

**Flowise local:** If Flowise runs on `http://localhost:3030`, it may live under `C:\DEV-MNKY` (e.g. `flowise/` or similar). The MCP can read its config, `.env`, and `docker-compose*.yml` to debug connectivity, tool registration, and env vars. The MCP does **not** call Flowise’s HTTP API — it only reads/writes files. Use `fetch` or the browser for HTTP debugging.

**WSL users:** If Docker runs inside WSL, use the WSL path (e.g. `/mnt/c/DEV-MNKY`) in the mount `src=` instead of `C:/DEV-MNKY`. Or wrap the command with `wsl.exe` per [browniantech/filesystem-mcp-wsl](https://browniantech.com/blog/post/How-to-use-the-filesystem-mcp-with-WSL-and-Docker).

---

## Authentication: One Header Scheme

Our MOOD MNKY API accepts only `Authorization: Bearer <key>`. Do not mix with `x-api-key` in the Custom Tools—use `Authorization: Bearer` consistently so failures are easier to debug.

---

## Backend Security Notes

The MOOD MNKY backend **must enforce** the following when handling `/api/flowise/tools/*` requests:

| Requirement | Implementation |
|-------------|----------------|
| **Validate MOODMNKY_API_KEY** | Reject requests without valid `Authorization: Bearer`; do not trust unauthenticated calls. |
| **Do not trust `userId` blindly** | Treat `userId` (from body/headers) as a claim. When applicable, map it to an authenticated app user/session and reject if invalid. |
| **Rate-limit** | Apply per-session or per-key rate limits; tools can be retried aggressively and may spike traffic. |
| **SSRF protection** | You call your own backend from Flowise—no proxy. Ensure the backend never becomes an open proxy or forwards requests to arbitrary URLs. |

**Correlation headers:** The tools send `x-moodmnky-session-id`, `x-moodmnky-chat-id`, and `x-moodmnky-chatflow-id`. Log these server-side for request tracing and debugging.

---

## DRY Note: Tool Template

The 9 tools share ~50 lines of boilerplate (config checks, fetchFn, headers, timeout, error handling). When changing headers, timeouts, or error shape, update all 9 tools. To reduce drift, copy a freshly updated tool in the Flowise UI when creating new tools, or maintain a single template snippet in this doc and paste/adjust per tool.
