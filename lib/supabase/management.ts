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

export async function listTables(schema = "public"): Promise<TableInfo[]> {
  const ref = getProjectRef()
  const res = await fetch(
    `${MANAGEMENT_API_URL}/v1/projects/${ref}/database/tables?schema=${schema}`,
    { headers: getHeaders() }
  )
  if (!res.ok) throw new Error(`Failed to list tables: ${res.status} ${await res.text()}`)
  return res.json()
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
