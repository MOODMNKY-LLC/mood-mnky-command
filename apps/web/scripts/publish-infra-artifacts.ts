/**
 * Publish infra artifacts (service themes, Docker files, n8n workflows) to Supabase Storage
 * and register them in infra_artifact_versions.
 *
 * Run from repo root: pnpm --filter web exec tsx apps/web/scripts/publish-infra-artifacts.ts [versionTag]
 * Or from apps/web: tsx scripts/publish-infra-artifacts.ts [versionTag]
 *
 * versionTag defaults to v1 or timestamp (e.g. 20260223120000). Load .env from repo root.
 * For production publish, if SUPABASE_SERVICE_ROLE_KEY is missing (e.g. not in Vercel pull),
 * the script will try loading .env.production.local from the repo root (gitignored).
 */

import { config as loadEnv } from "dotenv"
import { createAdminClient } from "@/lib/supabase/admin"
import { BUCKETS } from "@/lib/supabase/storage"
import * as fs from "fs"
import * as path from "path"

const INFRA_BUCKET = BUCKETS.infraArtifacts

// When run via "pnpm --filter web exec tsx scripts/...", cwd is apps/web.
// When run from repo root (e.g. pnpm run publish:infra), cwd is repo root.
function getInfraRoot(): string {
  const cwd = process.cwd()
  const fromRoot = path.join(cwd, "infra")
  if (fs.existsSync(fromRoot)) return fromRoot
  const fromWeb = path.join(cwd, "..", "..", "infra")
  if (fs.existsSync(fromWeb)) return fromWeb
  throw new Error(`infra/ not found from cwd=${cwd}. Run from repo root or apps/web.`)
}

type ArtifactType = "service_theme" | "docker" | "compose" | "n8n_workflow" | "other"

const SERVICE_DIR_TO_ID: Record<string, string> = {
  nextcloud: "mnky-cloud",
  jellyfin: "mnky-media",
  jellyseerr: "mnky-media",
  flowise: "mnky-agents",
  n8n: "mnky-auto",
}

interface ArtifactRow {
  artifact_type: ArtifactType
  service_id: string | null
  storage_path: string
  version_tag: string
}

async function uploadFile(
  supabase: ReturnType<typeof createAdminClient>,
  localPath: string,
  storagePath: string,
  contentType: string,
): Promise<void> {
  const buf = fs.readFileSync(localPath)
  const { error } = await supabase.storage.from(INFRA_BUCKET).upload(storagePath, buf, {
    contentType,
    upsert: true,
  })
  if (error) throw new Error(`Upload ${localPath} -> ${storagePath}: ${error.message}`)
  console.log("  uploaded:", storagePath)
}

function collectThemeArtifacts(infraRoot: string, versionTag: string): { localPath: string; storagePath: string; serviceId: string }[] {
  const themesDir = path.join(infraRoot, "service-themes")
  const out: { localPath: string; storagePath: string; serviceId: string }[] = []
  if (!fs.existsSync(themesDir)) return out
  for (const name of fs.readdirSync(themesDir)) {
    const dir = path.join(themesDir, name)
    if (!fs.statSync(dir).isDirectory()) continue
    const cssPath = path.join(dir, "mnky.css")
    if (!fs.existsSync(cssPath)) continue
    const serviceId = SERVICE_DIR_TO_ID[name] ?? name
    out.push({
      localPath: cssPath,
      storagePath: `themes/${versionTag}/${serviceId}/mnky.css`,
      serviceId,
    })
  }
  return out
}

function collectDockerArtifacts(infraRoot: string, versionTag: string): { localPath: string; storagePath: string; serviceId: string }[] {
  const dockerDir = path.join(infraRoot, "docker")
  const out: { localPath: string; storagePath: string; serviceId: string }[] = []
  if (!fs.existsSync(dockerDir)) return out
  for (const name of fs.readdirSync(dockerDir)) {
    const dir = path.join(dockerDir, name)
    if (!fs.statSync(dir).isDirectory()) continue
    const dockerfile = path.join(dir, "Dockerfile")
    if (!fs.existsSync(dockerfile)) continue
    const serviceId = SERVICE_DIR_TO_ID[name] ?? name
    out.push({
      localPath: dockerfile,
      storagePath: `docker/${versionTag}/${serviceId}/Dockerfile`,
      serviceId,
    })
  }
  return out
}

