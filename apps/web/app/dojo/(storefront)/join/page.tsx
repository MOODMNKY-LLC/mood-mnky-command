import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { VerseJoinClient } from "./verse-join-client"

export const dynamic = "force-dynamic"

/**
 * /dojo/join — Free-tier subscription entry.
 * Authenticated: claim free tier then redirect to /dojo.
 * Not authenticated: redirect to sign-in with return to /dojo/join.
 */
export default async function VerseJoinPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent("/dojo/join")}`)
  }

  return <VerseJoinClient />
}
