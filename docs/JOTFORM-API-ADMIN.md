# JotForm Funnel Admin API

Admin funnel setup (create funnel, register webhook) can be done entirely via API or CLI. No UI required.

## Authentication

All endpoints use Supabase session cookies. To call from curl or a script you need a valid access token.

### Obtaining a Session Token

1. **From browser (DevTools):**
   - Log in to the app
   - Open Application > Cookies
   - Copy the `sb-<project-ref>-auth-token` value (or use the `access_token` from the JSON)

2. **From Supabase Auth (script):**
   ```ts
   const { data } = await supabase.auth.signInWithPassword({ email, password })
   const token = data.session?.access_token
   ```

3. **From Supabase Dashboard:**
   - Use the SQL editor to look up a user's token (not recommended for production)

### Using the Token

Pass the token in the `Authorization` header:

```
Authorization: Bearer <your-access-token>
```

**Note:** The authenticated user must have `profiles.role = 'admin'` to create or update funnel definitions.

### Alternative: API Key (No Session)

Set `FUNNEL_ADMIN_API_KEY` in `.env` and pass it in the `x-api-key` header. This bypasses session auth and allows scripts to call the funnel admin endpoints without a browser session.

```
x-api-key: YOUR_FUNNEL_ADMIN_API_KEY
```

---

## API Endpoints

Base URL: `https://your-domain.com` (or `http://localhost:3000` for local dev)

### 1. Create Funnel

With session token:
```bash
curl -X POST "https://your-domain.com/api/funnels" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Fragrance Intake",
    "description": "Optional description",
    "provider_form_id": "241234567890"
  }'
```

With API key (`FUNNEL_ADMIN_API_KEY`):
```bash
curl -X POST "https://your-domain.com/api/funnels" \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_FUNNEL_ADMIN_API_KEY" \
  -d '{
    "name": "Fragrance Intake",
    "description": "Optional description",
    "provider_form_id": "241234567890"
  }'
```

**Optional fields:**
- `sandbox` (boolean): Mark funnel as sandbox for testing. Sandbox funnels receive webhooks but can be filtered in the UI.

**Response:**
```json
{
  "funnel": {
    "id": "uuid-here",
    "name": "Fragrance Intake",
    "provider_form_id": "241234567890",
    "status": "draft",
    "sandbox": false
  }
}
```

### 2. Register Webhook

```bash
curl -X POST "https://your-domain.com/api/funnels/FUNNEL_ID/webhook/register" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "ok": true,
  "webhookId": "12345",
  "webhookUrl": "https://your-domain.com/api/jotform/webhook?token=..."
}
```

### 3. List Funnels

```bash
curl "https://your-domain.com/api/funnels" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Get Single Funnel

```bash
curl "https://your-domain.com/api/funnels/FUNNEL_ID" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## CLI Script (No Token Required)

For local or CI use, the `funnel:setup` script uses `SUPABASE_SERVICE_ROLE_KEY` and `JOTFORM_API_KEY` directly. No session token needed.

```bash
pnpm funnel:setup --name "Fragrance Intake" --form-id 241234567890
pnpm funnel:setup --name "Fragrance Intake" --form-id 241234567890 --description "Optional description"
```

**Requires in `.env`:**
- `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- `JOTFORM_API_KEY`
- `NEXT_PUBLIC_APP_URL` or `VERCEL_URL` (for webhook URL)
- `JOTFORM_WEBHOOK_SECRET` (optional; adds token to webhook URL)

**Output:**
```
Funnel created and webhook registered.

Funnel ID: abc-123-def
Run URL: https://your-domain.com/funnels/run/abc-123-def
Webhook URL: https://your-domain.com/api/jotform/webhook?token=...
```

---

## Form Builder Flow

Funnels can be created without a JotForm form ID. Use the in-app Form Builder to design and sync forms to JotForm.

1. **Create funnel** (leave `provider_form_id` blank)
2. **Open Form Builder** at `/platform/funnels/[id]/builder`
3. **Add questions** (type, text, order, required, semantic key)
4. **Map semantic keys** (product_type, fragrance_hints, target_mood, etc.) for deterministic extraction in Product Builder and Chat
5. **Create in JotForm** — calls `POST /form` via JotForm API, sets `provider_form_id`, adds hidden `run_id` and `user_id` fields
6. **Sync questions** — updates existing JotForm form when you change the schema

**Hidden fields:** When creating a form via the builder, `run_id` and `user_id` are added automatically so the embed URL can prefill them for run tracking.

---

## Local Webhook Testing (ngrok)

JotForm webhooks require a public URL. For local development:

1. Install ngrok: `npm i -g ngrok` or download from [ngrok.com](https://ngrok.com)
2. Run `ngrok http 3000` (or your dev port)
3. Set `NEXT_PUBLIC_APP_URL` or `JOTFORM_WEBHOOK_BASE_URL` to `https://<ngrok-id>.ngrok-free.app`
4. Register webhook with `{ngrokBase}/api/jotform/webhook?token=...`
5. Submit form and verify webhook in terminal and Supabase

See [JOTFORM-WEBHOOK-TESTING.md](./JOTFORM-WEBHOOK-TESTING.md) for full details.

---

## Sandbox Mode

Funnels with `sandbox: true` receive webhooks but are marked for testing. Use sandbox to:

- Test form submissions without affecting production data
- Validate webhook flow before activating a funnel

Sandbox funnels show a "Sandbox" badge in the platform UI. The webhook handler accepts submissions for both `status = 'active'` and `sandbox = true` funnels.