function collectN8nWorkflows(infraRoot: string, versionTag: string): { localPath: string; storagePath: string }[] {
  const workflowsDir = path.join(infraRoot, "n8n", "workflows")
  const out: { localPath: string; storagePath: string }[] = []
  if (!fs.existsSync(workflowsDir)) return out
  for (const name of fs.readdirSync(workflowsDir)) {
    if (!name.endsWith(".json")) continue
    const localPath = path.join(workflowsDir, name)
    if (!fs.statSync(localPath).isFile()) continue
    out.push({
      localPath,
      storagePath: `n8n/workflows/${versionTag}/${name}`,
    })
  }
  return out
}

/** Static assets for themes (e.g. logo). Stored at stable paths (no version tag) so CSS can reference them. */
function collectThemeAssets(infraRoot: string): { localPath: string; storagePath: string }[] {
  const repoRoot = path.dirname(infraRoot)
  const logoPath = path.join(repoRoot, "apps", "web", "public", "auth", "logo-hair.svg")
  const out: { localPath: string; storagePath: string }[] = []
  if (fs.existsSync(logoPath)) {
    out.push({ localPath: logoPath, storagePath: "assets/logo-hair.svg" })
  }
  return out
}

async function main() {
  const versionTag =
    process.argv.slice(2).find((a) => a !== "--") ?? `v${Date.now().toString(36)}`
  const infraRoot = getInfraRoot()
  if (!fs.existsSync(infraRoot)) {
    console.error("infra root not found at", infraRoot)
    process.exit(1)
  }
  // Optional: load production service role key from repo-root .env.production.local (gitignored).
  // Use override: true so we overwrite empty SUPABASE_SERVICE_ROLE_KEY from .env.production.
  const repoRoot = path.dirname(infraRoot)
  const productionLocal = path.join(repoRoot, ".env.production.local")
  if (fs.existsSync(productionLocal)) {
    loadEnv({ path: productionLocal, override: true })
  }
  console.log("Infra root:", infraRoot)
  console.log("Version tag:", versionTag)

  const supabase = createAdminClient()
  const rows: ArtifactRow[] = []

  // 1) Theme static assets (stable paths for CSS, e.g. logo)
  const themeAssets = collectThemeAssets(infraRoot)
  for (const { localPath, storagePath } of themeAssets) {
    const contentType = storagePath.endsWith(".svg") ? "image/svg+xml" : "application/octet-stream"
    await uploadFile(supabase, localPath, storagePath, contentType)
  }

  // 2) Service themes (versioned + stable "latest" path for Jellyfin @import)
  const themes = collectThemeArtifacts(infraRoot, versionTag)
  for (const { localPath, storagePath, serviceId } of themes) {
    await uploadFile(supabase, localPath, storagePath, "text/css")
    const latestPath = `themes/latest/${serviceId}/mnky.css`
    await uploadFile(supabase, localPath, latestPath, "text/css")
    rows.push({
      artifact_type: "service_theme",
      service_id: serviceId,
      storage_path: storagePath,
      version_tag: versionTag,
    })
  }

  // 3) Docker
  const dockers = collectDockerArtifacts(infraRoot, versionTag)
  for (const { localPath, storagePath, serviceId } of dockers) {
    await uploadFile(supabase, localPath, storagePath, "text/plain")
    rows.push({
      artifact_type: "docker",
      service_id: serviceId,
      storage_path: storagePath,
      version_tag: versionTag,
    })
  }

  // 4) n8n workflows
  const workflows = collectN8nWorkflows(infraRoot, versionTag)
  for (const { localPath, storagePath } of workflows) {
    await uploadFile(supabase, localPath, storagePath, "application/json")
    rows.push({
      artifact_type: "n8n_workflow",
      service_id: "mnky-auto",
      storage_path: storagePath,
      version_tag: versionTag,
    })
  }

  if (rows.length === 0) {
    console.log("No artifacts to publish.")
    return
  }

  const { error } = await supabase.from("infra_artifact_versions").insert(rows)
  if (error) {
    throw new Error(`Insert infra_artifact_versions: ${error.message}`)
  }
  console.log("Registered", rows.length, "rows in infra_artifact_versions.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
