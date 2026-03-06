# Auth troubleshooting (production)

## "Unexpected end of JSON input" on sign-up or sign-in

This error means the browser received a response from the Supabase Auth API that was empty or not valid JSON when the client tried to parse it.

### What we do in the app

Sign-up and login pages catch this error and show a user-friendly message instead of the raw JSON parse error. That does **not** fix the underlying cause.

### Likely causes in production

1. **Wrong or missing Supabase URL**
   - In your production environment (e.g. Vercel), ensure `NEXT_PUBLIC_SUPABASE_MT_URL` is set to your **project API URL**, e.g. `https://<project-ref>.supabase.co` (hosted) or your self-hosted Auth URL.
   - It must **not** be the Dashboard URL, a redirect URL, or an empty value.

2. **Supabase project paused (hosted)**
   - If the project is paused, the API may return an HTML page or non-JSON response. Resume the project in the Supabase Dashboard.

3. **Proxy or tunnel in front of Auth**
   - If Auth is behind Cloudflare Tunnel, nginx, or another proxy, ensure it forwards the request body and returns the real API response (JSON). A 502/504 or custom error page that returns HTML or an empty body will trigger this error.

4. **CORS / network**
   - Confirm the Auth URL is reachable from the browser (no firewall blocking, correct domain). Open `NEXT_PUBLIC_SUPABASE_MT_URL` in a browser and check it returns JSON (e.g. a 401 or 404 JSON body), not an HTML error page.

### Quick checks

- In production, open DevTools → Network, attempt sign-up, and inspect the request to the Supabase Auth endpoint. Check the response status code and body (empty vs HTML vs JSON).
- Verify production env vars: `NEXT_PUBLIC_SUPABASE_MT_URL` and `NEXT_PUBLIC_SUPABASE_MT_ANON_KEY` match the same project and are present in the build.
