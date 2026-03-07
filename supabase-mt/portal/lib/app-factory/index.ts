/**
 * App Factory: deployment spec validation and types.
 * Re-export for convenience.
 */

export {
  deploymentSpecSchema,
  deploymentSpecIdentitySchema,
  deploymentSpecAppMetadataSchema,
  deploymentSpecBrandingSchema,
  deploymentSpecAuthSchema,
  deploymentSpecDataSchema,
  deploymentSpecDeploymentSchema,
  deploymentSpecFeaturesSchema,
  deploymentSpecSecretsSchema,
  parseDeploymentSpec,
  safeParseDeploymentSpec,
} from "./deployment-spec";
export type {
  DeploymentSpec,
  DeploymentSpecIdentity,
  DeploymentSpecAppMetadata,
  DeploymentSpecBranding,
  DeploymentSpecAuth,
  DeploymentSpecData,
  DeploymentSpecDeployment,
  DeploymentSpecFeatures,
  DeploymentSpecSecrets,
} from "./deployment-spec";
