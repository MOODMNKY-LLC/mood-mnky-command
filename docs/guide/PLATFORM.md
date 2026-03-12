# Platform (Supabase)

View Supabase project info, tables, and run SQL. For developers and admins.

## Current Project

- **Project name** – Linked Supabase project
- **Status** – ACTIVE_HEALTHY or other
- **Region** – Deployment region
- **Database URL** – Connection string (masked)

## Tables

- **Table Editor** – Browse table schemas and row counts
- Lists tables in the public schema
- Click to view structure

## SQL Editor

- **SQL Editor** – Run raw SQL against the database
- Useful for debugging, migrations, or ad-hoc queries
- Use with caution – writes affect production when connected to prod

## Prerequisites

- Supabase project linked
- **SUPABASE_SERVICE_ROLE_KEY** or appropriate keys in environment
- See [Supabase Local and Production](../admin/SUPABASE-LOCAL-AND-PRODUCTION.md) in Admin Docs for local vs prod setup
