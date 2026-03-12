# Services icon mapping and card design

## Icon sources and coverage

Icons for the /main services section use **react-icons/si** (Simple Icons) for brands where available, and **lucide-react** for generic concepts and technologies without a Simple Icon.

### Bundle → tech icon mapping

| Service ID        | Bundle name           | Tech icons (Simple Icons / Lucide fallback) |
|-------------------|------------------------|---------------------------------------------|
| mnky-cloud        | MNKY CLOUD             | SiNextcloud; Lucide: Calendar, FolderSync, Server |
| mnky-media        | MNKY MEDIA             | SiJellyfin; Lucide: Film, BookOpen (Calibre), Radio (ARR) |
| mnky-drive        | MNKY DRIVE             | SiTruenas; Lucide: HardDrive, Share2 |
| mnky-auto         | MNKY AUTO              | SiN8N, SiOpenai, SiSupabase, SiLangchain; Lucide: Workflow (Flowise) |
| mnky-agents       | MNKY AGENTS            | SiOpenai, SiSupabase, SiLangchain; Lucide: Workflow (Flowise), Wrench |
| mnky-games        | MNKY GAMES             | SiSteam; Lucide: Gamepad2 (Palworld), Server |
| mood-mnky-experience | MOOD MNKY Experience | SiShopify; Lucide: Package, Gift, Sparkles |

### Feature string → icon (for tech row)

- **Nextcloud** → SiNextcloud
- **Jellyfin** → SiJellyfin
- **Jellyseerr**, **Prowlarr, Radarr, Sonarr, Lidarr** → Lucide Film or Radio
- **Calibre** → Lucide BookOpen
- **TrueNAS**, **TrueNAS Scale** → SiTruenas
- **n8n** → SiN8N
- **Flowise** → Lucide Workflow
- **LangChain** → SiLangchain
- **OpenAI** → SiOpenai
- **Supabase** → SiSupabase
- **Shopify** → SiShopify
- **Steam**, **Palworld** → SiSteam or Lucide Gamepad2
- **File sync**, **Calendar**, **ZFS**, **Snapshots**, etc. → Lucide equivalents; unknown → Lucide Box

### Fallback rule

If a feature or service has no Simple Icon, use a semantic Lucide icon (e.g. Workflow for automation, Server for self-hosted, Package for subscription).

---

## Service card layout (business-card style)

- **Order**: (1) Bundle image area, (2) Title + tagline, (3) Tech icons row, (4) Description, (5) Feature pills.
- **Bundle image**: Fixed aspect ratio **16/10** (e.g. 320×200px area). Placeholder when `bundleImageUrl` is unset: subtle gradient or neutral SVG; image when URL is set.
- **Tech icons row**: Horizontal flex, icon size **20px** (h-5 w-5), gap **8px**, with `title`/`aria-label` for accessibility. Max ~6–8 icons; truncate or collapse if more.
- **Styling**: Keep `MainGlassCard`, `main-float`, `main-glass-panel-card`, border and hover from `main-glass.css`. No new design tokens; use existing `text-foreground`, `text-muted-foreground`, `border-border`.
- **Responsive**: Card works in existing grid (sm:2, lg:3); image and text scale; icons wrap if needed.
