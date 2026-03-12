# App Factory templates (by framework)

Templates are stored under `infra/templates/<framework>/<template-slug>` so at a glance you can see which framework each app or service uses for deployment.

- **nextjs** — Next.js apps (e.g. multi-tenant Platforms app)
- **docker-compose** — Stack templates live at repo root (e.g. `docker-compose`) and are referenced by `template_registry.source_path` in Supabase

Template content is resolved from `template_registry.source_path` (relative to the App Factory base path). The generator copies the resolved directory when creating a new project.
