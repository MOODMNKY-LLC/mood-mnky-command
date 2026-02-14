# Flowise MOOD MNKY Tools

Custom Tools for the fragrance crafting chatflow. These can be **uploaded via Flowise API** or **created manually** in the Flowise UI by copying from `docs/FLOWISE-CHATFLOW-SETUP.md`.

## Tool JSON Files

Each file in `tools/` matches the [Flowise Tools API](https://docs.flowiseai.com/api-reference/tools) format:

| Field | Description |
|-------|-------------|
| `name` | Tool identifier (e.g. `getLatestFunnelSubmission`) |
| `description` | When to use—the LLM uses this to decide tool selection |
| `schema` | JSON Schema for input parameters |
| `func` | JavaScript function body (uses `$vars`, `$flow`, `$propName`) |

## Upload via API

Flowise exposes `POST /api/v1/tools` to create tools. Use your **Flowise API key** (not MOODMNKY_API_KEY).

### Option 1: curl (one tool)

```bash
FLOWISE_URL="https://flowise-dev.moodmnky.com"
FLOWISE_API_KEY="your-flowise-api-key"

curl -X POST "${FLOWISE_URL}/api/v1/tools" \
  -H "Authorization: Bearer ${FLOWISE_API_KEY}" \
  -H "Content-Type: application/json" \
  -d @tools/getLatestFunnelSubmission.json
```

### Option 2: Bulk upload script

```bash
# From project root
for f in flowise/tools/*.json; do
  echo "Uploading $(basename $f)..."
  curl -s -X POST "${FLOWISE_URL}/api/v1/tools" \
    -H "Authorization: Bearer ${FLOWISE_API_KEY}" \
    -H "Content-Type: application/json" \
    -d @"$f" | jq .
done
```

### Option 3: Manual creation in Flowise UI

1. Go to **Tools** → **Add Tool** → **Custom Tool**
2. Use the content from `docs/FLOWISE-CHATFLOW-SETUP.md` for each tool
3. Paste **Name**, **Description**, **Input Schema** (as properties), and **JavaScript Function**

## Prerequisites

Before tools can run:

1. **Flowise variables** (chatflow Configuration):
   - `moodMnkyApiUrl` (static) — your MOOD MNKY app URL
   - `moodMnkyApiKey` (runtime) — from `process.env.MOODMNKY_API_KEY`
   - `userId` (override) — passed from embed via `chatflowConfig.vars.userId`

2. **Override Configuration** enabled for `vars.userId` only

See `docs/FLOWISE-CHATFLOW-SETUP.md` for full setup.

## Tool List

| File | Tool Name | Purpose |
|------|-----------|---------|
| getLatestFunnelSubmission.json | getLatestFunnelSubmission | Get user's latest intake submission |
| showIntakeForm.json | showIntakeForm | Show intake form (mood, product type, hints) |
| submitIntakeAnswers.json | submitIntakeAnswers | Submit intake answers |
| searchFragranceOils.json | searchFragranceOils | Search oils by name/family/notes |
| calculateBlendProportions.json | calculateBlendProportions | Calculate blend proportions |
| showBlendSuggestions.json | showBlendSuggestions | Present blend suggestion to user |
| showProductPicker.json | showProductPicker | Show Shopify product picker |
| showPersonalizationForm.json | showPersonalizationForm | Collect blend name/signature |
| saveCustomBlend.json | saveCustomBlend | Save custom blend |
