import { z } from 'zod'

// -----------------------------------------------------------------------------
// Chat / AI models (Flowise chat UI)
// -----------------------------------------------------------------------------

export const AI_MODELS = [
  { id: 'openai/gpt-4o', name: 'GPT-4o', description: 'Fast, capable', provider: 'OpenAI' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', description: 'Efficient, affordable', provider: 'OpenAI' },
  { id: 'anthropic/claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', description: 'Balanced reasoning', provider: 'Anthropic' },
  { id: 'anthropic/claude-3-5-haiku', name: 'Claude 3.5 Haiku', description: 'Fast, lightweight', provider: 'Anthropic' },
  { id: 'google/gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Quick responses', provider: 'Google' },
  { id: 'google/gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Advanced reasoning', provider: 'Google' },
] as const

export type ModelId = (typeof AI_MODELS)[number]['id']
export type AgentModeId = 'default'

// -----------------------------------------------------------------------------
// Chat / Flowise (Flow-mnky)
// -----------------------------------------------------------------------------

export interface SourceDocument {
  pageContent: string
  metadata?: { source?: string; [key: string]: unknown }
}

export interface ChatSession {
  id: string
  title: string
  chatflowId: string
  chatflowName?: string
  createdAt: Date
  updatedAt: Date
  messageCount?: number
  flowise_chat_id?: string
  isPinned?: boolean
  isArchived?: boolean
  isTemporary?: boolean
  isPersisted?: boolean
  lastMessageAt?: Date
}

// -----------------------------------------------------------------------------
// Postgres schemas
// -----------------------------------------------------------------------------

export const postgresPrimaryKeySchema = z.object({
  schema: z.string(),
  table_name: z.string(),
  name: z.string(),
  table_id: z.number().int(),
})

export const postgresRelationshipSchema = z.object({
  id: z.number().int(),
  constraint_name: z.string(),
  source_schema: z.string(),
  source_table_name: z.string(),
  source_column_name: z.string(),
  target_table_schema: z.string(),
  target_table_name: z.string(),
  target_column_name: z.string(),
})

export const postgresColumnSchema = z.object({
  table_id: z.number().int(),
  schema: z.string(),
  table: z.string(),
  id: z.string().regex(/^(\d+)\.(\d+)$/),
  ordinal_position: z.number().int(),
  name: z.string(),
  default_value: z.any(),
  data_type: z.string(),
  format: z.string(),
  is_identity: z.boolean(),
  identity_generation: z.union([z.literal('ALWAYS'), z.literal('BY DEFAULT'), z.null()]),
  is_generated: z.boolean(),
  is_nullable: z.boolean(),
  is_updatable: z.boolean(),
  is_unique: z.boolean(),
  enums: z.array(z.string()),
  check: z.union([z.string(), z.null()]),
  comment: z.union([z.string(), z.null()]),
})

export const postgresTableSchema = z.object({
  id: z.number().int(),
  schema: z.string(),
  name: z.string(),
  rls_enabled: z.boolean(),
  rls_forced: z.boolean(),
  replica_identity: z.union([
    z.literal('DEFAULT'),
    z.literal('INDEX'),
    z.literal('FULL'),
    z.literal('NOTHING'),
  ]),
  bytes: z.number().int(),
  size: z.string(),
  live_rows_estimate: z.number().int(),
  dead_rows_estimate: z.number().int(),
  comment: z.string().nullable(),
  columns: z.array(postgresColumnSchema).optional(),
  primary_keys: z.array(postgresPrimaryKeySchema),
  relationships: z.array(postgresRelationshipSchema),
})

export const postgresExtensionSchema = z.object({
  name: z.string(),
  schema: z.union([z.string(), z.null()]),
  default_version: z.string(),
  installed_version: z.union([z.string(), z.null()]),
  comment: z.union([z.string(), z.null()]),
})

export type PostgresPrimaryKey = z.infer<typeof postgresPrimaryKeySchema>
export type PostgresRelationship = z.infer<typeof postgresRelationshipSchema>
export type PostgresColumn = z.infer<typeof postgresColumnSchema>
export type PostgresTable = z.infer<typeof postgresTableSchema>
export type PostgresExtension = z.infer<typeof postgresExtensionSchema>
