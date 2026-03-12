# Supabase Auth – Production Redirect URLs (Dual Domain)

MNKY LABZ uses Supabase Auth for admin login (email/password, magic links, password reset). With the dual-domain setup, both domains serve the same app. Add these redirect URLs in **Supabase Dashboard → Authentication → URL Configuration**.

## Where to configure

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select the production project (e.g. `coevjitstmuhdhbyizpk`)
3. Navigate to **Authentication** → **URL Configuration**

## Site URL

Set as the primary domain (used as default redirect when no `redirectTo` is specified):

```
https://mnky-command.moodmnky.com
```

## Additional Redirect URLs

Add these URLs to the allow list (one per line). Wildcards cover `/auth/confirm`, `/auth/confirm?next=...`, and similar paths used by sign-up, magic link, and password reset:

```
https://mnky-command.moodmnky.com/**
https://mnky-verse.moodmnky.com/**
```

**Discord OAuth (MNKY VERSE + Hydaelyn):** Supabase redirects to the app after Discord login. Ensure verse/Hydaelyn callback is allowed (covered by wildcards above). In **Discord Developer Portal** → your application → **OAuth2 → Redirects**, add the **Supabase** callback URL (this is what Discord validates; the app URL is configured in Supabase `additional_redirect_urls`):

- **Local:** Add both: `http://127.0.0.1:54521/auth/v1/callback` and `http://localhost:54521/auth/v1/callback` (port must match your Supabase local API port in `supabase/config.toml`).
- **Prod:** `https://<project-ref>.supabase.co/auth/v1/callback`

**Optional (explicit paths):** If you prefer exact URLs instead of wildcards:

```
https://mnky-command.moodmnky.com/auth/confirm
https://mnky-command.moodmnky.com/auth/confirm?next=/
https://mnky-command.moodmnky.com/auth/confirm?next=/auth/update-password
https://mnky-verse.moodmnky.com/auth/confirm
https://mnky-verse.moodmnky.com/auth/confirm?next=/
https://mnky-verse.moodmnky.com/auth/confirm?next=/auth/update-password
https://mnky-verse.moodmnky.com/verse/auth/callback
```

## Why both domains

- **mnky-command.moodmnky.com** – MNKY LABZ admin; users log in here via Supabase Auth
- **mnky-verse.moodmnky.com** – MNKY VERSE storefront; users may follow auth links (e.g. password reset) from either domain

The app uses `window.location.origin` for `redirectTo` / `emailRedirectTo`, so the redirect URL depends on which domain the user is on. Both must be allowed.

## Vercel preview deploys (optional)

For preview deployments, add:

```
https://*-<your-vercel-team-slug>.vercel.app/**
```

Replace `<your-vercel-team-slug>` with your Vercel team or account slug.
