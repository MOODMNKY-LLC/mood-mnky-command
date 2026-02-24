import type { ServiceStatusResult } from "./types"

export interface JellyfinConfig {
  baseUrl: string
  apiKey: string
}

function getEnvConfig(): JellyfinConfig | null {
  const baseUrl = process.env.JELLYFIN_BASE_URL?.replace(/\/$/, "")
  const apiKey = process.env.JELLYFIN_API_KEY
  return baseUrl && apiKey ? { baseUrl, apiKey } : null
}

export function isJellyfinConfigured(): boolean {
  return getEnvConfig() != null
}

export async function getJellyfinStatus(
  config?: JellyfinConfig | null,
): Promise<ServiceStatusResult> {
  const c = config ?? getEnvConfig()
  if (!c?.baseUrl || !c.apiKey) {
    return { error: "JELLYFIN_BASE_URL or JELLYFIN_API_KEY not set" }
  }
  try {
    const authHeader = `MediaBrowser Client="MOOD MNKY", Device="Server", DeviceId="mood-mnky-labz", Version="1.0", Token="${c.apiKey}"`
    const base = c.baseUrl.replace(/\/$/, "")
    const [systemRes, usersRes, healthRes] = await Promise.all([
      fetch(`${base}/System/Info`, {
        headers: { "X-Emby-Authorization": authHeader },
        signal: AbortSignal.timeout(8000),
      }),
      fetch(`${base}/Users`, {
        headers: { "X-Emby-Authorization": authHeader },
        signal: AbortSignal.timeout(8000),
      }),
      fetch(`${base}/health`, { signal: AbortSignal.timeout(5000) }),
    ])

    if (!systemRes.ok) {
      return { status: "unavailable", error: `System/Info ${systemRes.status}` }
    }

    const healthOk = healthRes.ok
    const system = (await systemRes.json()) as { ServerName?: string }
    const users = usersRes.ok ? ((await usersRes.json()) as unknown[]) : []

    return {
      status: healthOk ? "operational" : "degraded",
      metrics: {
        serverName: system.ServerName ?? "Jellyfin",
        userCount: users.length,
      },
    }
  } catch (err) {
    return {
      status: "unavailable",
      error: err instanceof Error ? err.message : "Request failed",
    }
  }
}

export interface JellyfinFeaturedItem {
  id: string
  name: string
  overview: string | null
  imageUrl: string | null
  type: string
}

/**
 * Fetch featured items (movies/series) for Main Media page.
 * Uses JELLYFIN_USER_ID or first user from /Users. Returns [] on error or missing config.
 */
