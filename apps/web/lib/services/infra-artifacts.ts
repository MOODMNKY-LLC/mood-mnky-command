import type { SupabaseClient } from "@supabase/supabase-js"
import { BUCKETS, getPublicUrl } from "@/lib/supabase/storage"

export interface ServiceArtifactUrls {
  themeUrl?: string
  dockerUrl?: string
}

/**
 * Fetches latest artifact versions from infra_artifact_versions and returns
 * public URLs per service (theme and docker). Used by MNKY LABZ Service Analytics.
 */
export async function getLatestArtifactUrls(
  supabase: SupabaseClient,
): Promise<Record<string, ServiceArtifactUrls>> {
  const { data: rows, error } = await supabase
    .from("infra_artifact_versions")
    .select("artifact_type, service_id, storage_path")
    .order("created_at", { ascending: false })

  if (error) throw error

  const byService: Record<string, ServiceArtifactUrls> = {}

  for (const row of rows ?? []) {
    const sid = row.service_id ?? "global"
    if (!byService[sid]) byService[sid] = {}
    const url = getPublicUrl(supabase, BUCKETS.infraArtifacts, row.storage_path)
    if (row.artifact_type === "service_theme" && !byService[sid].themeUrl) byService[sid].themeUrl = url
    else if (row.artifact_type === "docker" && !byService[sid].dockerUrl) byService[sid].dockerUrl = url
  }

  return byService
}
