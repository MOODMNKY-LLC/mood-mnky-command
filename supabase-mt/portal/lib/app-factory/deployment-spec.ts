/**
 * App Factory: deployment spec schema and validation.
 * Canonical representation of what should be built and where it should go.
 * Used for spec generation from intake form data and stored as immutable snapshot in deployment_specs.
 */

import { z } from "zod";

function isValidHostname(value: string): boolean {
  const s = value.trim().toLowerCase();
  if (!s || !s.includes(".")) return false;
  try {
    new URL(`http://${s}`);
    return true;
  } catch {
    return false;
  }
}

/** Identity: customer/project IDs */
export const deploymentSpecIdentitySchema = z.object({
  customer_id: z.string().uuid().optional().nullable(),
  project_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
});

/** App metadata: name, slug, domain */
export const deploymentSpecAppMetadataSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  domain: z
    .string()
    .min(1)
    .refine(isValidHostname, { message: "Domain must be a valid hostname (e.g. app.example.com)" })
    .optional(),
});

/** Branding: tokens, assets, theme */
export const deploymentSpecBrandingSchema = z.object({
  display_name: z.string().optional(),
  logo_asset_url: z.string().url().optional().nullable(),
  icon_asset_url: z.string().url().optional().nullable(),
  primary_color: z.string().optional().nullable(),
  secondary_color: z.string().optional().nullable(),
  accent_color: z.string().optional().nullable(),
  support_email: z.string().email().optional().nullable(),
  legal_footer: z.string().optional().nullable(),
});

/** Auth: providers, redirect URLs */
export const deploymentSpecAuthSchema = z.object({
  providers: z.array(z.string()).optional(),
  redirect_urls: z.array(z.string().url()).optional(),
  tenant_policy: z.enum(["shared", "dedicated"]).optional(),
});

/** Data: Supabase strategy, org model */
export const deploymentSpecDataSchema = z.object({
  supabase_strategy: z.enum(["shared_rls", "shared_schema", "dedicated_project"]),
  org_model: z.string().optional(),
  seed_behavior: z.enum(["none", "minimal", "full"]).optional(),
});

/** Deployment: runtime tier, Coolify project/environment, Proxmox target */
export const deploymentSpecDeploymentSchema = z.object({
  runtime_tier: z.enum(["shared_multi_tenant", "dedicated_app_shared_host", "dedicated_runtime"]),
  coolify_project_uuid: z.string().optional().nullable(),
  coolify_environment_uuid: z.string().optional().nullable(),
  coolify_server_uuid: z.string().optional().nullable(),
  /** When set, maps this host port to container 3000 (e.g. 3001, 3002). Use when not using domains and sharing one public IP. */
  coolify_host_port: z.number().int().min(1024).max(65535).optional().nullable(),
  proxmox_target_id: z.string().uuid().optional().nullable(),
});

/** Features: modules enabled/disabled */
export const deploymentSpecFeaturesSchema = z.object({
  modules: z.record(z.string(), z.boolean()).optional(),
});

/** Secret references: required secret names and scope (no values) */
export const deploymentSpecSecretsSchema = z.object({
  references: z.array(
    z.object({
      secret_name: z.string(),
      secret_scope: z.string().optional(),
      environment_name: z.string(),
    })
  ).optional(),
});

/** Template-specific config from manifest form_fields (key → value). */
export const deploymentSpecTemplateConfigSchema = z.record(z.string(), z.unknown()).optional();

/** Full deployment spec (v1) */
export const deploymentSpecSchema = z.object({
  spec_version: z.literal("1"),
  identity: deploymentSpecIdentitySchema,
  app_metadata: deploymentSpecAppMetadataSchema,
  branding: deploymentSpecBrandingSchema.optional(),
  auth: deploymentSpecAuthSchema.optional(),
  data: deploymentSpecDataSchema,
  deployment: deploymentSpecDeploymentSchema,
  features: deploymentSpecFeaturesSchema.optional(),
  secrets: deploymentSpecSecretsSchema.optional(),
  compliance_notes: z.string().optional(),
  /** Manifest-driven form field values (template-specific). */
  template_config: deploymentSpecTemplateConfigSchema,
});

export type DeploymentSpecIdentity = z.infer<typeof deploymentSpecIdentitySchema>;
export type DeploymentSpecAppMetadata = z.infer<typeof deploymentSpecAppMetadataSchema>;
export type DeploymentSpecBranding = z.infer<typeof deploymentSpecBrandingSchema>;
export type DeploymentSpecAuth = z.infer<typeof deploymentSpecAuthSchema>;
export type DeploymentSpecData = z.infer<typeof deploymentSpecDataSchema>;
export type DeploymentSpecDeployment = z.infer<typeof deploymentSpecDeploymentSchema>;
export type DeploymentSpecFeatures = z.infer<typeof deploymentSpecFeaturesSchema>;
export type DeploymentSpecSecrets = z.infer<typeof deploymentSpecSecretsSchema>;
export type DeploymentSpec = z.infer<typeof deploymentSpecSchema>;

/** Validate and parse; throws ZodError if invalid */
export function parseDeploymentSpec(data: unknown): DeploymentSpec {
  return deploymentSpecSchema.parse(data);
}

/** Safe parse; returns { success, data } or { success: false, error } */
export function safeParseDeploymentSpec(data: unknown): z.SafeParseReturnType<unknown, DeploymentSpec> {
  return deploymentSpecSchema.safeParse(data);
}