export async function getJellyfinFeaturedItems(
  config?: JellyfinConfig | null,
  options?: { limit?: number; userId?: string }
): Promise<JellyfinFeaturedItem[]> {
  const c = config ?? getEnvConfig()
  if (!c?.baseUrl || !c.apiKey) return []

  const limit = options?.limit ?? 6
  const base = c.baseUrl.replace(/\/$/, "")
  const authHeader = `MediaBrowser Client="MOOD MNKY", Device="Server", DeviceId="mood-mnky-labz", Version="1.0", Token="${c.apiKey}"`

  let userId = options?.userId ?? process.env.JELLYFIN_USER_ID?.trim()
  if (!userId) {
    try {
      const usersRes = await fetch(`${base}/Users`, {
        headers: { "X-Emby-Authorization": authHeader },
        signal: AbortSignal.timeout(5000),
      })
      if (!usersRes.ok) return []
      const users = (await usersRes.json()) as Array<{ Id?: string }>
      userId = users?.[0]?.Id ?? ""
    } catch {
      return []
    }
  }
  if (!userId) return []

  try {
    const params = new URLSearchParams({
      Recursive: "true",
      IncludeItemTypes: "Movie,Series",
      SortBy: "Random",
      Limit: String(limit),
      Fields: "Overview,BackdropImageTags,PrimaryImageTag",
    })
    const res = await fetch(`${base}/Users/${userId}/Items?${params.toString()}`, {
      headers: { "X-Emby-Authorization": authHeader },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    const data = (await res.json()) as { Items?: Array<{
      Id?: string
      Name?: string
      Overview?: string
      Type?: string
      BackdropImageTags?: string[]
      ImageTags?: Record<string, string>
    }> }
    const items = data.Items ?? []
    return items.map((item) => {
      let imageUrl: string | null = null
      const tag = item.BackdropImageTags?.[0] ?? item.ImageTags?.Primary
      if (tag) {
        imageUrl = `${base}/Items/${item.Id}/Images/Backdrop?Tag=${tag}&MaxWidth=400`
      }
      return {
        id: item.Id ?? "",
        name: item.Name ?? "Untitled",
        overview: item.Overview ?? null,
        imageUrl,
        type: item.Type ?? "Unknown",
      }
    })
  } catch {
    return []
  }
}

/**
 * Fetch featured books for Main Media page.
 * Uses JELLYFIN_USER_ID or first user from /Users. Returns [] on error or missing config.
 */
export async function getJellyfinFeaturedBooks(
  config?: JellyfinConfig | null,
  options?: { limit?: number; userId?: string }
): Promise<JellyfinFeaturedItem[]> {
  const c = config ?? getEnvConfig()
  if (!c?.baseUrl || !c.apiKey) return []

  const limit = options?.limit ?? 6
  const base = c.baseUrl.replace(/\/$/, "")
  const authHeader = `MediaBrowser Client="MOOD MNKY", Device="Server", DeviceId="mood-mnky-labz", Version="1.0", Token="${c.apiKey}"`

  let userId = options?.userId ?? process.env.JELLYFIN_USER_ID?.trim()
  if (!userId) {
    try {
      const usersRes = await fetch(`${base}/Users`, {
        headers: { "X-Emby-Authorization": authHeader },
        signal: AbortSignal.timeout(5000),
      })
      if (!usersRes.ok) return []
      const users = (await usersRes.json()) as Array<{ Id?: string }>
      userId = users?.[0]?.Id ?? ""
    } catch {
      return []
    }
  }
  if (!userId) return []

  try {
    const params = new URLSearchParams({
      Recursive: "true",
      IncludeItemTypes: "Book",
      SortBy: "Random",
      Limit: String(limit),
      Fields: "Overview,ImageTags",
    })
    const res = await fetch(`${base}/Users/${userId}/Items?${params.toString()}`, {
      headers: { "X-Emby-Authorization": authHeader },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    const data = (await res.json()) as { Items?: Array<{
      Id?: string
      Name?: string
      Overview?: string
      Type?: string
      ImageTags?: Record<string, string>
    }> }
    const items = data.Items ?? []
    return items.map((item) => {
      let imageUrl: string | null = null
      const tag = item.ImageTags?.Primary ?? item.ImageTags?.Backdrop
      if (tag) {
        imageUrl = `${base}/Items/${item.Id}/Images/Primary?Tag=${tag}&MaxWidth=300`
      }
      return {
        id: item.Id ?? "",
        name: item.Name ?? "Untitled",
        overview: item.Overview ?? null,
        imageUrl,
        type: "Book",
      }
    })
  } catch {
    return []
  }
}

/**
 * Fetch featured music (albums) for Main Media page.
 * Uses JELLYFIN_USER_ID or first user from /Users. Returns [] on error or missing config.
 */
export async function getJellyfinFeaturedMusic(
  config?: JellyfinConfig | null,
  options?: { limit?: number; userId?: string }
): Promise<JellyfinFeaturedItem[]> {
  const c = config ?? getEnvConfig()
  if (!c?.baseUrl || !c.apiKey) return []

  const limit = options?.limit ?? 8
  const base = c.baseUrl.replace(/\/$/, "")
  const authHeader = `MediaBrowser Client="MOOD MNKY", Device="Server", DeviceId="mood-mnky-labz", Version="1.0", Token="${c.apiKey}"`

  let userId = options?.userId ?? process.env.JELLYFIN_USER_ID?.trim()
  if (!userId) {
    try {
      const usersRes = await fetch(`${base}/Users`, {
        headers: { "X-Emby-Authorization": authHeader },
        signal: AbortSignal.timeout(5000),
      })
      if (!usersRes.ok) return []
      const users = (await usersRes.json()) as Array<{ Id?: string }>
      userId = users?.[0]?.Id ?? ""
    } catch {
      return []
    }
  }
  if (!userId) return []

  try {
    const params = new URLSearchParams({
      Recursive: "true",
      IncludeItemTypes: "MusicAlbum",
      SortBy: "Random",
      Limit: String(limit),
      Fields: "Overview,ImageTags",
    })
    const res = await fetch(`${base}/Users/${userId}/Items?${params.toString()}`, {
      headers: { "X-Emby-Authorization": authHeader },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    const data = (await res.json()) as { Items?: Array<{
      Id?: string
      Name?: string
      Overview?: string
      Type?: string
      ImageTags?: Record<string, string>
    }> }
    const items = data.Items ?? []
    return items.map((item) => {
      let imageUrl: string | null = null
      const tag = item.ImageTags?.Primary ?? item.ImageTags?.Backdrop
      if (tag) {
        imageUrl = `${base}/Items/${item.Id}/Images/Primary?Tag=${tag}&MaxWidth=400`
      }
      return {
        id: item.Id ?? "",
        name: item.Name ?? "Untitled",
        overview: item.Overview ?? null,
        imageUrl,
        type: "MusicAlbum",
      }
    })
  } catch {
    return []
  }
}
