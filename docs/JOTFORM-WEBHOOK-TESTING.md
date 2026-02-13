# JotForm Webhook Local Testing

JotForm webhooks require a **public URL** that can receive POST requests. Your local `localhost` is not reachable from the internet, so you need a tunnel to expose it.

## Using ngrok

### 1. Install ngrok

```bash
# Via npm (global)
npm install -g ngrok

# Or download from https://ngrok.com/download
```

### 2. Start your app locally

```bash
pnpm dev
# App runs on http://localhost:3000
```

### 3. Start ngrok

In a separate terminal:

```bash
ngrok http 3000
```

ngrok will display a public URL such as:

```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```

### 4. Configure the webhook base URL

Set the ngrok URL as your app base for webhook registration:

**Option A: Environment variable**

Add to `.env`:

```
NEXT_PUBLIC_APP_URL=https://abc123.ngrok-free.app
```

Restart your dev server after changing `.env`.

**Option B: JOTFORM_WEBHOOK_BASE_URL (if supported)**

Some setups use a separate env var for webhook URLs. Check your webhook registration logic.

### 5. Register the webhook

1. Create a funnel with a test JotForm form (or use an existing one).
2. Register the webhook via:
   - Platform UI: Funnel detail → Register Webhook
   - API: `POST /api/funnels/{id}/webhook/register`
   - CLI: `pnpm funnel:setup --name "Test" --form-id YOUR_FORM_ID`

The webhook URL will be:

```
https://abc123.ngrok-free.app/api/jotform/webhook?token=YOUR_SECRET
```

(If `JOTFORM_WEBHOOK_SECRET` is set in `.env`.)

### 6. Submit the form and verify

1. Open the run URL: `https://abc123.ngrok-free.app/funnels/run/{funnelId}`
2. Fill and submit the form.
3. Check:
   - ngrok terminal: request appears
   - App terminal: no errors
   - Supabase: `funnel_runs` and `funnel_answers` are populated

### 7. Inspect webhook payloads (optional)

ngrok provides a web interface at `http://127.0.0.1:4040` for inspecting requests and responses.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Webhook returns 404 | Ensure the webhook route exists at `/api/jotform/webhook` |
| 401 Invalid token | Check `JOTFORM_WEBHOOK_SECRET` matches the token in the URL |
| ngrok URL changes | Free ngrok URLs change each restart. Re-register the webhook with the new URL. |
| CORS errors | JotForm webhooks are server-to-server; CORS does not apply. |

## Sandbox mode

Use a funnel with `sandbox: true` for testing so submissions do not affect production data. See [JOTFORM-API-ADMIN.md](./JOTFORM-API-ADMIN.md) for sandbox usage.
