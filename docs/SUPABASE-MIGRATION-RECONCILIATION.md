# Supabase Migration Reconciliation

When `supabase db push` fails with "Remote migration versions not found in local", the remote `supabase_migrations.schema_migrations` table has versions that don't exist in your local `supabase/migrations/` folder. This guide summarizes how to fix it.

## Quick Reference

| Situation | Action |
|-----------|--------|
| Remote has versions not in local (e.g. 20260112*) | Strategy 1: Repair |
| History too far gone, repair impractical | Strategy 2: Baseline |
| Remote matches local prefix, just behind | Strategy 3: Simple push |

**Full plan:** Supabase Migration History Reconciliation (Cursor plans)

---

## 1. Diagnosis

From the project root:

```bash
supabase migration list --linked
```

Compare LOCAL vs REMOTE. If remote lists versions you don't have locally, use repair.

---

## 2. Strategy 1: Repair (Revert Remote-Only, Then Push)

### Get remote-only versions

Run in Dashboard SQL Editor or Supabase MCP:

```sql
SELECT version FROM supabase_migrations.schema_migrations
WHERE version NOT IN (
  -- Paste the list of your local migration versions (from filenames)
  -- e.g. '20250206000000','20260207031136',...
);
```

Save the output to a file (one version per line), e.g. `remote_only_versions.txt`.

### Revert remote-only in batches

Use the repair script:

```powershell
.\scripts\supabase-repair-remote-only.ps1 -VersionsFile remote_only_versions.txt
```

Optional: `-DryRun` to preview, `-ChunkSize 25` to reduce batch size.

### Mark local-only as applied

Use the helper script (scans `supabase/migrations/` and marks each as applied):

```powershell
.\scripts\supabase-repair-mark-local-applied.ps1
```

Or manually for each version:

```bash
supabase migration repair --linked --status applied <version>
```

### Verify and push

```bash
supabase migration list --linked
supabase db push
```

---

## 3. Strategy 2: Baseline (Clean Slate)

Use when repair is impractical. Dump prod schema, backup migrations, clear remote history, push a single baseline. See the full plan for step-by-step commands.

---

## 4. Strategy 3: Simple Push

If `supabase migration list` shows remote matching local up to a point and only local has newer migrations:

```bash
supabase db push
```

No repair needed.

---

## Project Linking

Ensure you're linked to the correct project:

```bash
supabase link --project-ref chmrszrwlfeqovwxyrmt
```

---

## References

- [Supabase migration repair](https://supabase.com/docs/reference/cli/supabase-migration-repair)
- [Migration History Mismatch (GitHub Discussion 40721)](https://github.com/orgs/supabase/discussions/40721)
- [Troubleshooting branches](https://supabase.com/docs/guides/troubleshooting/new-branch-doesnt-copy-database)
