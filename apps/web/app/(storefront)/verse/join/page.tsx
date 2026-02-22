import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { VerseJoinClient } from "./verse-join-client"

export const dynamic = "force-dynamic"

/**
 * /verse/join — Free-tier subscription entry.
 * Authenticated: claim free tier then redirect to /verse.
 * Not authenticated: redirect to sign-in with return to /verse/join.
 */
export default async function VerseJoinPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent("/verse/join")}`)
  }

  return <VerseJoinClient />
}
