/**
 * App Factory: Compose stacks stored in Supabase.
 * Retrieve content for Coolify raw deploy; sync from repo (template source_path).
 * When syncing for Coolify, we strip host port bindings for MinIO (and other conflict-prone
 * services) so multiple stacks on the same host do not hit "port is already allocated".
 */

import { readFileSync } from "fs";
import { join } from "path";
import { createClient } from "@/lib/supabase/server";
import { getResolvedTemplatePath } from "./env";

const MINIO_PORTS_LINE_1 = '      - "${MINIO_API_PORT:-9000}:9000"';
const MINIO_PORTS_LINE_2 = '      - "${MINIO_CONSOLE_PORT:-9001}:9001"';
const MINIO_PORTS_REPLACEMENT = `    # Host ports omitted for Coolify to avoid "port already allocated"; use http://minio:9000 inside the stack.
`;

/**
 * Transform compose content for Coolify: remove host port mappings for services that often
 * conflict when multiple stacks run on one host (e.g. MinIO 9000/9001). Internal access
 * (e.g. http://minio:9000) still works; only host bindings are removed.
 */
function transformComposeForCoolify(content: string): string {
  // MinIO: remove host port bindings so multiple Coolify stacks don't hit "port already allocated"
  if (
    content.includes("minio:") &&
    content.includes(MINIO_PORTS_LINE_1) &&
    content.includes(MINIO_PORTS_LINE_2)
  ) {
    const portsBlock =
      "\n    ports:\n      - \"${MINIO_API_PORT:-9000}:9000\"\n      - \"${MINIO_CONSOLE_PORT:-9001}:9001\"\n";
    content = content.replace(portsBlock, "\n" + MINIO_PORTS_REPLACEMENT);
  }
  return content;
}

/**
 * Get Docker Compose YAML content by template key. Returns null if not found.
 */
export async function getComposeContentByTemplateKey(
  templateKey: string
): Promise<string | null> {
  if (!templateKey?.trim()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("compose_stacks")
    .select("content")
    .eq("template_key", templateKey.trim())
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  const content = data?.content;
  return typeof content === "string" ? content : null;
}

export type SyncComposeStackResult =
  | { success: true; template_key: string }
  | { success: false; error: string };

/**
 * Sync compose content from the repo into Supabase for a given template.
 * Reads docker-compose.yml from the template's source_path and upserts compose_stacks.
 * Call periodically or from admin UI to pull updated versions from the repo.
 * Requires platform_admin (RLS).
 */
export async function syncComposeStackFromSource(
  templateKey: string
): Promise<SyncComposeStackResult> {
  if (!templateKey?.trim()) {
    return { success: false, error: "template_key is required." };
  }
  const supabase = await createClient();
  const { data: template, error: templateError } = await supabase
    .from("template_registry")
    .select("id, template_key, display_name, source_path")
    .eq("template_key", templateKey.trim())
    .limit(1)
    .maybeSingle();
  if (templateError) {
    return { success: false, error: `Template lookup: ${templateError.message}` };
  }
  const sourcePath = (template as { source_path?: string | null } | null)?.source_path;
  if (!sourcePath?.trim()) {
    return {
      success: false,
      error: `Template "${templateKey}" has no source_path. Add source_path in template_registry (e.g. docker-compose).`,
    };
  }
  const resolvedDir = getResolvedTemplatePath(sourcePath);
  if (!resolvedDir) {
    return {
      success: false,
      error: `Resolved path for source_path "${sourcePath}" not found. Check APP_FACTORY_TEMPLATE_BASE or repo layout.`,
    };
  }
  const composeFileName =
    templateKey.trim().toLowerCase() === "full-stack"
      ? "docker-compose.full-stack.yml"
      : "docker-compose.yml";
  const composePath = join(resolvedDir, composeFileName);
  let content: string;
  try {
    content = readFileSync(composePath, "utf-8");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { success: false, error: `Read compose file: ${msg}` };
  }
  // Strip host port bindings for Coolify so multiple stacks don't conflict (e.g. MinIO 9000)
  content = transformComposeForCoolify(content);
  const name = (template as { display_name?: string } | null)?.display_name ?? templateKey;
  const { error: upsertError } = await supabase.from("compose_stacks").upsert(
    {
      template_key: templateKey.trim(),
      name,
      content,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "template_key" }
  );
  if (upsertError) {
    return { success: false, error: `Supabase upsert: ${upsertError.message}` };
  }
  return { success: true, template_key: templateKey.trim() };
}
