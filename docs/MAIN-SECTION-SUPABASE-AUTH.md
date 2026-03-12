# Main Section – Supabase Auth and Redirect URLs

When the public Main site (www.moodmnky.com) is served from the same app, Supabase Auth must allow redirects to the Main domain so that any auth flows (e.g. magic link, OAuth) that complete on www work correctly.

## Supabase Dashboard configuration

**Path:** Supabase project → **Authentication** → **URL Configuration**.

### Site URL

The **Site URL** is the default redirect when no `redirectTo` is specified (e.g. email confirmations, password reset). You can leave it set to your primary app URL (e.g. `https://mnky-command.moodmnky.com`). If you want the default post-login destination to be the Main site, set it to `https://www.moodmnky.com`.

### Redirect URLs

Add the Main domain to the **Redirect URLs** allow list so that auth callbacks can land on www:

- `https://www.moodmnky.com`
- `https://www.moodmnky.com/**`

The `**` pattern allows any path on that origin (e.g. `https://www.moodmnky.com/auth/callback`). Supabase supports these wildcards; see [Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).

### Checklist

- [ ] **Redirect URLs:** Add `https://www.moodmnky.com` and `https://www.moodmnky.com/**`.
- [ ] **Site URL:** Leave as primary app or set to `https://www.moodmnky.com` if Main should be the default post-login destination.
- [ ] **OAuth providers:** If you use Google/GitHub/Discord etc., ensure their redirect URIs in the provider’s console include `https://www.moodmnky.com/auth/callback` (or the path your app uses for that provider).

## Code

Do not hardcode `https://www.moodmnky.com` in redirect logic. Use `NEXT_PUBLIC_MAIN_APP_URL` or the request origin so that preview and local setups keep working.
