/**
 * App Factory: server-side data helpers.
 * Fetches customers, templates with versions, and tenants for the Launch Wizard.
 */

import { createClient } from "@/lib/supabase/server";
import { getResolvedTemplatePath } from "./env";

export type CustomerRow = {
  id: string;
  name: string;
  legal_name: string | null;
  status: string;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  notes: string | null;
  created_at: string;
};

export type TenantRow = {
  id: string;
  slug: string;
  name: string;
  status: string;
};

export type TemplateRow = {
  id: string;
  template_key: string;
  display_name: string;
  current_version: string | null;
  status: string;
  sort_order?: number | null;
  source_path?: string | null;
};

export type TemplateVersionRow = {
  id: string;
  template_id: string;
  version: string;
  manifest_json: Record<string, unknown>;
  git_ref: string | null;
  release_notes: string | null;
};

export type TemplateWithVersions = TemplateRow & {
  versions: TemplateVersionRow[];
};

/** Dashboard at-a-glance: counts for App Factory landing (customers, projects, templates). */
export async function getAppFactoryDashboardCounts(): Promise<{
  customersCount: number;
  projectsCount: number;
  templatesCount: number;
}> {
  const supabase = await createClient();
  const [customersRes, projectsRes, templatesRes] = await Promise.all([
    supabase.from("customers").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("projects").select("id", { count: "exact", head: true }),
    supabase.from("template_registry").select("id", { count: "exact", head: true }).eq("status", "active"),
  ]);
  return {
    customersCount: customersRes.count ?? 0,
    projectsCount: projectsRes.count ?? 0,
    templatesCount: templatesRes.count ?? 0,
  };
}

/** Fetch all customers (platform_admin only per RLS). */
export async function getCustomers(): Promise<CustomerRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .select("id, name, legal_name, status, primary_contact_name, primary_contact_email, notes, created_at")
    .eq("status", "active")
    .order("name");
  if (error) throw error;
  return (data ?? []) as CustomerRow[];
}

/** Fetch tenants the current user is a member of (for project scope). */
export async function getTenantsForCurrentUser(): Promise<TenantRow[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data: members, error: membersError } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user.id);
  if (membersError) throw membersError;
  const tenantIds = (members ?? []).map((m) => m.tenant_id);
  if (tenantIds.length === 0) return [];
  const { data, error } = await supabase
    .from("tenants")
    .select("id, slug, name, status")
    .in("id", tenantIds)
    .eq("status", "active")
    .order("name");
  if (error) throw error;
  return (data ?? []) as TenantRow[];
}

/** Fetch template registry with their versions (for Launch Wizard template step). */
export async function getTemplatesWithVersions(): Promise<TemplateWithVersions[]> {
  const supabase = await createClient();
  const { data: templates, error: templatesError } = await supabase
    .from("template_registry")
    .select("id, template_key, display_name, current_version, status, sort_order, source_path")
    .eq("status", "active")
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("display_name");
  if (templatesError) throw templatesError;
  if (!templates?.length) return [];

  const { data: versions, error: versionsError } = await supabase
    .from("template_versions")
    .select("id, template_id, version, manifest_json, git_ref, release_notes")
    .in(
      "template_id",
      templates.map((t) => t.id)
    )
    .order("version", { ascending: false });
  if (versionsError) throw versionsError;

  const versionsByTemplate = (versions ?? []).reduce(
    (acc, v) => {
      const tid = v.template_id as string;
      if (!acc[tid]) acc[tid] = [];
      acc[tid].push(v as TemplateVersionRow);
      return acc;
    },
    {} as Record<string, TemplateVersionRow[]>
  );

  return templates.map((t) => ({
    ...(t as TemplateRow),
    versions: versionsByTemplate[t.id] ?? [],
  }));
}

/** Resolve absolute template path for a template_key (for pipeline). Uses template_registry.source_path. */
export async function getTemplateSourcePath(templateKey: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("template_registry")
    .select("source_path")
    .eq("template_key", templateKey)
    .eq("status", "active")
    .maybeSingle();
  if (error || !data?.source_path) return null;
  return getResolvedTemplatePath(data.source_path as string);
}
