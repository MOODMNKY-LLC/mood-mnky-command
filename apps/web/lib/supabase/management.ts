// Supabase Management API client
// Docs: https://supabase.com/docs/reference/api

const MANAGEMENT_API_URL = "https://api.supabase.com"

function getHeaders(): HeadersInit {
  const token = process.env.SUPABASE_MANAGEMENT_API_TOKEN
  if (!token) throw new Error("SUPABASE_MANAGEMENT_API_TOKEN is not set")
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  }
}

function getProjectRef(): string {
  const ref = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF
  if (!ref) throw new Error("NEXT_PUBLIC_SUPABASE_PROJECT_REF is not set")
  return ref
}

export function isManagementConfigured(): boolean {
  return !!(
    process.env.SUPABASE_MANAGEMENT_API_TOKEN &&
    process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF
  )
}

// ---- Projects ----

export interface SupabaseProject {
  id: string
  organization_id: string
  name: string
  region: string
  created_at: string
  status: string
  database: {
    host: string
    version: string
  }
}

export async function listProjects(): Promise<SupabaseProject[]> {
  const res = await fetch(`${MANAGEMENT_API_URL}/v1/projects`, {
    headers: getHeaders(),
  })
  if (!res.ok) throw new Error(`Failed to list projects: ${res.status} ${await res.text()}`)
  return res.json()
}

export async function getProject(ref?: string): Promise<SupabaseProject> {
  const projectRef = ref || getProjectRef()
  const projects = await listProjects()
  const project = projects.find((p) => p.id === projectRef)
  if (!project) throw new Error(`Project ${projectRef} not found`)
  return project
}

// ---- Database / Tables ----

export interface TableColumn {
  name: string
  type: string
  default_value: string | null
  is_nullable: boolean
  is_identity: boolean
  is_unique: boolean
  comment: string | null
}

export interface TableInfo {
  id: number
  schema: string
  name: string
  comment: string | null
  columns: TableColumn[]
  rls_enabled: boolean
  primary_keys: { name: string }[]
  relationships: Array<{
    source_schema: string
    source_table_name: string
    source_column_name: string
    target_table_schema: string
    target_table_name: string
    target_column_name: string
  }>
}

/**
 * List tables via POST /database/query (the GET /database/tables endpoint does not exist).
 */
