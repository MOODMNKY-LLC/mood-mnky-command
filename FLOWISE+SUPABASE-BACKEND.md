Flowise does **not** expose a separate family of `SUPABASE_*` server env vars for every Supabase product. The practical mapping is:

* **Supabase Postgres / pgvector / Record Manager / Flowise app DB** → Flowise `DATABASE_*` env vars, plus `PGSSLMODE` when needed. ([FlowiseAI][1])
* **Supabase Storage buckets via S3 protocol** → Flowise `STORAGE_TYPE=s3` plus the `S3_*` vars. Supabase Storage is S3-compatible, and Supabase documents server-side S3 credentials as Access Key ID, Secret Access Key, endpoint, and region. ([FlowiseAI][1])
* **Supabase Auth / Realtime** → there are **no Flowise instance env vars** that wire Flowise directly into Supabase Auth or Realtime as first-class backend subsystems. Flowise’s auth is configured with its own auth/session/JWT env vars, and Realtime would be something you integrate externally in your app or custom tools. ([FlowiseAI][2])
* **Supabase vector support** is supported through Postgres + `pgvector`; Flowise also has a Supabase vector store integration at the node level. ([FlowiseAI][3])

```env
##############################################
# FLOWISE ENV VARS RELEVANT TO SUPABASE
# (instance-level env vars only)
##############################################

########################################################
# 1) SUPABASE AS FLOWISE'S PRIMARY DATABASE (Postgres)
#    Use these if Flowise itself stores chatflows,
#    credentials, etc. in your Supabase Postgres DB.
########################################################

DATABASE_TYPE=postgres
DATABASE_HOST=your-project-ref.supabase.co
DATABASE_PORT=5432
DATABASE_NAME=postgres
DATABASE_USER=postgres
DATABASE_PASSWORD=your-supabase-db-password

# SSL / TLS for hosted Postgres
DATABASE_SSL=true
DATABASE_REJECT_UNAUTHORIZED=true
# Optional: base64-encoded client/self-signed cert if your setup needs it
DATABASE_SSL_KEY_BASE64=

# Frequently needed for Postgres SSL mode in Flowise/Postgres contexts
PGSSLMODE=require


########################################################
# 2) SUPABASE AS VECTOR DATABASE (pgvector)
#    Same underlying DB connection family.
#    Flowise's Supabase vector store node itself is configured
#    in the UI/node, but these env vars matter whenever your
#    instance or Postgres-based components need the DB.
########################################################

# Reuse the DATABASE_* and PGSSLMODE values above


########################################################
# 3) SUPABASE STORAGE BUCKETS VIA S3 PROTOCOL
#    Supabase Storage is S3-compatible, so Flowise can use it
#    through its generic S3 storage env vars.
########################################################

STORAGE_TYPE=s3

# Bucket name in Supabase Storage
S3_STORAGE_BUCKET_NAME=flowise

# S3 credentials generated from Supabase Storage S3 settings
S3_STORAGE_ACCESS_KEY_ID=your-supabase-s3-access-key-id
S3_STORAGE_SECRET_ACCESS_KEY=your-supabase-s3-secret-access-key

# Region and endpoint from Supabase project/storage S3 settings
S3_STORAGE_REGION=your-supabase-s3-region
S3_ENDPOINT_URL=https://your-project-ref.storage.supabase.co/storage/v1/s3

# Usually keep false unless your client specifically needs path-style
S3_FORCE_PATH_STYLE=false


########################################################
# 4) LOCAL FALLBACKS / NON-SUPABASE STORAGE
#    Not Supabase-specific, but relevant when deciding whether
#    Flowise uploads should go to Supabase buckets or local disk.
########################################################

# STORAGE_TYPE=local
# BLOB_STORAGE_PATH=/root/.flowise/storage


########################################################
# 5) FLOWISE AUTH ENV VARS
#    IMPORTANT: these are Flowise's own auth/session settings,
#    not native Supabase Auth integration.
########################################################

APP_URL=https://your-flowise-domain.com

JWT_AUTH_TOKEN_SECRET=
JWT_REFRESH_TOKEN_SECRET=
JWT_ISSUER=Flowise
JWT_AUDIENCE=Flowise
JWT_TOKEN_EXPIRY_IN_MINUTES=360
JWT_REFRESH_TOKEN_EXPIRY_IN_MINUTES=43200

EXPRESS_SESSION_SECRET=
TOKEN_HASH_SECRET=
SECURE_COOKIES=true

# Optional mail if using Flowise app auth flows
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
SMTP_SECURE=true
SENDER_EMAIL=team@example.com
ALLOW_UNAUTHORIZED_CERTS=false


########################################################
# 6) NO NATIVE INSTANCE-LEVEL SUPABASE AUTH / REALTIME VARS
#    These do NOT exist as official Flowise env vars today:
#
#    SUPABASE_URL=
#    SUPABASE_ANON_KEY=
#    SUPABASE_SERVICE_ROLE_KEY=
#    SUPABASE_JWT_SECRET=
#    SUPABASE_REALTIME_URL=
#
#    If you need these, they belong in:
#    - your custom app
#    - a custom tool / MCP / function
#    - node-level credentials inside Flowise
########################################################
```

The clean takeaway is this:

For a **Supabase-backed Flowise**, the env vars you actually need at the instance level are mostly just these two groups:

* `DATABASE_*` + `PGSSLMODE` for **Postgres / pgvector / record-manager-style use**
* `STORAGE_TYPE=s3` + `S3_*` for **Supabase Storage buckets through S3 compatibility** ([FlowiseAI][1])

What you **do not** currently get as official Flowise server env support is a native, holistic Supabase backend mode covering **Auth, Realtime, and Storage APIs** under dedicated `SUPABASE_*` instance variables. Those parts need to be handled in your surrounding app stack or with custom integrations. ([FlowiseAI][2])

I can turn this into a hardened `.env` template specifically for **self-hosted Flowise + Supabase + Coolify/Docker Compose** next.

[1]: https://docs.flowiseai.com/configuration/environment-variables "Environment Variables | FlowiseAI"
[2]: https://docs.flowiseai.com/configuration/authorization "Auth | FlowiseAI"
[3]: https://docs.flowiseai.com/integrations/langchain/vector-stores/supabase "Supabase | FlowiseAI"
