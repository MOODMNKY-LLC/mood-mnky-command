/**
 * MOOD MNKY product narrative and offerings copy.
 * Single main offering: granular app services + full DevOps/Agent stack.
 * Voice: refined, minimalist, confident (MOOD MNKY brand).
 */

export const offerings = {
  /** Single main offering statement */
  main:
    "MOOD MNKY provides granular app services and a full DevOps/Agent stack for organizations and partners.",

  /** Granular: subscribe per app */
  granular:
    "Subscribe to only what you need: workflow automation (n8n), AI flows (Flowise), object storage (MinIO), or file collaboration (Nextcloud). Each app has its own use cases and can be provisioned independently.",

  /** Full stack: whole stack on homelab */
  fullStack:
    "Or subscribe to the full **MOOD MNKY DevOps Stack** (or **Agent Stack** with local AI and vector store). We provision and deploy the entire stack on one of our homelab VMs or LXCs as a custom white-label environment.",

  /** What you can build (one line each) */
  whatYouCanBuild: [
    "AI agents for scheduling, ops, and automation.",
    "Secure document summarization and private document analysis.",
    "Smarter bots and workflows with local or cloud models.",
    "Workflow automation with triggers, integrations, and AI nodes.",
    "RAG and retrieval with vector search and local LLMs.",
  ],

  /** Per-app short taglines (for cards/UI) */
  apps: {
    n8n: "Workflow automation — triggers, integrations, and AI nodes.",
    flowise: "AI flows and chatflows — visual builder, document stores, agents.",
    minio: "Object storage — S3-compatible, artifacts and binaries.",
    nextcloud: "File collaboration — sync, sharing, and team folders.",
    fullStack: "Full MOOD MNKY DevOps or Agent stack — provisioned on your homelab VM/LXC.",
  },

  /** Package names for provisioning */
  packageNames: {
    core: "Core",
    agent: "Agent",
    "agent-gpu-nvidia": "Agent GPU (Nvidia)",
    "agent-gpu-amd": "Agent GPU (AMD)",
    supabase: "Supabase-aware",
  },
} as const;

export type OfferingAppKey = keyof typeof offerings.apps;
export type PackageKey = keyof typeof offerings.packageNames;
