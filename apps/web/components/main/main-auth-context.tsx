import { createClient } from "@/lib/supabase/server"
import { BUCKETS, getPublicUrl } from "@/lib/supabase/storage"
import type { BucketId } from "@/lib/supabase/storage"
import { MainUserProvider } from "./main-user-context"
import type { MainUser } from "./main-user-context"

/** Server component: fetches user + profile (with avatar URL resolution), wraps children with MainUserProvider. */
export async function MainAuthContext({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let userInfo: MainUser = null

  if (user) {
    let displayName: string | undefined
    let avatarUrl: string | undefined

    let isAdmin = false
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, role, is_admin")
        .eq("id", user.id)
        .single()

      if (profile) {
        displayName = profile.display_name ?? undefined
        isAdmin = profile.role === "admin" || profile.is_admin === true
        const rawAvatar = profile.avatar_url ?? undefined
        if (rawAvatar) {
          if (rawAvatar.startsWith("http")) {
            avatarUrl = rawAvatar
          } else {
            avatarUrl = getPublicUrl(
              supabase,
              BUCKETS.userAvatars as BucketId,
              rawAvatar
            )
          }
        }
      }
    } catch {
      // leave displayName/avatarUrl undefined
    }

    userInfo = {
      id: user.id,
      email: user.email ?? undefined,
      displayName,
      avatarUrl,
      isAdmin,
    }
  }

  return <MainUserProvider user={userInfo}>{children}</MainUserProvider>
}
