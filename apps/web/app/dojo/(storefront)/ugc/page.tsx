import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UgcUploadClient } from "@/components/verse/ugc-upload-client"

export const dynamic = "force-dynamic"

export default async function VerseUgcPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: mySubmissions } = user
    ? await supabase
        .from("ugc_submissions")
        .select("id, type, caption, status, created_at")
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20)
    : { data: [] }

  return (
    <div className="verse-container mx-auto max-w-[var(--verse-page-width)] space-y-8 px-4 py-8 md:px-6">
      <h1 className="text-2xl font-semibold md:text-3xl">Share your moment</h1>
      <p className="text-muted-foreground">
        Upload a photo or video from a fragrance-related moment. Approved submissions can earn XP.
      </p>

      {!user ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">
              <Link href="/dojo/auth/discord" className="text-primary underline">
                Sign in
              </Link>{" "}
              to submit UGC.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <UgcUploadClient />
          <Card>
            <CardHeader>
              <CardTitle>My submissions</CardTitle>
            </CardHeader>
            <CardContent>
              {(!mySubmissions || mySubmissions.length === 0) && (
                <p className="text-muted-foreground text-sm">No submissions yet.</p>
              )}
              {mySubmissions && mySubmissions.length > 0 && (
                <ul className="divide-y text-sm">
                  {mySubmissions.map((s) => (
                    <li key={s.id} className="flex items-center justify-between py-2 first:pt-0">
                      <span className="capitalize">{s.type}</span>
                      <span className="text-muted-foreground">{s.status}</span>
                      <span>{new Date(s.created_at).toLocaleDateString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
