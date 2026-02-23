/**
 * Catalog of MOOD MNKY microservices for the Services gallery.
 * Add new entries here as the catalog grows.
 */
export interface MainServiceItem {
  id: string
  name: string
  tagline: string
  description: string
  features: string[]
}

export const MAIN_SERVICES: MainServiceItem[] = [
  {
    id: "mnky-cloud",
    name: "MNKY CLOUD",
    tagline: "Next-generation cloud instance",
    description:
      "Our managed Nextcloud instance for secure file sync, collaboration, and self-hosted productivity.",
    features: ["Nextcloud", "File sync & share", "Calendar & contacts", "Managed hosting"],
  },
  {
    id: "mnky-media",
    name: "MNKY MEDIA",
    tagline: "Streaming & media management",
    description:
      "Jellyfin media server with Jellyseerr for requests, plus a full ARR stack for automated media and e-books.",
    features: [
      "Jellyfin",
      "Jellyseerr (requesting)",
      "Prowlarr, Radarr, Sonarr, Lidarr",
      "Calibre for e-books",
    ],
  },
  {
    id: "mnky-drive",
    name: "MNKY DRIVE",
    tagline: "Remote business-grade storage",
    description:
      "Our TrueNAS Scale–powered storage solution delivers remote, business-level storage with ZFS reliability, snapshots, and flexible access for teams.",
    features: ["TrueNAS Scale", "ZFS storage", "Snapshots & replication", "SMB & NFS", "Remote access"],
  },
  {
    id: "mnky-auto",
    name: "MNKY AUTO",
    tagline: "AI automation platform",
    description:
      "Workflow and AI automation powered by n8n, Flowise, LangChain, OpenAI, and Supabase.",
    features: ["n8n", "Flowise", "LangChain", "OpenAI", "Supabase"],
  },
  {
    id: "mnky-agents",
    name: "MNKY AGENTS",
    tagline: "Custom deployable AI chatbots",
    description:
      "Bespoke AI agents and chatbots powered by OpenAI, Supabase, Flowise, LangChain, and a variety of tools and providers.",
    features: ["OpenAI", "Supabase", "Flowise", "LangChain", "Custom tools & providers"],
  },
  {
    id: "mnky-games",
    name: "MNKY GAMES",
    tagline: "Self-hosted gaming & Steam library sharing",
    description:
      "Our self-hosted gaming services run on our own cloud servers. Join our exclusive Steam Family to share games from our remote Steam library. Featured game: Palworld—community dedicated server for co-op, build, and explore with the MNKY VERSE.",
    features: [
      "Self-hosted game servers",
      "Exclusive Steam Family join — share games from our cloud-hosted Steam library",
      "Featured: Palworld dedicated server",
      "Community access",
    ],
  },
  {
    id: "mood-mnky-experience",
    name: "MOOD MNKY Experience",
    tagline: "Bespoke subscription & content",
    description:
      "A G.Q.-inspired subscription with quarterly drop boxes, bespoke content, gamification, and access to our Shopify store.",
    features: ["Quarterly drop boxes", "Bespoke content", "Gamification", "Shopify store"],
  },
]