export async function listTables(schema = "public"): Promise<TableInfo[]> {
  const schemaParam = schema.replace(/'/g, "''") // escape for SQL
  const result = await executeSql(`
    WITH tables AS (
      SELECT
        c.oid::int AS id,
        n.nspname AS schema,
        c.relname AS name,
        obj_description(c.oid, 'pg_class') AS comment,
        COALESCE(c.relrowsecurity, false) AS rls_enabled
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = '${schemaParam}'
        AND c.relkind = 'r'
        AND NOT c.relispartition
      ORDER BY c.relname
    ),
    cols AS (
      SELECT
        c.relname AS table_name,
        json_agg(
          json_build_object(
            'name', a.attname,
            'type', pg_catalog.format_type(a.atttypid, a.atttypmod),
            'default_value', CASE WHEN d.adbin IS NOT NULL THEN pg_get_expr(d.adbin, d.adrelid) ELSE NULL END,
            'is_nullable', a.attnotnull = false,
            'is_identity', a.attidentity != '',
            'is_unique', false,
            'comment', col_description(a.attrelid, a.attnum)
          ) ORDER BY a.attnum
        ) AS columns
      FROM pg_attribute a
      JOIN pg_class c ON c.oid = a.attrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
      WHERE n.nspname = '${schemaParam}'
        AND c.relkind = 'r'
        AND a.attnum > 0
        AND NOT a.attisdropped
      GROUP BY c.relname
    ),
    pks AS (
      SELECT
        tc.table_name,
        json_agg(json_build_object('name', kcu.column_name)) AS primary_keys
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema = '${schemaParam}'
        AND tc.constraint_type = 'PRIMARY KEY'
      GROUP BY tc.table_name
    ),
    fks AS (
      SELECT
        tc.table_name AS source_table,
        json_agg(
          json_build_object(
            'source_schema', tc.table_schema,
            'source_table_name', tc.table_name,
            'source_column_name', kcu.column_name,
            'target_table_schema', ccu.table_schema,
            'target_table_name', ccu.table_name,
            'target_column_name', ccu.column_name
          )
        ) AS relationships
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.table_schema = '${schemaParam}'
        AND tc.constraint_type = 'FOREIGN KEY'
      GROUP BY tc.table_name
    )
    SELECT
      t.id,
      t.schema,
      t.name,
      t.comment,
      COALESCE(cols.columns, '[]'::json) AS columns,
      t.rls_enabled,
      COALESCE(pks.primary_keys, '[]'::json) AS primary_keys,
      COALESCE(fks.relationships, '[]'::json) AS relationships
    FROM tables t
    LEFT JOIN cols ON cols.table_name = t.name
    LEFT JOIN pks ON pks.table_name = t.name
    LEFT JOIN fks ON fks.source_table = t.name
    ORDER BY t.name
  `)

  if (result.error || !result.rows.length) {
    return []
  }

  return result.rows.map((row) => ({
    id: Number(row.id),
    schema: String(row.schema),
    name: String(row.name),
    comment: row.comment != null ? String(row.comment) : null,
    columns: Array.isArray(row.columns) ? row.columns : JSON.parse(String(row.columns || "[]")),
    rls_enabled: Boolean(row.rls_enabled),
    primary_keys: Array.isArray(row.primary_keys) ? row.primary_keys : JSON.parse(String(row.primary_keys || "[]")),
    relationships: Array.isArray(row.relationships) ? row.relationships : JSON.parse(String(row.relationships || "[]")),
  })) as TableInfo[]
}

// ---- SQL Execution ----

export interface SqlResult {
  columns: string[]
  rows: Record<string, unknown>[]
  rowCount: number
  error?: string
}

export async function executeSql(query: string): Promise<SqlResult> {
  const ref = getProjectRef()
  const res = await fetch(
    `${MANAGEMENT_API_URL}/v1/projects/${ref}/database/query`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ query }),
    }
  )

  if (!res.ok) {
    const errorText = await res.text()
    return {
      columns: [],
      rows: [],
      rowCount: 0,
      error: `SQL Error (${res.status}): ${errorText}`,
    }
  }

  const data = await res.json()

  // The Management API returns an array of row objects
  if (Array.isArray(data)) {
    const columns = data.length > 0 ? Object.keys(data[0]) : []
    return {
      columns,
      rows: data,
      rowCount: data.length,
    }
  }

  return {
    columns: [],
    rows: [],
    rowCount: 0,
    error: "Unexpected response format",
  }
}

// ---- Database Stats ----

export interface DatabaseStats {
  db_size: string
  active_connections: number
  max_connections: number
  role_count: number
  table_count: number
}

export async function getDatabaseStats(): Promise<DatabaseStats> {
  const result = await executeSql(`
    SELECT
      pg_size_pretty(pg_database_size(current_database())) as db_size,
      (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
      (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections,
      (SELECT count(*) FROM pg_roles WHERE rolcanlogin) as role_count,
      (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') as table_count
  `)

  if (result.error || result.rows.length === 0) {
    return {
      db_size: "Unknown",
      active_connections: 0,
      max_connections: 0,
      role_count: 0,
      table_count: 0,
    }
  }

  const row = result.rows[0]
  return {
    db_size: String(row.db_size || "Unknown"),
    active_connections: Number(row.active_connections) || 0,
    max_connections: Number(row.max_connections) || 0,
    role_count: Number(row.role_count) || 0,
    table_count: Number(row.table_count) || 0,
  }
}

// ---- RLS Policies ----

export interface RlsPolicy {
  id: number
  schema: string
  table: string
  name: string
  action: string
  roles: string[]
  command: string
  definition: string
  check: string | null
}

export async function listRlsPolicies(schema = "public"): Promise<RlsPolicy[]> {
  const result = await executeSql(`
    SELECT
      pol.oid::int as id,
      schemaname as schema,
      tablename as table,
      policyname as name,
      permissive as action,
      roles,
      cmd as command,
      qual as definition,
      with_check as check
    FROM pg_policies
    WHERE schemaname = '${schema}'
    ORDER BY tablename, policyname
  `)

  if (result.error) return []
  return result.rows as unknown as RlsPolicy[]
}
