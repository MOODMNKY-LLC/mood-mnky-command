import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_MT_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_MT_ANON_KEY!
  );
}
