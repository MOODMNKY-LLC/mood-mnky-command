create extension if not exists "pg_cron" with schema "pg_catalog";

create extension if not exists "uuid-ossp" with schema "extensions";

create or replace function public.uuid_generate_v4() returns uuid as $$
  select extensions.uuid_generate_v4();
$$ language sql;

create extension if not exists "vector" with schema "extensions";

create extension if not exists "wrappers" with schema "extensions";

create schema if not exists "pgmq";

create extension if not exists "pgmq" with schema "pgmq";

create schema if not exists "n8n";

create schema if not exists "stripe";

create type "public"."pricing_plan_interval" as enum ('day', 'week', 'month', 'year');

create type "public"."pricing_type" as enum ('one_time', 'recurring');

create type "public"."subscription_status" as enum ('trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid');

create type "stripe"."invoice_status" as enum ('draft', 'open', 'paid', 'uncollectible', 'void', 'deleted');

create type "stripe"."pricing_tiers" as enum ('graduated', 'volume');

create type "stripe"."pricing_type" as enum ('one_time', 'recurring');

create type "stripe"."subscription_schedule_status" as enum ('not_started', 'active', 'completed', 'released', 'canceled');

create type "stripe"."subscription_status" as enum ('trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid', 'paused');

create sequence "n8n"."auth_provider_sync_history_id_seq";

create sequence "n8n"."execution_annotations_id_seq";

create sequence "n8n"."execution_entity_id_seq";

create sequence "n8n"."execution_metadata_temp_id_seq";

create sequence "n8n"."migrations_id_seq";

create sequence "n8n"."n8n_credentials_entity_id_seq";

create sequence "n8n"."n8n_execution_entity_id_seq";

create sequence "n8n"."n8n_migrations_id_seq";

create sequence "n8n"."n8n_tag_entity_id_seq";

create sequence "n8n"."n8n_workflow_entity_id_seq";

create sequence "public"."auth_provider_sync_history_id_seq";

create sequence "public"."execution_annotations_id_seq";

create sequence "public"."execution_entity_id_seq";

create sequence "public"."execution_metadata_temp_id_seq";

create sequence "public"."migrations_id_seq";

create sequence "public"."workflow_statistics_id_seq";

drop policy "media_delete_own" on "public"."media_assets";

drop policy "media_insert_own" on "public"."media_assets";

drop policy "media_select_own" on "public"."media_assets";

drop policy "media_update_own" on "public"."media_assets";

revoke delete on table "public"."media_assets" from "anon";

revoke insert on table "public"."media_assets" from "anon";

revoke references on table "public"."media_assets" from "anon";

revoke select on table "public"."media_assets" from "anon";

revoke trigger on table "public"."media_assets" from "anon";

revoke truncate on table "public"."media_assets" from "anon";

revoke update on table "public"."media_assets" from "anon";

revoke delete on table "public"."media_assets" from "authenticated";

revoke insert on table "public"."media_assets" from "authenticated";

revoke references on table "public"."media_assets" from "authenticated";

revoke select on table "public"."media_assets" from "authenticated";

revoke trigger on table "public"."media_assets" from "authenticated";

revoke truncate on table "public"."media_assets" from "authenticated";

revoke update on table "public"."media_assets" from "authenticated";

revoke delete on table "public"."media_assets" from "service_role";

revoke insert on table "public"."media_assets" from "service_role";

revoke references on table "public"."media_assets" from "service_role";

revoke select on table "public"."media_assets" from "service_role";

revoke trigger on table "public"."media_assets" from "service_role";

revoke truncate on table "public"."media_assets" from "service_role";

revoke update on table "public"."media_assets" from "service_role";

revoke delete on table "public"."profiles" from "anon";

revoke insert on table "public"."profiles" from "anon";

revoke references on table "public"."profiles" from "anon";

revoke select on table "public"."profiles" from "anon";

revoke trigger on table "public"."profiles" from "anon";

revoke truncate on table "public"."profiles" from "anon";

revoke update on table "public"."profiles" from "anon";

revoke delete on table "public"."profiles" from "authenticated";

revoke insert on table "public"."profiles" from "authenticated";

revoke references on table "public"."profiles" from "authenticated";

revoke select on table "public"."profiles" from "authenticated";

revoke trigger on table "public"."profiles" from "authenticated";

revoke truncate on table "public"."profiles" from "authenticated";

revoke update on table "public"."profiles" from "authenticated";

alter table "public"."media_assets" drop constraint "media_assets_user_id_fkey";

alter table "public"."profiles" drop constraint "profiles_role_check";

alter table "public"."media_assets" drop constraint "media_assets_pkey";

drop index if exists "public"."idx_media_assets_bucket";

drop index if exists "public"."idx_media_assets_linked";

drop index if exists "public"."idx_media_assets_path";

drop index if exists "public"."idx_media_assets_tags";

drop index if exists "public"."idx_media_assets_user";

drop index if exists "public"."media_assets_pkey";

drop table "public"."media_assets";


  create table "n8n"."annotation_tag_entity" (
    "id" character varying(16) not null,
    "name" character varying(24) not null,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "n8n"."apikey" (
    "id" uuid not null default public.uuid_generate_v4(),
    "apiKey" character varying not null,
    "apiSecret" character varying not null,
    "keyName" character varying not null,
    "updatedDate" timestamp without time zone not null default now(),
    "workspaceId" uuid
      );



  create table "n8n"."assistant" (
    "id" uuid not null default public.uuid_generate_v4(),
    "credential" uuid not null,
    "details" text not null,
    "iconSrc" character varying,
    "createdDate" timestamp without time zone not null default now(),
    "updatedDate" timestamp without time zone not null default now(),
    "workspaceId" uuid,
    "type" text
      );



  create table "n8n"."auth_identity" (
    "userId" uuid,
    "providerId" character varying(64) not null,
    "providerType" character varying(32) not null,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "n8n"."auth_provider_sync_history" (
    "id" integer not null default nextval('n8n.auth_provider_sync_history_id_seq'::regclass),
    "providerType" character varying(32) not null,
    "runMode" text not null,
    "status" text not null,
    "startedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP,
    "endedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP,
    "scanned" integer not null,
    "created" integer not null,
    "updated" integer not null,
    "disabled" integer not null,
    "error" text
      );



  create table "n8n"."binary_data" (
    "fileId" uuid not null,
    "sourceType" character varying(50) not null,
    "sourceId" character varying(255) not null,
    "data" bytea not null,
    "mimeType" character varying(255),
    "fileName" character varying(255),
    "fileSize" integer not null,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "n8n"."chat_flow" (
    "id" uuid not null default public.uuid_generate_v4(),
    "name" character varying not null,
    "flowData" text not null,
    "deployed" boolean,
    "isPublic" boolean,
    "apikeyid" character varying,
    "chatbotConfig" text,
    "createdDate" timestamp without time zone not null default now(),
    "updatedDate" timestamp without time zone not null default now(),
    "apiConfig" text,
    "analytic" text,
    "category" text,
    "speechToText" text,
    "type" text,
    "workspaceId" uuid,
    "followUpPrompts" text
      );



  create table "n8n"."chat_hub_agents" (
    "id" uuid not null,
    "name" character varying(256) not null,
    "description" character varying(512),
    "systemPrompt" text not null,
    "ownerId" uuid not null,
    "credentialId" character varying(36),
    "provider" character varying(16) not null,
    "model" character varying(64) not null,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "tools" json not null default '[]'::json
      );



  create table "n8n"."chat_hub_messages" (
    "id" uuid not null,
    "sessionId" uuid not null,
    "previousMessageId" uuid,
    "revisionOfMessageId" uuid,
    "retryOfMessageId" uuid,
    "type" character varying(16) not null,
    "name" character varying(128) not null,
    "content" text not null,
    "provider" character varying(16),
    "model" character varying(64),
    "workflowId" character varying(36),
    "executionId" integer,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "status" character varying(16) not null default 'success'::character varying,
    "agentId" character varying(36),
    "attachments" json
      );



  create table "n8n"."chat_hub_sessions" (
    "id" uuid not null,
    "title" character varying(256) not null,
    "ownerId" uuid not null,
    "lastMessageAt" timestamp(3) with time zone,
    "credentialId" character varying(36),
    "provider" character varying(16),
    "model" character varying(64),
    "workflowId" character varying(36),
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "agentId" character varying(36),
    "agentName" character varying(128),
    "tools" json not null default '[]'::json
      );



  create table "n8n"."chat_message" (
    "id" uuid not null default public.uuid_generate_v4(),
    "role" character varying not null,
    "chatflowid" uuid not null,
    "content" text not null,
    "sourceDocuments" text,
    "createdDate" timestamp without time zone not null default now(),
    "chatType" character varying not null default 'INTERNAL'::character varying,
    "chatId" character varying not null,
    "memoryType" character varying,
    "sessionId" character varying,
    "usedTools" text,
    "fileAnnotations" text,
    "fileUploads" text,
    "leadEmail" text,
    "agentReasoning" text,
    "action" text,
    "artifacts" text,
    "followUpPrompts" text
      );



  create table "n8n"."chat_message_feedback" (
    "id" uuid not null default public.uuid_generate_v4(),
    "chatflowid" uuid not null,
    "content" text,
    "chatId" character varying not null,
    "messageId" uuid not null,
    "rating" character varying not null,
    "createdDate" timestamp without time zone not null default now()
      );



  create table "n8n"."credential" (
    "id" uuid not null default public.uuid_generate_v4(),
    "name" character varying not null,
    "credentialName" character varying not null,
    "encryptedData" text not null,
    "createdDate" timestamp without time zone not null default now(),
    "updatedDate" timestamp without time zone not null default now(),
    "workspaceId" uuid
      );



  create table "n8n"."credentials_entity" (
    "name" character varying(128) not null,
    "data" text not null,
    "type" character varying(128) not null,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "id" character varying(36) not null,
    "isManaged" boolean not null default false,
    "isGlobal" boolean not null default false
      );



  create table "n8n"."custom_template" (
    "id" uuid not null default public.uuid_generate_v4(),
    "name" character varying not null,
    "flowData" text not null,
    "description" character varying,
    "badge" character varying,
    "framework" character varying,
    "usecases" character varying,
    "type" character varying,
    "createdDate" timestamp without time zone not null default now(),
    "updatedDate" timestamp without time zone not null default now(),
    "workspaceId" uuid
      );



  create table "n8n"."data_table" (
    "id" character varying(36) not null,
    "name" character varying(128) not null,
    "projectId" character varying(36) not null,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "n8n"."data_table_column" (
    "id" character varying(36) not null,
    "name" character varying(128) not null,
    "type" character varying(32) not null,
    "index" integer not null,
    "dataTableId" character varying(36) not null,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "n8n"."dataset" (
    "id" uuid not null default public.uuid_generate_v4(),
    "name" character varying not null,
    "description" character varying,
    "createdDate" timestamp without time zone not null default now(),
    "updatedDate" timestamp without time zone not null default now(),
    "workspaceId" uuid
      );



  create table "n8n"."dataset_row" (
    "id" uuid not null default public.uuid_generate_v4(),
    "datasetId" character varying not null,
    "input" text not null,
    "output" text,
    "updatedDate" timestamp without time zone not null default now(),
    "sequence_no" integer default '-1'::integer
      );



  create table "n8n"."document_store" (
    "id" uuid not null default public.uuid_generate_v4(),
    "name" character varying not null,
    "description" character varying,
    "loaders" text,
    "whereUsed" text,
    "status" character varying not null,
    "createdDate" timestamp without time zone not null default now(),
    "updatedDate" timestamp without time zone not null default now(),
    "vectorStoreConfig" text,
    "embeddingConfig" text,
    "recordManagerConfig" text,
    "workspaceId" uuid
      );



  create table "n8n"."document_store_file_chunk" (
    "id" uuid not null default public.uuid_generate_v4(),
    "docId" uuid not null,
    "chunkNo" integer not null,
    "storeId" uuid not null,
    "pageContent" text,
    "metadata" text
      );



  create table "n8n"."evaluation" (
    "id" uuid not null default public.uuid_generate_v4(),
    "name" character varying not null,
    "chatflowId" text not null,
    "chatflowName" text not null,
    "datasetId" character varying not null,
    "datasetName" character varying not null,
    "additionalConfig" text,
    "evaluationType" character varying not null,
    "status" character varying not null,
    "average_metrics" text,
    "runDate" timestamp without time zone not null default now(),
    "workspaceId" uuid
      );



  create table "n8n"."evaluation_run" (
    "id" uuid not null default public.uuid_generate_v4(),
    "evaluationId" character varying not null,
    "input" text not null,
    "expectedOutput" text,
    "actualOutput" text,
    "evaluators" text,
    "llmEvaluators" text,
    "metrics" text,
    "runDate" timestamp without time zone not null default now()
      );



  create table "n8n"."evaluator" (
    "id" uuid not null default public.uuid_generate_v4(),
    "name" character varying not null,
    "type" text,
    "config" text,
    "createdDate" timestamp without time zone not null default now(),
    "updatedDate" timestamp without time zone not null default now(),
    "workspaceId" uuid
      );



  create table "n8n"."event_destinations" (
    "id" uuid not null,
    "destination" jsonb not null,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "n8n"."execution_annotation_tags" (
    "annotationId" integer not null,
    "tagId" character varying(24) not null
      );



  create table "n8n"."execution_annotations" (
    "id" integer not null default nextval('n8n.execution_annotations_id_seq'::regclass),
    "executionId" integer not null,
    "vote" character varying(6),
    "note" text,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "n8n"."execution_data" (
    "executionId" integer not null,
    "workflowData" json not null,
    "data" text not null
      );



  create table "n8n"."execution_entity" (
    "id" integer not null default nextval('n8n.execution_entity_id_seq'::regclass),
    "finished" boolean not null,
    "mode" character varying not null,
    "retryOf" character varying,
    "retrySuccessId" character varying,
    "startedAt" timestamp(3) with time zone,
    "stoppedAt" timestamp(3) with time zone,
    "waitTill" timestamp(3) with time zone,
    "status" character varying not null,
    "workflowId" character varying(36) not null,
    "deletedAt" timestamp(3) with time zone,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "n8n"."execution_metadata" (
    "id" integer not null default nextval('n8n.execution_metadata_temp_id_seq'::regclass),
    "executionId" integer not null,
    "key" character varying(255) not null,
    "value" text not null
      );



  create table "n8n"."folder" (
    "id" character varying(36) not null,
    "name" character varying(128) not null,
    "parentFolderId" character varying(36),
    "projectId" character varying(36) not null,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "n8n"."folder_tag" (
    "folderId" character varying(36) not null,
    "tagId" character varying(36) not null
      );



  create table "n8n"."insights_by_period" (
    "id" integer generated by default as identity not null,
    "metaId" integer not null,
    "type" integer not null,
    "value" bigint not null,
    "periodUnit" integer not null,
    "periodStart" timestamp(0) with time zone default CURRENT_TIMESTAMP
      );



  create table "n8n"."insights_metadata" (
    "metaId" integer generated by default as identity not null,
    "workflowId" character varying(16),
    "projectId" character varying(36),
    "workflowName" character varying(128) not null,
    "projectName" character varying(255) not null
      );



  create table "n8n"."insights_raw" (
    "id" integer generated by default as identity not null,
    "metaId" integer not null,
    "type" integer not null,
    "value" bigint not null,
    "timestamp" timestamp(0) with time zone not null default CURRENT_TIMESTAMP
      );



  create table "n8n"."installed_nodes" (
    "name" character varying(200) not null,
    "type" character varying(200) not null,
    "latestVersion" integer not null default 1,
    "package" character varying(241) not null
      );



  create table "n8n"."installed_packages" (
    "packageName" character varying(214) not null,
    "installedVersion" character varying(50) not null,
    "authorName" character varying(70),
    "authorEmail" character varying(70),
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "n8n"."invalid_auth_token" (
    "token" character varying(512) not null,
    "expiresAt" timestamp(3) with time zone not null
      );



  create table "n8n"."lead" (
    "id" uuid not null default public.uuid_generate_v4(),
    "chatflowid" character varying not null,
    "chatId" character varying not null,
    "name" text,
    "email" text,
    "phone" text,
    "createdDate" timestamp without time zone not null default now()
      );



  create table "n8n"."login_activity" (
    "id" uuid not null default public.uuid_generate_v4(),
    "username" character varying not null,
    "activity_code" integer not null,
    "message" character varying not null,
    "attemptedDateTime" timestamp without time zone not null default now(),
    "login_mode" character varying
      );



  create table "n8n"."migrations" (
    "id" integer not null default nextval('n8n.migrations_id_seq'::regclass),
    "timestamp" bigint not null,
    "name" character varying not null
      );



  create table "n8n"."n8n_credentials_entity" (
    "id" integer not null default nextval('n8n.n8n_credentials_entity_id_seq'::regclass),
    "name" character varying(128) not null,
    "data" text not null,
    "type" character varying(32) not null,
    "nodesAccess" json not null,
    "createdAt" timestamp(3) without time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) without time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "n8n"."n8n_execution_entity" (
    "id" integer not null default nextval('n8n.n8n_execution_entity_id_seq'::regclass),
    "data" text not null,
    "finished" boolean not null,
    "mode" character varying not null,
    "retryOf" character varying,
    "retrySuccessId" character varying,
    "startedAt" timestamp without time zone not null,
    "stoppedAt" timestamp without time zone,
    "workflowData" json not null,
    "workflowId" character varying
      );



  create table "n8n"."n8n_migrations" (
    "id" integer not null default nextval('n8n.n8n_migrations_id_seq'::regclass),
    "timestamp" bigint not null,
    "name" character varying not null
      );



  create table "n8n"."n8n_tag_entity" (
    "id" integer not null default nextval('n8n.n8n_tag_entity_id_seq'::regclass),
    "name" character varying(24) not null,
    "createdAt" timestamp(3) without time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) without time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "n8n"."n8n_webhook_entity" (
    "workflowId" integer not null,
    "webhookPath" character varying not null,
    "method" character varying not null,
    "node" character varying not null,
    "webhookId" character varying,
    "pathLength" integer
      );



  create table "n8n"."n8n_workflow_entity" (
    "id" integer not null default nextval('n8n.n8n_workflow_entity_id_seq'::regclass),
    "name" character varying(128) not null,
    "active" boolean not null,
    "nodes" json not null,
    "connections" json not null,
    "createdAt" timestamp(3) without time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) without time zone not null default CURRENT_TIMESTAMP(3),
    "settings" json,
    "staticData" json
      );



  create table "n8n"."n8n_workflows_tags" (
    "workflowId" integer not null,
    "tagId" integer not null
      );



  create table "n8n"."oauth_access_tokens" (
    "token" character varying not null,
    "clientId" character varying not null,
    "userId" uuid not null
      );



  create table "n8n"."oauth_authorization_codes" (
    "code" character varying(255) not null,
    "clientId" character varying not null,
    "userId" uuid not null,
    "redirectUri" character varying not null,
    "codeChallenge" character varying not null,
    "codeChallengeMethod" character varying(255) not null,
    "expiresAt" bigint not null,
    "state" character varying,
    "used" boolean not null default false,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "n8n"."oauth_clients" (
    "id" character varying not null,
    "name" character varying(255) not null,
    "redirectUris" json not null,
    "grantTypes" json not null,
    "clientSecret" character varying(255),
    "clientSecretExpiresAt" bigint,
    "tokenEndpointAuthMethod" character varying(255) not null default 'none'::character varying,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "n8n"."oauth_refresh_tokens" (
    "token" character varying(255) not null,
    "clientId" character varying not null,
    "userId" uuid not null,
    "expiresAt" bigint not null,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "n8n"."oauth_user_consents" (
    "id" integer generated by default as identity not null,
    "userId" uuid not null,
    "clientId" character varying not null,
    "grantedAt" bigint not null
      );



  create table "n8n"."organization" (
    "id" uuid not null default public.uuid_generate_v4(),
    "name" character varying not null,
    "adminUserId" character varying,
    "defaultWsId" character varying,
    "organization_type" character varying,
    "createdDate" timestamp without time zone not null default now(),
    "updatedDate" timestamp without time zone not null default now(),
    "sso_config" text
      );



  create table "n8n"."processed_data" (
    "workflowId" character varying(36) not null,
    "context" character varying(255) not null,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "value" text not null
      );



  create table "n8n"."project" (
    "id" character varying(36) not null,
    "name" character varying(255) not null,
    "type" character varying(36) not null,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "icon" json,
    "description" character varying(512)
      );



  create table "n8n"."project_relation" (
    "projectId" character varying(36) not null,
    "userId" uuid not null,
    "role" character varying not null,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "n8n"."role" (
    "slug" character varying(128) not null,
    "displayName" text,
    "description" text,
    "roleType" text,
    "systemRole" boolean not null default false,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "n8n"."role_scope" (
    "roleSlug" character varying(128) not null,
    "scopeSlug" character varying(128) not null
      );



  create table "n8n"."roles" (
    "id" uuid not null default public.uuid_generate_v4(),
    "name" character varying,
    "description" character varying,
    "permissions" text
      );



  create table "n8n"."scope" (
    "slug" character varying(128) not null,
    "displayName" text,
    "description" text
      );



  create table "n8n"."settings" (
    "key" character varying(255) not null,
    "value" text not null,
    "loadOnStartup" boolean not null default false
      );



  create table "n8n"."shared_credentials" (
    "credentialsId" character varying(36) not null,
    "projectId" character varying(36) not null,
    "role" text not null,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "n8n"."shared_workflow" (
    "workflowId" character varying(36) not null,
    "projectId" character varying(36) not null,
    "role" text not null,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "n8n"."tag_entity" (
    "name" character varying(24) not null,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "id" character varying(36) not null
      );



  create table "n8n"."test_case_execution" (
    "id" character varying(36) not null,
    "testRunId" character varying(36) not null,
    "executionId" integer,
    "status" character varying not null,
    "runAt" timestamp(3) with time zone,
    "completedAt" timestamp(3) with time zone,
    "errorCode" character varying,
    "errorDetails" json,
    "metrics" json,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "inputs" json,
    "outputs" json
      );



  create table "n8n"."test_run" (
    "id" character varying(36) not null,
    "workflowId" character varying(36) not null,
    "status" character varying not null,
    "errorCode" character varying,
    "errorDetails" json,
    "runAt" timestamp(3) with time zone,
    "completedAt" timestamp(3) with time zone,
    "metrics" json,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "n8n"."tool" (
    "id" uuid not null default public.uuid_generate_v4(),
    "name" character varying not null,
    "description" text not null,
    "color" character varying not null,
    "iconSrc" character varying,
    "schema" text,
    "func" text,
    "createdDate" timestamp without time zone not null default now(),
    "updatedDate" timestamp without time zone not null default now(),
    "workspaceId" uuid
      );



  create table "n8n"."upsert_history" (
    "id" uuid not null default public.uuid_generate_v4(),
    "chatflowid" character varying not null,
    "result" text not null,
    "flowData" text not null,
    "date" timestamp without time zone not null default now()
      );



  create table "n8n"."user" (
    "id" uuid not null default gen_random_uuid(),
    "email" character varying(255),
    "firstName" character varying(32),
    "lastName" character varying(32),
    "password" character varying(255),
    "personalizationAnswers" json,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "settings" json,
    "disabled" boolean not null default false,
    "mfaEnabled" boolean not null default false,
    "mfaSecret" text,
    "mfaRecoveryCodes" text,
    "lastActiveAt" date,
    "roleSlug" character varying(128) not null default 'global:member'::character varying,
    "activeWorkspaceId" uuid,
    "user_type" character varying
      );



  create table "n8n"."user_api_keys" (
    "id" character varying(36) not null,
    "userId" uuid not null,
    "label" character varying(100) not null,
    "apiKey" character varying not null,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "scopes" json,
    "audience" character varying not null default 'public-api'::character varying
      );



  create table "n8n"."variable" (
    "id" uuid not null default public.uuid_generate_v4(),
    "name" character varying not null,
    "value" text not null,
    "type" text,
    "createdDate" timestamp without time zone not null default now(),
    "updatedDate" timestamp without time zone not null default now(),
    "workspaceId" uuid
      );



  create table "n8n"."variables" (
    "key" character varying(50) not null,
    "type" character varying(50) not null default 'string'::character varying,
    "value" character varying(255),
    "id" character varying(36) not null,
    "projectId" character varying(36)
      );



  create table "n8n"."webhook_entity" (
    "webhookPath" character varying not null,
    "method" character varying not null,
    "node" character varying not null,
    "webhookId" character varying,
    "pathLength" integer,
    "workflowId" character varying(36) not null
      );



  create table "n8n"."workflow_dependency" (
    "id" integer generated by default as identity not null,
    "workflowId" character varying(36) not null,
    "workflowVersionId" integer not null,
    "dependencyType" character varying(32) not null,
    "dependencyKey" character varying(255) not null,
    "dependencyInfo" json,
    "indexVersionId" smallint not null default 1,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "n8n"."workflow_entity" (
    "name" character varying(128) not null,
    "active" boolean not null,
    "nodes" json not null,
    "connections" json not null,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "settings" json,
    "staticData" json,
    "pinData" json,
    "versionId" character(36) not null,
    "triggerCount" integer not null default 0,
    "id" character varying(36) not null,
    "meta" json,
    "parentFolderId" character varying(36) default NULL::character varying,
    "isArchived" boolean not null default false,
    "versionCounter" integer not null default 1,
    "description" text,
    "activeVersionId" character varying(36)
      );



  create table "n8n"."workflow_history" (
    "versionId" character varying(36) not null,
    "workflowId" character varying(36) not null,
    "authors" character varying(255) not null,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "nodes" json not null,
    "connections" json not null,
    "name" character varying(128),
    "autosaved" boolean not null default false,
    "description" text
      );



  create table "n8n"."workflow_publish_history" (
    "id" integer generated by default as identity not null,
    "workflowId" character varying(36) not null,
    "versionId" character varying(36) not null,
    "event" character varying(36) not null,
    "userId" uuid,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "n8n"."workflow_statistics" (
    "count" integer default 0,
    "latestEvent" timestamp(3) with time zone,
    "name" character varying(128) not null,
    "workflowId" character varying(36) not null,
    "rootCount" integer default 0
      );



  create table "n8n"."workflows_tags" (
    "workflowId" character varying(36) not null,
    "tagId" character varying(36) not null
      );



  create table "n8n"."workspace" (
    "id" uuid not null default public.uuid_generate_v4(),
    "name" character varying not null,
    "description" character varying,
    "createdDate" timestamp without time zone not null default now(),
    "updatedDate" timestamp without time zone not null default now(),
    "organizationId" uuid
      );



  create table "n8n"."workspace_shared" (
    "id" uuid not null default public.uuid_generate_v4(),
    "workspaceId" uuid not null,
    "sharedItemId" character varying not null,
    "itemType" character varying not null,
    "createdDate" timestamp without time zone not null default now(),
    "updatedDate" timestamp without time zone not null default now()
      );



  create table "n8n"."workspace_users" (
    "id" uuid not null default public.uuid_generate_v4(),
    "workspaceId" uuid not null,
    "userId" character varying not null,
    "role" character varying
      );



  create table "public"."ai_agents" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text,
    "avatar_url" text,
    "system_prompt" text not null,
    "capabilities" jsonb default '[]'::jsonb,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."ai_agents" enable row level security;


  create table "public"."albums" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "cover_url" text,
    "navidrome_cover_art_id" text,
    "primary_artist_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."albums" enable row level security;


  create table "public"."analytics" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "event_type" text not null,
    "event_data" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."analytics" enable row level security;


  create table "public"."annotation_tag_entity" (
    "id" character varying(16) not null,
    "name" character varying(24) not null,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "public"."apikey" (
    "id" uuid not null default public.uuid_generate_v4(),
    "apiKey" character varying not null,
    "apiSecret" character varying not null,
    "keyName" character varying not null,
    "updatedDate" timestamp without time zone not null default now()
      );



  create table "public"."artists" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "image_url" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."artists" enable row level security;


  create table "public"."assistant" (
    "id" uuid not null default public.uuid_generate_v4(),
    "credential" uuid not null,
    "details" text not null,
    "iconSrc" character varying,
    "createdDate" timestamp without time zone not null default now(),
    "updatedDate" timestamp without time zone not null default now(),
    "type" text
      );



  create table "public"."auth_identity" (
    "userId" uuid,
    "providerId" character varying(64) not null,
    "providerType" character varying(32) not null,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "public"."auth_provider_sync_history" (
    "id" integer not null default nextval('public.auth_provider_sync_history_id_seq'::regclass),
    "providerType" character varying(32) not null,
    "runMode" text not null,
    "status" text not null,
    "startedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP,
    "endedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP,
    "scanned" integer not null,
    "created" integer not null,
    "updated" integer not null,
    "disabled" integer not null,
    "error" text
      );



  create table "public"."binary_data" (
    "fileId" uuid not null,
    "sourceType" character varying(50) not null,
    "sourceId" character varying(255) not null,
    "data" bytea not null,
    "mimeType" character varying(255),
    "fileName" character varying(255),
    "fileSize" integer not null,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "public"."chat_flow" (
    "id" uuid not null default public.uuid_generate_v4(),
    "name" character varying not null,
    "flowData" text not null,
    "deployed" boolean,
    "isPublic" boolean,
    "apikeyid" character varying,
    "chatbotConfig" text,
    "createdDate" timestamp without time zone not null default now(),
    "updatedDate" timestamp without time zone not null default now(),
    "apiConfig" text,
    "analytic" text,
    "category" text,
    "speechToText" text,
    "type" text,
    "followUpPrompts" text
      );



  create table "public"."chat_hub_agents" (
    "id" uuid not null,
    "name" character varying(256) not null,
    "description" character varying(512),
    "systemPrompt" text not null,
    "ownerId" uuid not null,
    "credentialId" character varying(36),
    "provider" character varying(16) not null,
    "model" character varying(64) not null,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "tools" json not null default '[]'::json,
    "icon" json
      );



  create table "public"."chat_hub_messages" (
    "id" uuid not null,
    "sessionId" uuid not null,
    "previousMessageId" uuid,
    "revisionOfMessageId" uuid,
    "retryOfMessageId" uuid,
    "type" character varying(16) not null,
    "name" character varying(128) not null,
    "content" text not null,
    "provider" character varying(16),
    "model" character varying(256),
    "workflowId" character varying(36),
    "executionId" integer,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "agentId" uuid,
    "status" character varying(16) not null default 'success'::character varying,
    "attachments" json
      );



  create table "public"."chat_hub_sessions" (
    "id" uuid not null,
    "title" character varying(256) not null,
    "ownerId" uuid not null,
    "lastMessageAt" timestamp(3) with time zone not null,
    "credentialId" character varying(36),
    "provider" character varying(16),
    "model" character varying(256),
    "workflowId" character varying(36),
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "agentId" uuid,
    "agentName" character varying(128),
    "tools" json not null default '[]'::json
      );



  create table "public"."chat_message" (
    "id" uuid not null default public.uuid_generate_v4(),
    "role" character varying not null,
    "chatflowid" uuid not null,
    "content" text not null,
    "sourceDocuments" text,
    "createdDate" timestamp without time zone not null default now(),
    "chatType" character varying not null default 'INTERNAL'::character varying,
    "chatId" character varying not null,
    "memoryType" character varying,
    "sessionId" character varying,
    "usedTools" text,
    "fileAnnotations" text,
    "fileUploads" text,
    "leadEmail" text,
    "agentReasoning" text,
    "action" text,
    "artifacts" text,
    "followUpPrompts" text
      );



  create table "public"."chat_message_feedback" (
    "id" uuid not null default public.uuid_generate_v4(),
    "chatflowid" uuid not null,
    "content" text,
    "chatId" character varying not null,
    "messageId" uuid not null,
    "rating" character varying not null,
    "createdDate" timestamp without time zone not null default now()
      );



  create table "public"."conversations" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "agent_id" uuid not null,
    "title" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "is_pinned" boolean default false,
    "metadata" jsonb default '{}'::jsonb
      );


alter table "public"."conversations" enable row level security;


  create table "public"."credential" (
    "id" uuid not null default public.uuid_generate_v4(),
    "name" character varying not null,
    "credentialName" character varying not null,
    "encryptedData" text not null,
    "createdDate" timestamp without time zone not null default now(),
    "updatedDate" timestamp without time zone not null default now()
      );



  create table "public"."credentials_entity" (
    "name" character varying(128) not null,
    "data" text not null,
    "type" character varying(128) not null,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "id" character varying(36) not null,
    "isManaged" boolean not null default false,
    "isGlobal" boolean not null default false,
    "isResolvable" boolean not null default false,
    "resolvableAllowFallback" boolean not null default false,
    "resolverId" character varying(16)
      );



  create table "public"."custom_template" (
    "id" uuid not null default public.uuid_generate_v4(),
    "name" character varying not null,
    "flowData" text not null,
    "description" character varying,
    "badge" character varying,
    "framework" character varying,
    "usecases" character varying,
    "type" character varying,
    "createdDate" timestamp without time zone not null default now(),
    "updatedDate" timestamp without time zone not null default now()
      );



  create table "public"."customers" (
    "id" uuid not null,
    "stripe_customer_id" text
      );


alter table "public"."customers" enable row level security;


  create table "public"."data_table" (
    "id" character varying(36) not null,
    "name" character varying(128) not null,
    "projectId" character varying(36) not null,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "public"."data_table_column" (
    "id" character varying(36) not null,
    "name" character varying(128) not null,
    "type" character varying(32) not null,
    "index" integer not null,
    "dataTableId" character varying(36) not null,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "public"."document_store" (
    "id" uuid not null default public.uuid_generate_v4(),
    "name" character varying not null,
    "description" character varying,
    "loaders" text,
    "whereUsed" text,
    "status" character varying not null,
    "createdDate" timestamp without time zone not null default now(),
    "updatedDate" timestamp without time zone not null default now(),
    "vectorStoreConfig" text,
    "embeddingConfig" text,
    "recordManagerConfig" text
      );



  create table "public"."document_store_file_chunk" (
    "id" uuid not null default public.uuid_generate_v4(),
    "docId" uuid not null,
    "chunkNo" integer not null,
    "storeId" uuid not null,
    "pageContent" text,
    "metadata" text
      );



  create table "public"."documents" (
    "id" text not null,
    "title" text,
    "content" text not null,
    "metadata" jsonb default '{}'::jsonb,
    "embedding" extensions.vector(1536),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "source" text,
    "is_public" boolean default true
      );


alter table "public"."documents" enable row level security;


  create table "public"."dynamic_credential_entry" (
    "credential_id" character varying(16) not null,
    "subject_id" character varying(16) not null,
    "resolver_id" character varying(16) not null,
    "data" text not null,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "public"."dynamic_credential_resolver" (
    "id" character varying(16) not null,
    "name" character varying(128) not null,
    "type" character varying(128) not null,
    "config" text not null,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "public"."event_destinations" (
    "id" uuid not null,
    "destination" jsonb not null,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "public"."execution_annotation_tags" (
    "annotationId" integer not null,
    "tagId" character varying(24) not null
      );



  create table "public"."execution_annotations" (
    "id" integer not null default nextval('public.execution_annotations_id_seq'::regclass),
    "executionId" integer not null,
    "vote" character varying(6),
    "note" text,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "public"."execution_data" (
    "executionId" integer not null,
    "workflowData" json not null,
    "data" text not null,
    "workflowVersionId" character varying(36)
      );



  create table "public"."execution_entity" (
    "id" integer not null default nextval('public.execution_entity_id_seq'::regclass),
    "finished" boolean not null,
    "mode" character varying not null,
    "retryOf" character varying,
    "retrySuccessId" character varying,
    "startedAt" timestamp(3) with time zone,
    "stoppedAt" timestamp(3) with time zone,
    "waitTill" timestamp(3) with time zone,
    "status" character varying not null,
    "workflowId" character varying(36) not null,
    "deletedAt" timestamp(3) with time zone,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "storedAt" character varying(2) not null default 'db'::character varying
      );



  create table "public"."execution_metadata" (
    "id" integer not null default nextval('public.execution_metadata_temp_id_seq'::regclass),
    "executionId" integer not null,
    "key" character varying(255) not null,
    "value" text not null
      );



  create table "public"."folder" (
    "id" character varying(36) not null,
    "name" character varying(128) not null,
    "parentFolderId" character varying(36),
    "projectId" character varying(36) not null,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "public"."folder_tag" (
    "folderId" character varying(36) not null,
    "tagId" character varying(36) not null
      );



  create table "public"."fragrance_blends" (
    "id" uuid not null default public.uuid_generate_v4(),
    "fragrance_oil_id" uuid not null,
    "blends_with_name" text not null,
    "blends_with_url" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."fragrance_blends" enable row level security;


  create table "public"."fragrance_oils" (
    "id" uuid not null default public.uuid_generate_v4(),
    "url" text not null,
    "name" text not null,
    "category" text[],
    "rating" numeric(3,2),
    "review_count" integer default 0,
    "description" text,
    "natural_essential_oils" text[],
    "alternative_branding" text[],
    "suggested_colors" text[],
    "top_notes" text[],
    "middle_notes" text[],
    "base_notes" text[],
    "soy_performance" text,
    "flashpoint" text,
    "vanillin_content" text,
    "phthalate_free" boolean,
    "prop_65_warning" boolean,
    "pricing_variants" jsonb,
    "recommended_applications" jsonb,
    "cold_process_soap_performance" jsonb,
    "safety_data_sheet_url" text,
    "ifra_certificate_url" text,
    "allergen_statement_url" text,
    "related_projects" jsonb,
    "usage_tips" text,
    "review_count_scraped" integer default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."fragrance_oils" enable row level security;


  create table "public"."fragrance_reviews" (
    "id" uuid not null default public.uuid_generate_v4(),
    "fragrance_oil_id" uuid not null,
    "rating" integer not null,
    "reviewer_name" text,
    "review_date" date,
    "review_text" text,
    "helpful_count" integer default 0,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."fragrance_reviews" enable row level security;


  create table "public"."insights_by_period" (
    "id" integer generated by default as identity not null,
    "metaId" integer not null,
    "type" integer not null,
    "value" bigint not null,
    "periodUnit" integer not null,
    "periodStart" timestamp(0) with time zone default CURRENT_TIMESTAMP
      );



  create table "public"."insights_metadata" (
    "metaId" integer generated by default as identity not null,
    "workflowId" character varying(36),
    "projectId" character varying(36),
    "workflowName" character varying(128) not null,
    "projectName" character varying(255) not null
      );



  create table "public"."insights_raw" (
    "id" integer generated by default as identity not null,
    "metaId" integer not null,
    "type" integer not null,
    "value" bigint not null,
    "timestamp" timestamp(0) with time zone not null default CURRENT_TIMESTAMP
      );



  create table "public"."installed_nodes" (
    "name" character varying(200) not null,
    "type" character varying(200) not null,
    "latestVersion" integer not null default 1,
    "package" character varying(241) not null
      );



  create table "public"."installed_packages" (
    "packageName" character varying(214) not null,
    "installedVersion" character varying(50) not null,
    "authorName" character varying(70),
    "authorEmail" character varying(70),
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "public"."invalid_auth_token" (
    "token" character varying(512) not null,
    "expiresAt" timestamp(3) with time zone not null
      );



  create table "public"."lead" (
    "id" uuid not null default public.uuid_generate_v4(),
    "chatflowid" character varying not null,
    "chatId" character varying not null,
    "name" text,
    "email" text,
    "phone" text,
    "createdDate" timestamp without time zone not null default now()
      );



  create table "public"."liked_navidrome_tracks" (
    "user_id" uuid not null,
    "navidrome_track_id" text not null,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."liked_navidrome_tracks" enable row level security;


  create table "public"."liked_songs" (
    "created_at" timestamp with time zone default now(),
    "song_id" bigint not null,
    "user_id" uuid not null
      );


alter table "public"."liked_songs" enable row level security;


  create table "public"."likes" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "playlist_id" uuid,
    "track_id" uuid,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."likes" enable row level security;


  create table "public"."listening_history" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "track_id" uuid not null,
    "played_at" timestamp with time zone not null default now()
      );


alter table "public"."listening_history" enable row level security;


  create table "public"."messages" (
    "id" uuid not null default gen_random_uuid(),
    "conversation_id" uuid not null,
    "sender_type" text not null,
    "sender_id" uuid not null,
    "content" text not null,
    "embedding" extensions.vector(1536),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "metadata" jsonb default '{}'::jsonb
      );


alter table "public"."messages" enable row level security;


  create table "public"."migrations" (
    "id" integer not null default nextval('public.migrations_id_seq'::regclass),
    "timestamp" bigint not null,
    "name" character varying not null
      );



  create table "public"."music_requests" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "type" text not null,
    "lidarr_id" text,
    "title" text not null,
    "artist_name" text,
    "status" text not null default 'requested'::text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."music_requests" enable row level security;


  create table "public"."notifications" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "title" text not null,
    "message" text not null,
    "type" text not null,
    "is_read" boolean default false,
    "created_at" timestamp with time zone default now(),
    "action_url" text,
    "metadata" jsonb default '{}'::jsonb
      );


alter table "public"."notifications" enable row level security;


  create table "public"."oauth_access_tokens" (
    "token" character varying not null,
    "clientId" character varying not null,
    "userId" uuid not null
      );



  create table "public"."oauth_authorization_codes" (
    "code" character varying(255) not null,
    "clientId" character varying not null,
    "userId" uuid not null,
    "redirectUri" character varying not null,
    "codeChallenge" character varying not null,
    "codeChallengeMethod" character varying(255) not null,
    "expiresAt" bigint not null,
    "state" character varying,
    "used" boolean not null default false,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "public"."oauth_clients" (
    "id" character varying not null,
    "name" character varying(255) not null,
    "redirectUris" json not null,
    "grantTypes" json not null,
    "clientSecret" character varying(255),
    "clientSecretExpiresAt" bigint,
    "tokenEndpointAuthMethod" character varying(255) not null default 'none'::character varying,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "public"."oauth_refresh_tokens" (
    "token" character varying(255) not null,
    "clientId" character varying not null,
    "userId" uuid not null,
    "expiresAt" bigint not null,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "public"."oauth_user_consents" (
    "id" integer generated by default as identity not null,
    "userId" uuid not null,
    "clientId" character varying not null,
    "grantedAt" bigint not null
      );



  create table "public"."ollama_documents" (
    "id" text not null,
    "title" text,
    "content" text not null,
    "metadata" jsonb default '{}'::jsonb,
    "embedding" extensions.vector(768),
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "source" text,
    "is_public" boolean default true
      );


alter table "public"."ollama_documents" enable row level security;


  create table "public"."pending_logins" (
    "id" uuid not null default gen_random_uuid(),
    "short_code" text not null,
    "status" text not null default 'pending'::text,
    "user_id" uuid,
    "access_token" text,
    "refresh_token" text,
    "created_at" timestamp with time zone not null default now(),
    "expires_at" timestamp with time zone not null,
    "consumed_at" timestamp with time zone
      );


alter table "public"."pending_logins" enable row level security;


  create table "public"."playlist_tracks" (
    "playlist_id" uuid not null,
    "track_id" uuid not null,
    "position" integer not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."playlist_tracks" enable row level security;


  create table "public"."playlists" (
    "id" uuid not null default gen_random_uuid(),
    "owner_id" uuid,
    "title" text not null,
    "color_accent" text,
    "color_dark" text,
    "cover_url" text,
    "artist_names" text[] default '{}'::text[],
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."playlists" enable row level security;


  create table "public"."prices" (
    "id" text not null,
    "active" boolean,
    "currency" text,
    "description" text,
    "interval" public.pricing_plan_interval,
    "interval_count" integer,
    "metadata" jsonb,
    "product_id" text,
    "trial_period_days" integer,
    "type" public.pricing_type,
    "unit_amount" bigint
      );


alter table "public"."prices" enable row level security;


  create table "public"."processed_data" (
    "workflowId" character varying(36) not null,
    "context" character varying(255) not null,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "value" text not null
      );



  create table "public"."products" (
    "id" text not null,
    "active" boolean,
    "description" text,
    "image" text,
    "metadata" jsonb,
    "name" text
      );


alter table "public"."products" enable row level security;


  create table "public"."project" (
    "id" character varying(36) not null,
    "name" character varying(255) not null,
    "type" character varying(36) not null,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "icon" json,
    "description" character varying(512),
    "creatorId" uuid
      );



  create table "public"."project_relation" (
    "projectId" character varying(36) not null,
    "userId" uuid not null,
    "role" character varying not null,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "public"."role" (
    "slug" character varying(128) not null,
    "displayName" text,
    "description" text,
    "roleType" text,
    "systemRole" boolean not null default false,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "public"."role_scope" (
    "roleSlug" character varying(128) not null,
    "scopeSlug" character varying(128) not null
      );



  create table "public"."scope" (
    "slug" character varying(128) not null,
    "displayName" text,
    "description" text
      );



  create table "public"."settings" (
    "key" character varying(255) not null,
    "value" text not null,
    "loadOnStartup" boolean not null default false
      );



  create table "public"."shared_credentials" (
    "credentialsId" character varying(36) not null,
    "projectId" character varying(36) not null,
    "role" text not null,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "public"."shared_workflow" (
    "workflowId" character varying(36) not null,
    "projectId" character varying(36) not null,
    "role" text not null,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "public"."songs" (
    "id" bigint generated always as identity not null,
    "author" text,
    "created_at" timestamp with time zone default now(),
    "image_path" text,
    "song_path" text,
    "title" text,
    "user_id" uuid
      );


alter table "public"."songs" enable row level security;


  create table "public"."spotify_recommendations" (
    "id" uuid not null default gen_random_uuid(),
    "fragrance_blend_id" uuid,
    "fragrance_oil_id" text,
    "spotify_track_id" text not null,
    "track_name" text not null,
    "track_artist" text not null,
    "track_preview_url" text,
    "track_external_url" text,
    "album_image_url" text,
    "album_name" text,
    "duration_ms" integer,
    "audio_features" jsonb,
    "recommendation_reason" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."spotify_recommendations" enable row level security;


  create table "public"."subscriptions" (
    "id" text not null,
    "cancel_at" timestamp with time zone,
    "cancel_at_period_end" boolean,
    "canceled_at" timestamp with time zone,
    "created" timestamp with time zone not null default now(),
    "current_period_end" timestamp with time zone not null,
    "current_period_start" timestamp with time zone not null,
    "ended_at" timestamp with time zone,
    "metadata" jsonb,
    "price_id" text,
    "quantity" integer,
    "status" public.subscription_status,
    "trial_end" timestamp with time zone,
    "trial_start" timestamp with time zone,
    "user_id" uuid not null
      );


alter table "public"."subscriptions" enable row level security;


  create table "public"."tag_entity" (
    "name" character varying(24) not null,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "id" character varying(36) not null
      );



  create table "public"."test_case_execution" (
    "id" character varying(36) not null,
    "testRunId" character varying(36) not null,
    "executionId" integer,
    "status" character varying not null,
    "runAt" timestamp(3) with time zone,
    "completedAt" timestamp(3) with time zone,
    "errorCode" character varying,
    "errorDetails" json,
    "metrics" json,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "inputs" json,
    "outputs" json
      );



  create table "public"."test_run" (
    "id" character varying(36) not null,
    "workflowId" character varying(36) not null,
    "status" character varying not null,
    "errorCode" character varying,
    "errorDetails" json,
    "runAt" timestamp(3) with time zone,
    "completedAt" timestamp(3) with time zone,
    "metrics" json,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "public"."tool" (
    "id" uuid not null default public.uuid_generate_v4(),
    "name" character varying not null,
    "description" text not null,
    "color" character varying not null,
    "iconSrc" character varying,
    "schema" text,
    "func" text,
    "createdDate" timestamp without time zone not null default now(),
    "updatedDate" timestamp without time zone not null default now()
      );



  create table "public"."track_artists" (
    "track_id" uuid not null,
    "artist_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."track_artists" enable row level security;


  create table "public"."tracks" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "image_url" text,
    "album" text,
    "duration_text" text,
    "artist_names" text[] default '{}'::text[],
    "created_at" timestamp with time zone not null default now(),
    "album_id" uuid,
    "navidrome_track_id" text,
    "navidrome_cover_art_id" text
      );


alter table "public"."tracks" enable row level security;


  create table "public"."upsert_history" (
    "id" uuid not null default public.uuid_generate_v4(),
    "chatflowid" character varying not null,
    "result" text not null,
    "flowData" text not null,
    "date" timestamp without time zone not null default now()
      );



  create table "public"."user" (
    "id" uuid not null default gen_random_uuid(),
    "email" character varying(255),
    "firstName" character varying(32),
    "lastName" character varying(32),
    "password" character varying(255),
    "personalizationAnswers" json,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "settings" json,
    "disabled" boolean not null default false,
    "mfaEnabled" boolean not null default false,
    "mfaSecret" text,
    "mfaRecoveryCodes" text,
    "lastActiveAt" date,
    "roleSlug" character varying(128) not null default 'global:member'::character varying
      );



  create table "public"."user_api_keys" (
    "id" character varying(36) not null,
    "userId" uuid not null,
    "label" character varying(100) not null,
    "apiKey" character varying not null,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "scopes" json,
    "audience" character varying not null default 'public-api'::character varying
      );



  create table "public"."user_settings" (
    "user_id" uuid not null,
    "theme" text default 'light'::text,
    "notification_preferences" jsonb default '{"push": true, "email": true, "chat_updates": true}'::jsonb,
    "ai_preferences" jsonb default '{"auto_save": true, "preferred_agent": null, "conversation_history": true}'::jsonb,
    "privacy_settings" jsonb default '{"share_usage_data": true, "allow_recommendations": true}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."user_settings" enable row level security;


  create table "public"."user_spotify_tokens" (
    "user_id" uuid not null,
    "access_token" text not null,
    "refresh_token" text not null,
    "expires_at" timestamp with time zone,
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."user_spotify_tokens" enable row level security;


  create table "public"."users" (
    "id" uuid not null,
    "avatar_url" text,
    "billing_address" jsonb,
    "full_name" text,
    "payment_method" jsonb,
    "role" text not null default 'user'::text,
    "beta_until" timestamp with time zone
      );


alter table "public"."users" enable row level security;


  create table "public"."variable" (
    "id" uuid not null default public.uuid_generate_v4(),
    "name" character varying not null,
    "value" text not null,
    "type" text,
    "createdDate" timestamp without time zone not null default now(),
    "updatedDate" timestamp without time zone not null default now()
      );



  create table "public"."variables" (
    "key" character varying(50) not null,
    "type" character varying(50) not null default 'string'::character varying,
    "value" character varying(255),
    "id" character varying(36) not null,
    "projectId" character varying(36)
      );



  create table "public"."webhook_entity" (
    "webhookPath" character varying not null,
    "method" character varying not null,
    "node" character varying not null,
    "webhookId" character varying,
    "pathLength" integer,
    "workflowId" character varying(36) not null
      );



  create table "public"."workflow_dependency" (
    "id" integer generated by default as identity not null,
    "workflowId" character varying(36) not null,
    "workflowVersionId" integer not null,
    "dependencyType" character varying(32) not null,
    "dependencyKey" character varying(255) not null,
    "dependencyInfo" json,
    "indexVersionId" smallint not null default 1,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "public"."workflow_entity" (
    "name" character varying(128) not null,
    "active" boolean not null,
    "nodes" json not null,
    "connections" json not null,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "settings" json,
    "staticData" json,
    "pinData" json,
    "versionId" character(36) not null,
    "triggerCount" integer not null default 0,
    "id" character varying(36) not null,
    "meta" json,
    "parentFolderId" character varying(36) default NULL::character varying,
    "isArchived" boolean not null default false,
    "versionCounter" integer not null default 1,
    "description" text,
    "activeVersionId" character varying(36)
      );



  create table "public"."workflow_history" (
    "versionId" character varying(36) not null,
    "workflowId" character varying(36) not null,
    "authors" character varying(255) not null,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "updatedAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3),
    "nodes" json not null,
    "connections" json not null,
    "name" character varying(128),
    "autosaved" boolean not null default false,
    "description" text
      );



  create table "public"."workflow_publish_history" (
    "id" integer generated by default as identity not null,
    "workflowId" character varying(36) not null,
    "versionId" character varying(36) not null,
    "event" character varying(36) not null,
    "userId" uuid,
    "createdAt" timestamp(3) with time zone not null default CURRENT_TIMESTAMP(3)
      );



  create table "public"."workflow_statistics" (
    "count" bigint default 0,
    "latestEvent" timestamp(3) with time zone,
    "name" character varying(128) not null,
    "workflowId" character varying(36) not null,
    "rootCount" bigint default 0,
    "id" integer not null default nextval('public.workflow_statistics_id_seq'::regclass),
    "workflowName" character varying(128)
      );



  create table "public"."workflows_tags" (
    "workflowId" character varying(36) not null,
    "tagId" character varying(36) not null
      );



  create table "stripe"."_managed_webhooks" (
    "id" text not null,
    "object" text,
    "url" text not null,
    "enabled_events" jsonb not null,
    "description" text,
    "enabled" boolean,
    "livemode" boolean,
    "metadata" jsonb,
    "secret" text not null,
    "status" text,
    "api_version" text,
    "created" integer,
    "updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "last_synced_at" timestamp with time zone,
    "account_id" text not null
      );



  create table "stripe"."_migrations" (
    "id" integer not null,
    "name" character varying(100) not null,
    "hash" character varying(40) not null,
    "executed_at" timestamp without time zone default CURRENT_TIMESTAMP
      );



  create table "stripe"."_sync_obj_runs" (
    "_account_id" text not null,
    "run_started_at" timestamp with time zone not null,
    "object" text not null,
    "status" text not null default 'pending'::text,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "processed_count" integer default 0,
    "cursor" text,
    "error_message" text,
    "updated_at" timestamp with time zone not null default now()
      );



  create table "stripe"."_sync_runs" (
    "_account_id" text not null,
    "started_at" timestamp with time zone not null default now(),
    "max_concurrent" integer not null default 3,
    "error_message" text,
    "triggered_by" text,
    "updated_at" timestamp with time zone not null default now(),
    "closed_at" timestamp with time zone
      );



  create table "stripe"."accounts" (
    "_raw_data" jsonb not null,
    "first_synced_at" timestamp with time zone not null default now(),
    "_last_synced_at" timestamp with time zone not null default now(),
    "_updated_at" timestamp with time zone not null default now(),
    "business_name" text generated always as (((_raw_data -> 'business_profile'::text) ->> 'name'::text)) stored,
    "email" text generated always as ((_raw_data ->> 'email'::text)) stored,
    "type" text generated always as ((_raw_data ->> 'type'::text)) stored,
    "charges_enabled" boolean generated always as (((_raw_data ->> 'charges_enabled'::text))::boolean) stored,
    "payouts_enabled" boolean generated always as (((_raw_data ->> 'payouts_enabled'::text))::boolean) stored,
    "details_submitted" boolean generated always as (((_raw_data ->> 'details_submitted'::text))::boolean) stored,
    "country" text generated always as ((_raw_data ->> 'country'::text)) stored,
    "default_currency" text generated always as ((_raw_data ->> 'default_currency'::text)) stored,
    "created" integer generated always as (((_raw_data ->> 'created'::text))::integer) stored,
    "api_key_hashes" text[] default '{}'::text[],
    "id" text not null generated always as ((_raw_data ->> 'id'::text)) stored
      );



  create table "stripe"."active_entitlements" (
    "_updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "_last_synced_at" timestamp with time zone,
    "_raw_data" jsonb,
    "_account_id" text not null,
    "object" text generated always as ((_raw_data ->> 'object'::text)) stored,
    "livemode" boolean generated always as (((_raw_data ->> 'livemode'::text))::boolean) stored,
    "feature" text generated always as ((_raw_data ->> 'feature'::text)) stored,
    "customer" text generated always as ((_raw_data ->> 'customer'::text)) stored,
    "lookup_key" text generated always as ((_raw_data ->> 'lookup_key'::text)) stored,
    "id" text not null generated always as ((_raw_data ->> 'id'::text)) stored
      );



  create table "stripe"."charges" (
    "_updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "_last_synced_at" timestamp with time zone,
    "_raw_data" jsonb,
    "_account_id" text not null,
    "object" text generated always as ((_raw_data ->> 'object'::text)) stored,
    "paid" boolean generated always as (((_raw_data ->> 'paid'::text))::boolean) stored,
    "order" text generated always as ((_raw_data ->> 'order'::text)) stored,
    "amount" bigint generated always as (((_raw_data ->> 'amount'::text))::bigint) stored,
    "review" text generated always as ((_raw_data ->> 'review'::text)) stored,
    "source" jsonb generated always as ((_raw_data -> 'source'::text)) stored,
    "status" text generated always as ((_raw_data ->> 'status'::text)) stored,
    "created" integer generated always as (((_raw_data ->> 'created'::text))::integer) stored,
    "dispute" text generated always as ((_raw_data ->> 'dispute'::text)) stored,
    "invoice" text generated always as ((_raw_data ->> 'invoice'::text)) stored,
    "outcome" jsonb generated always as ((_raw_data -> 'outcome'::text)) stored,
    "refunds" jsonb generated always as ((_raw_data -> 'refunds'::text)) stored,
    "updated" integer generated always as (((_raw_data ->> 'updated'::text))::integer) stored,
    "captured" boolean generated always as (((_raw_data ->> 'captured'::text))::boolean) stored,
    "currency" text generated always as ((_raw_data ->> 'currency'::text)) stored,
    "customer" text generated always as ((_raw_data ->> 'customer'::text)) stored,
    "livemode" boolean generated always as (((_raw_data ->> 'livemode'::text))::boolean) stored,
    "metadata" jsonb generated always as ((_raw_data -> 'metadata'::text)) stored,
    "refunded" boolean generated always as (((_raw_data ->> 'refunded'::text))::boolean) stored,
    "shipping" jsonb generated always as ((_raw_data -> 'shipping'::text)) stored,
    "application" text generated always as ((_raw_data ->> 'application'::text)) stored,
    "description" text generated always as ((_raw_data ->> 'description'::text)) stored,
    "destination" text generated always as ((_raw_data ->> 'destination'::text)) stored,
    "failure_code" text generated always as ((_raw_data ->> 'failure_code'::text)) stored,
    "on_behalf_of" text generated always as ((_raw_data ->> 'on_behalf_of'::text)) stored,
    "fraud_details" jsonb generated always as ((_raw_data -> 'fraud_details'::text)) stored,
    "receipt_email" text generated always as ((_raw_data ->> 'receipt_email'::text)) stored,
    "payment_intent" text generated always as ((_raw_data ->> 'payment_intent'::text)) stored,
    "receipt_number" text generated always as ((_raw_data ->> 'receipt_number'::text)) stored,
    "transfer_group" text generated always as ((_raw_data ->> 'transfer_group'::text)) stored,
    "amount_refunded" bigint generated always as (((_raw_data ->> 'amount_refunded'::text))::bigint) stored,
    "application_fee" text generated always as ((_raw_data ->> 'application_fee'::text)) stored,
    "failure_message" text generated always as ((_raw_data ->> 'failure_message'::text)) stored,
    "source_transfer" text generated always as ((_raw_data ->> 'source_transfer'::text)) stored,
    "balance_transaction" text generated always as ((_raw_data ->> 'balance_transaction'::text)) stored,
    "statement_descriptor" text generated always as ((_raw_data ->> 'statement_descriptor'::text)) stored,
    "payment_method_details" jsonb generated always as ((_raw_data -> 'payment_method_details'::text)) stored,
    "id" text not null generated always as ((_raw_data ->> 'id'::text)) stored
      );



  create table "stripe"."checkout_session_line_items" (
    "_updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "_last_synced_at" timestamp with time zone,
    "_raw_data" jsonb,
    "_account_id" text not null,
    "object" text generated always as ((_raw_data ->> 'object'::text)) stored,
    "currency" text generated always as ((_raw_data ->> 'currency'::text)) stored,
    "description" text generated always as ((_raw_data ->> 'description'::text)) stored,
    "price" text generated always as ((_raw_data ->> 'price'::text)) stored,
    "quantity" integer generated always as (((_raw_data ->> 'quantity'::text))::integer) stored,
    "checkout_session" text generated always as ((_raw_data ->> 'checkout_session'::text)) stored,
    "id" text not null generated always as ((_raw_data ->> 'id'::text)) stored,
    "amount_discount" bigint generated always as (((_raw_data ->> 'amount_discount'::text))::bigint) stored,
    "amount_subtotal" bigint generated always as (((_raw_data ->> 'amount_subtotal'::text))::bigint) stored,
    "amount_tax" bigint generated always as (((_raw_data ->> 'amount_tax'::text))::bigint) stored,
    "amount_total" bigint generated always as (((_raw_data ->> 'amount_total'::text))::bigint) stored
      );



  create table "stripe"."checkout_sessions" (
    "_updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "_last_synced_at" timestamp with time zone,
    "_raw_data" jsonb,
    "_account_id" text not null,
    "object" text generated always as ((_raw_data ->> 'object'::text)) stored,
    "adaptive_pricing" jsonb generated always as ((_raw_data -> 'adaptive_pricing'::text)) stored,
    "after_expiration" jsonb generated always as ((_raw_data -> 'after_expiration'::text)) stored,
    "allow_promotion_codes" boolean generated always as (((_raw_data ->> 'allow_promotion_codes'::text))::boolean) stored,
    "automatic_tax" jsonb generated always as ((_raw_data -> 'automatic_tax'::text)) stored,
    "billing_address_collection" text generated always as ((_raw_data ->> 'billing_address_collection'::text)) stored,
    "cancel_url" text generated always as ((_raw_data ->> 'cancel_url'::text)) stored,
    "client_reference_id" text generated always as ((_raw_data ->> 'client_reference_id'::text)) stored,
    "client_secret" text generated always as ((_raw_data ->> 'client_secret'::text)) stored,
    "collected_information" jsonb generated always as ((_raw_data -> 'collected_information'::text)) stored,
    "consent" jsonb generated always as ((_raw_data -> 'consent'::text)) stored,
    "consent_collection" jsonb generated always as ((_raw_data -> 'consent_collection'::text)) stored,
    "created" integer generated always as (((_raw_data ->> 'created'::text))::integer) stored,
    "currency" text generated always as ((_raw_data ->> 'currency'::text)) stored,
    "currency_conversion" jsonb generated always as ((_raw_data -> 'currency_conversion'::text)) stored,
    "custom_fields" jsonb generated always as ((_raw_data -> 'custom_fields'::text)) stored,
    "custom_text" jsonb generated always as ((_raw_data -> 'custom_text'::text)) stored,
    "customer" text generated always as ((_raw_data ->> 'customer'::text)) stored,
    "customer_creation" text generated always as ((_raw_data ->> 'customer_creation'::text)) stored,
    "customer_details" jsonb generated always as ((_raw_data -> 'customer_details'::text)) stored,
    "customer_email" text generated always as ((_raw_data ->> 'customer_email'::text)) stored,
    "discounts" jsonb generated always as ((_raw_data -> 'discounts'::text)) stored,
    "expires_at" integer generated always as (((_raw_data ->> 'expires_at'::text))::integer) stored,
    "invoice" text generated always as ((_raw_data ->> 'invoice'::text)) stored,
    "invoice_creation" jsonb generated always as ((_raw_data -> 'invoice_creation'::text)) stored,
    "livemode" boolean generated always as (((_raw_data ->> 'livemode'::text))::boolean) stored,
    "locale" text generated always as ((_raw_data ->> 'locale'::text)) stored,
    "metadata" jsonb generated always as ((_raw_data -> 'metadata'::text)) stored,
    "mode" text generated always as ((_raw_data ->> 'mode'::text)) stored,
    "optional_items" jsonb generated always as ((_raw_data -> 'optional_items'::text)) stored,
    "payment_intent" text generated always as ((_raw_data ->> 'payment_intent'::text)) stored,
    "payment_link" text generated always as ((_raw_data ->> 'payment_link'::text)) stored,
    "payment_method_collection" text generated always as ((_raw_data ->> 'payment_method_collection'::text)) stored,
    "payment_method_configuration_details" jsonb generated always as ((_raw_data -> 'payment_method_configuration_details'::text)) stored,
    "payment_method_options" jsonb generated always as ((_raw_data -> 'payment_method_options'::text)) stored,
    "payment_method_types" jsonb generated always as ((_raw_data -> 'payment_method_types'::text)) stored,
    "payment_status" text generated always as ((_raw_data ->> 'payment_status'::text)) stored,
    "permissions" jsonb generated always as ((_raw_data -> 'permissions'::text)) stored,
    "phone_number_collection" jsonb generated always as ((_raw_data -> 'phone_number_collection'::text)) stored,
    "presentment_details" jsonb generated always as ((_raw_data -> 'presentment_details'::text)) stored,
    "recovered_from" text generated always as ((_raw_data ->> 'recovered_from'::text)) stored,
    "redirect_on_completion" text generated always as ((_raw_data ->> 'redirect_on_completion'::text)) stored,
    "return_url" text generated always as ((_raw_data ->> 'return_url'::text)) stored,
    "saved_payment_method_options" jsonb generated always as ((_raw_data -> 'saved_payment_method_options'::text)) stored,
    "setup_intent" text generated always as ((_raw_data ->> 'setup_intent'::text)) stored,
    "shipping_address_collection" jsonb generated always as ((_raw_data -> 'shipping_address_collection'::text)) stored,
    "shipping_cost" jsonb generated always as ((_raw_data -> 'shipping_cost'::text)) stored,
    "shipping_details" jsonb generated always as ((_raw_data -> 'shipping_details'::text)) stored,
    "shipping_options" jsonb generated always as ((_raw_data -> 'shipping_options'::text)) stored,
    "status" text generated always as ((_raw_data ->> 'status'::text)) stored,
    "submit_type" text generated always as ((_raw_data ->> 'submit_type'::text)) stored,
    "subscription" text generated always as ((_raw_data ->> 'subscription'::text)) stored,
    "success_url" text generated always as ((_raw_data ->> 'success_url'::text)) stored,
    "tax_id_collection" jsonb generated always as ((_raw_data -> 'tax_id_collection'::text)) stored,
    "total_details" jsonb generated always as ((_raw_data -> 'total_details'::text)) stored,
    "ui_mode" text generated always as ((_raw_data ->> 'ui_mode'::text)) stored,
    "url" text generated always as ((_raw_data ->> 'url'::text)) stored,
    "wallet_options" jsonb generated always as ((_raw_data -> 'wallet_options'::text)) stored,
    "id" text not null generated always as ((_raw_data ->> 'id'::text)) stored,
    "amount_subtotal" bigint generated always as (((_raw_data ->> 'amount_subtotal'::text))::bigint) stored,
    "amount_total" bigint generated always as (((_raw_data ->> 'amount_total'::text))::bigint) stored
      );



  create table "stripe"."coupons" (
    "_updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "_last_synced_at" timestamp with time zone,
    "_raw_data" jsonb,
    "object" text generated always as ((_raw_data ->> 'object'::text)) stored,
    "name" text generated always as ((_raw_data ->> 'name'::text)) stored,
    "valid" boolean generated always as (((_raw_data ->> 'valid'::text))::boolean) stored,
    "created" integer generated always as (((_raw_data ->> 'created'::text))::integer) stored,
    "updated" integer generated always as (((_raw_data ->> 'updated'::text))::integer) stored,
    "currency" text generated always as ((_raw_data ->> 'currency'::text)) stored,
    "duration" text generated always as ((_raw_data ->> 'duration'::text)) stored,
    "livemode" boolean generated always as (((_raw_data ->> 'livemode'::text))::boolean) stored,
    "metadata" jsonb generated always as ((_raw_data -> 'metadata'::text)) stored,
    "redeem_by" integer generated always as (((_raw_data ->> 'redeem_by'::text))::integer) stored,
    "amount_off" bigint generated always as (((_raw_data ->> 'amount_off'::text))::bigint) stored,
    "percent_off" double precision generated always as (((_raw_data ->> 'percent_off'::text))::double precision) stored,
    "times_redeemed" bigint generated always as (((_raw_data ->> 'times_redeemed'::text))::bigint) stored,
    "max_redemptions" bigint generated always as (((_raw_data ->> 'max_redemptions'::text))::bigint) stored,
    "duration_in_months" bigint generated always as (((_raw_data ->> 'duration_in_months'::text))::bigint) stored,
    "percent_off_precise" double precision generated always as (((_raw_data ->> 'percent_off_precise'::text))::double precision) stored,
    "id" text not null generated always as ((_raw_data ->> 'id'::text)) stored
      );



  create table "stripe"."credit_notes" (
    "_last_synced_at" timestamp with time zone,
    "_raw_data" jsonb,
    "_account_id" text not null,
    "object" text generated always as ((_raw_data ->> 'object'::text)) stored,
    "created" integer generated always as (((_raw_data ->> 'created'::text))::integer) stored,
    "currency" text generated always as ((_raw_data ->> 'currency'::text)) stored,
    "customer" text generated always as ((_raw_data ->> 'customer'::text)) stored,
    "customer_balance_transaction" text generated always as ((_raw_data ->> 'customer_balance_transaction'::text)) stored,
    "discount_amounts" jsonb generated always as ((_raw_data -> 'discount_amounts'::text)) stored,
    "invoice" text generated always as ((_raw_data ->> 'invoice'::text)) stored,
    "lines" jsonb generated always as ((_raw_data -> 'lines'::text)) stored,
    "livemode" boolean generated always as (((_raw_data ->> 'livemode'::text))::boolean) stored,
    "memo" text generated always as ((_raw_data ->> 'memo'::text)) stored,
    "metadata" jsonb generated always as ((_raw_data -> 'metadata'::text)) stored,
    "number" text generated always as ((_raw_data ->> 'number'::text)) stored,
    "pdf" text generated always as ((_raw_data ->> 'pdf'::text)) stored,
    "reason" text generated always as ((_raw_data ->> 'reason'::text)) stored,
    "refund" text generated always as ((_raw_data ->> 'refund'::text)) stored,
    "shipping_cost" jsonb generated always as ((_raw_data -> 'shipping_cost'::text)) stored,
    "status" text generated always as ((_raw_data ->> 'status'::text)) stored,
    "tax_amounts" jsonb generated always as ((_raw_data -> 'tax_amounts'::text)) stored,
    "type" text generated always as ((_raw_data ->> 'type'::text)) stored,
    "voided_at" text generated always as ((_raw_data ->> 'voided_at'::text)) stored,
    "id" text not null generated always as ((_raw_data ->> 'id'::text)) stored,
    "amount" bigint generated always as (((_raw_data ->> 'amount'::text))::bigint) stored,
    "amount_shipping" bigint generated always as (((_raw_data ->> 'amount_shipping'::text))::bigint) stored,
    "discount_amount" bigint generated always as (((_raw_data ->> 'discount_amount'::text))::bigint) stored,
    "out_of_band_amount" bigint generated always as (((_raw_data ->> 'out_of_band_amount'::text))::bigint) stored,
    "subtotal" bigint generated always as (((_raw_data ->> 'subtotal'::text))::bigint) stored,
    "subtotal_excluding_tax" bigint generated always as (((_raw_data ->> 'subtotal_excluding_tax'::text))::bigint) stored,
    "total" bigint generated always as (((_raw_data ->> 'total'::text))::bigint) stored,
    "total_excluding_tax" bigint generated always as (((_raw_data ->> 'total_excluding_tax'::text))::bigint) stored
      );



  create table "stripe"."customers" (
    "_updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "_last_synced_at" timestamp with time zone,
    "_raw_data" jsonb,
    "_account_id" text not null,
    "object" text generated always as ((_raw_data ->> 'object'::text)) stored,
    "address" jsonb generated always as ((_raw_data -> 'address'::text)) stored,
    "description" text generated always as ((_raw_data ->> 'description'::text)) stored,
    "email" text generated always as ((_raw_data ->> 'email'::text)) stored,
    "metadata" jsonb generated always as ((_raw_data -> 'metadata'::text)) stored,
    "name" text generated always as ((_raw_data ->> 'name'::text)) stored,
    "phone" text generated always as ((_raw_data ->> 'phone'::text)) stored,
    "shipping" jsonb generated always as ((_raw_data -> 'shipping'::text)) stored,
    "created" integer generated always as (((_raw_data ->> 'created'::text))::integer) stored,
    "currency" text generated always as ((_raw_data ->> 'currency'::text)) stored,
    "default_source" text generated always as ((_raw_data ->> 'default_source'::text)) stored,
    "delinquent" boolean generated always as (((_raw_data ->> 'delinquent'::text))::boolean) stored,
    "discount" jsonb generated always as ((_raw_data -> 'discount'::text)) stored,
    "invoice_prefix" text generated always as ((_raw_data ->> 'invoice_prefix'::text)) stored,
    "invoice_settings" jsonb generated always as ((_raw_data -> 'invoice_settings'::text)) stored,
    "livemode" boolean generated always as (((_raw_data ->> 'livemode'::text))::boolean) stored,
    "next_invoice_sequence" integer generated always as (((_raw_data ->> 'next_invoice_sequence'::text))::integer) stored,
    "preferred_locales" jsonb generated always as ((_raw_data -> 'preferred_locales'::text)) stored,
    "tax_exempt" text generated always as ((_raw_data ->> 'tax_exempt'::text)) stored,
    "deleted" boolean generated always as (((_raw_data ->> 'deleted'::text))::boolean) stored,
    "id" text not null generated always as ((_raw_data ->> 'id'::text)) stored,
    "balance" bigint generated always as (((_raw_data ->> 'balance'::text))::bigint) stored
      );



  create table "stripe"."disputes" (
    "_updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "_last_synced_at" timestamp with time zone,
    "_raw_data" jsonb,
    "_account_id" text not null,
    "object" text generated always as ((_raw_data ->> 'object'::text)) stored,
    "amount" bigint generated always as (((_raw_data ->> 'amount'::text))::bigint) stored,
    "charge" text generated always as ((_raw_data ->> 'charge'::text)) stored,
    "reason" text generated always as ((_raw_data ->> 'reason'::text)) stored,
    "status" text generated always as ((_raw_data ->> 'status'::text)) stored,
    "created" integer generated always as (((_raw_data ->> 'created'::text))::integer) stored,
    "updated" integer generated always as (((_raw_data ->> 'updated'::text))::integer) stored,
    "currency" text generated always as ((_raw_data ->> 'currency'::text)) stored,
    "evidence" jsonb generated always as ((_raw_data -> 'evidence'::text)) stored,
    "livemode" boolean generated always as (((_raw_data ->> 'livemode'::text))::boolean) stored,
    "metadata" jsonb generated always as ((_raw_data -> 'metadata'::text)) stored,
    "evidence_details" jsonb generated always as ((_raw_data -> 'evidence_details'::text)) stored,
    "balance_transactions" jsonb generated always as ((_raw_data -> 'balance_transactions'::text)) stored,
    "is_charge_refundable" boolean generated always as (((_raw_data ->> 'is_charge_refundable'::text))::boolean) stored,
    "payment_intent" text generated always as ((_raw_data ->> 'payment_intent'::text)) stored,
    "id" text not null generated always as ((_raw_data ->> 'id'::text)) stored
      );



  create table "stripe"."early_fraud_warnings" (
    "_updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "_last_synced_at" timestamp with time zone,
    "_raw_data" jsonb,
    "_account_id" text not null,
    "object" text generated always as ((_raw_data ->> 'object'::text)) stored,
    "actionable" boolean generated always as (((_raw_data ->> 'actionable'::text))::boolean) stored,
    "charge" text generated always as ((_raw_data ->> 'charge'::text)) stored,
    "created" integer generated always as (((_raw_data ->> 'created'::text))::integer) stored,
    "fraud_type" text generated always as ((_raw_data ->> 'fraud_type'::text)) stored,
    "livemode" boolean generated always as (((_raw_data ->> 'livemode'::text))::boolean) stored,
    "payment_intent" text generated always as ((_raw_data ->> 'payment_intent'::text)) stored,
    "id" text not null generated always as ((_raw_data ->> 'id'::text)) stored
      );



  create table "stripe"."events" (
    "_updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "_last_synced_at" timestamp with time zone,
    "_raw_data" jsonb,
    "object" text generated always as ((_raw_data ->> 'object'::text)) stored,
    "data" jsonb generated always as ((_raw_data -> 'data'::text)) stored,
    "type" text generated always as ((_raw_data ->> 'type'::text)) stored,
    "created" integer generated always as (((_raw_data ->> 'created'::text))::integer) stored,
    "request" text generated always as ((_raw_data ->> 'request'::text)) stored,
    "updated" integer generated always as (((_raw_data ->> 'updated'::text))::integer) stored,
    "livemode" boolean generated always as (((_raw_data ->> 'livemode'::text))::boolean) stored,
    "api_version" text generated always as ((_raw_data ->> 'api_version'::text)) stored,
    "pending_webhooks" bigint generated always as (((_raw_data ->> 'pending_webhooks'::text))::bigint) stored,
    "id" text not null generated always as ((_raw_data ->> 'id'::text)) stored
      );



  create table "stripe"."exchange_rates_from_usd" (
    "_raw_data" jsonb not null,
    "_last_synced_at" timestamp with time zone,
    "_updated_at" timestamp with time zone default now(),
    "_account_id" text not null,
    "date" date not null,
    "sell_currency" text not null,
    "buy_currency_exchange_rates" text generated always as (NULLIF((_raw_data ->> 'buy_currency_exchange_rates'::text), ''::text)) stored
      );



  create table "stripe"."features" (
    "_updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "_last_synced_at" timestamp with time zone,
    "_raw_data" jsonb,
    "_account_id" text not null,
    "object" text generated always as ((_raw_data ->> 'object'::text)) stored,
    "livemode" boolean generated always as (((_raw_data ->> 'livemode'::text))::boolean) stored,
    "name" text generated always as ((_raw_data ->> 'name'::text)) stored,
    "lookup_key" text generated always as ((_raw_data ->> 'lookup_key'::text)) stored,
    "active" boolean generated always as (((_raw_data ->> 'active'::text))::boolean) stored,
    "metadata" jsonb generated always as ((_raw_data -> 'metadata'::text)) stored,
    "id" text not null generated always as ((_raw_data ->> 'id'::text)) stored
      );



  create table "stripe"."invoices" (
    "_updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "_last_synced_at" timestamp with time zone,
    "_raw_data" jsonb,
    "_account_id" text not null,
    "object" text generated always as ((_raw_data ->> 'object'::text)) stored,
    "auto_advance" boolean generated always as (((_raw_data ->> 'auto_advance'::text))::boolean) stored,
    "collection_method" text generated always as ((_raw_data ->> 'collection_method'::text)) stored,
    "currency" text generated always as ((_raw_data ->> 'currency'::text)) stored,
    "description" text generated always as ((_raw_data ->> 'description'::text)) stored,
    "hosted_invoice_url" text generated always as ((_raw_data ->> 'hosted_invoice_url'::text)) stored,
    "lines" jsonb generated always as ((_raw_data -> 'lines'::text)) stored,
    "period_end" integer generated always as (((_raw_data ->> 'period_end'::text))::integer) stored,
    "period_start" integer generated always as (((_raw_data ->> 'period_start'::text))::integer) stored,
    "status" text generated always as ((_raw_data ->> 'status'::text)) stored,
    "total" bigint generated always as (((_raw_data ->> 'total'::text))::bigint) stored,
    "account_country" text generated always as ((_raw_data ->> 'account_country'::text)) stored,
    "account_name" text generated always as ((_raw_data ->> 'account_name'::text)) stored,
    "account_tax_ids" jsonb generated always as ((_raw_data -> 'account_tax_ids'::text)) stored,
    "amount_due" bigint generated always as (((_raw_data ->> 'amount_due'::text))::bigint) stored,
    "amount_paid" bigint generated always as (((_raw_data ->> 'amount_paid'::text))::bigint) stored,
    "amount_remaining" bigint generated always as (((_raw_data ->> 'amount_remaining'::text))::bigint) stored,
    "application_fee_amount" bigint generated always as (((_raw_data ->> 'application_fee_amount'::text))::bigint) stored,
    "attempt_count" integer generated always as (((_raw_data ->> 'attempt_count'::text))::integer) stored,
    "attempted" boolean generated always as (((_raw_data ->> 'attempted'::text))::boolean) stored,
    "billing_reason" text generated always as ((_raw_data ->> 'billing_reason'::text)) stored,
    "created" integer generated always as (((_raw_data ->> 'created'::text))::integer) stored,
    "custom_fields" jsonb generated always as ((_raw_data -> 'custom_fields'::text)) stored,
    "customer_address" jsonb generated always as ((_raw_data -> 'customer_address'::text)) stored,
    "customer_email" text generated always as ((_raw_data ->> 'customer_email'::text)) stored,
    "customer_name" text generated always as ((_raw_data ->> 'customer_name'::text)) stored,
    "customer_phone" text generated always as ((_raw_data ->> 'customer_phone'::text)) stored,
    "customer_shipping" jsonb generated always as ((_raw_data -> 'customer_shipping'::text)) stored,
    "customer_tax_exempt" text generated always as ((_raw_data ->> 'customer_tax_exempt'::text)) stored,
    "customer_tax_ids" jsonb generated always as ((_raw_data -> 'customer_tax_ids'::text)) stored,
    "default_tax_rates" jsonb generated always as ((_raw_data -> 'default_tax_rates'::text)) stored,
    "discount" jsonb generated always as ((_raw_data -> 'discount'::text)) stored,
    "discounts" jsonb generated always as ((_raw_data -> 'discounts'::text)) stored,
    "due_date" integer generated always as (((_raw_data ->> 'due_date'::text))::integer) stored,
    "footer" text generated always as ((_raw_data ->> 'footer'::text)) stored,
    "invoice_pdf" text generated always as ((_raw_data ->> 'invoice_pdf'::text)) stored,
    "last_finalization_error" jsonb generated always as ((_raw_data -> 'last_finalization_error'::text)) stored,
    "livemode" boolean generated always as (((_raw_data ->> 'livemode'::text))::boolean) stored,
    "next_payment_attempt" integer generated always as (((_raw_data ->> 'next_payment_attempt'::text))::integer) stored,
    "number" text generated always as ((_raw_data ->> 'number'::text)) stored,
    "paid" boolean generated always as (((_raw_data ->> 'paid'::text))::boolean) stored,
    "payment_settings" jsonb generated always as ((_raw_data -> 'payment_settings'::text)) stored,
    "receipt_number" text generated always as ((_raw_data ->> 'receipt_number'::text)) stored,
    "statement_descriptor" text generated always as ((_raw_data ->> 'statement_descriptor'::text)) stored,
    "status_transitions" jsonb generated always as ((_raw_data -> 'status_transitions'::text)) stored,
    "total_discount_amounts" jsonb generated always as ((_raw_data -> 'total_discount_amounts'::text)) stored,
    "total_tax_amounts" jsonb generated always as ((_raw_data -> 'total_tax_amounts'::text)) stored,
    "transfer_data" jsonb generated always as ((_raw_data -> 'transfer_data'::text)) stored,
    "webhooks_delivered_at" integer generated always as (((_raw_data ->> 'webhooks_delivered_at'::text))::integer) stored,
    "customer" text generated always as ((_raw_data ->> 'customer'::text)) stored,
    "subscription" text generated always as ((_raw_data ->> 'subscription'::text)) stored,
    "payment_intent" text generated always as ((_raw_data ->> 'payment_intent'::text)) stored,
    "default_payment_method" text generated always as ((_raw_data ->> 'default_payment_method'::text)) stored,
    "default_source" text generated always as ((_raw_data ->> 'default_source'::text)) stored,
    "on_behalf_of" text generated always as ((_raw_data ->> 'on_behalf_of'::text)) stored,
    "charge" text generated always as ((_raw_data ->> 'charge'::text)) stored,
    "metadata" jsonb generated always as ((_raw_data -> 'metadata'::text)) stored,
    "id" text not null generated always as ((_raw_data ->> 'id'::text)) stored,
    "ending_balance" bigint generated always as (((_raw_data ->> 'ending_balance'::text))::bigint) stored,
    "starting_balance" bigint generated always as (((_raw_data ->> 'starting_balance'::text))::bigint) stored,
    "subtotal" bigint generated always as (((_raw_data ->> 'subtotal'::text))::bigint) stored,
    "tax" bigint generated always as (((_raw_data ->> 'tax'::text))::bigint) stored,
    "post_payment_credit_notes_amount" bigint generated always as (((_raw_data ->> 'post_payment_credit_notes_amount'::text))::bigint) stored,
    "pre_payment_credit_notes_amount" bigint generated always as (((_raw_data ->> 'pre_payment_credit_notes_amount'::text))::bigint) stored
      );



  create table "stripe"."payment_intents" (
    "_last_synced_at" timestamp with time zone,
    "_raw_data" jsonb,
    "_account_id" text not null,
    "object" text generated always as ((_raw_data ->> 'object'::text)) stored,
    "amount_details" jsonb generated always as ((_raw_data -> 'amount_details'::text)) stored,
    "application" text generated always as ((_raw_data ->> 'application'::text)) stored,
    "automatic_payment_methods" text generated always as ((_raw_data ->> 'automatic_payment_methods'::text)) stored,
    "canceled_at" integer generated always as (((_raw_data ->> 'canceled_at'::text))::integer) stored,
    "cancellation_reason" text generated always as ((_raw_data ->> 'cancellation_reason'::text)) stored,
    "capture_method" text generated always as ((_raw_data ->> 'capture_method'::text)) stored,
    "client_secret" text generated always as ((_raw_data ->> 'client_secret'::text)) stored,
    "confirmation_method" text generated always as ((_raw_data ->> 'confirmation_method'::text)) stored,
    "created" integer generated always as (((_raw_data ->> 'created'::text))::integer) stored,
    "currency" text generated always as ((_raw_data ->> 'currency'::text)) stored,
    "customer" text generated always as ((_raw_data ->> 'customer'::text)) stored,
    "description" text generated always as ((_raw_data ->> 'description'::text)) stored,
    "invoice" text generated always as ((_raw_data ->> 'invoice'::text)) stored,
    "last_payment_error" text generated always as ((_raw_data ->> 'last_payment_error'::text)) stored,
    "livemode" boolean generated always as (((_raw_data ->> 'livemode'::text))::boolean) stored,
    "metadata" jsonb generated always as ((_raw_data -> 'metadata'::text)) stored,
    "next_action" text generated always as ((_raw_data ->> 'next_action'::text)) stored,
    "on_behalf_of" text generated always as ((_raw_data ->> 'on_behalf_of'::text)) stored,
    "payment_method" text generated always as ((_raw_data ->> 'payment_method'::text)) stored,
    "payment_method_options" jsonb generated always as ((_raw_data -> 'payment_method_options'::text)) stored,
    "payment_method_types" jsonb generated always as ((_raw_data -> 'payment_method_types'::text)) stored,
    "processing" text generated always as ((_raw_data ->> 'processing'::text)) stored,
    "receipt_email" text generated always as ((_raw_data ->> 'receipt_email'::text)) stored,
    "review" text generated always as ((_raw_data ->> 'review'::text)) stored,
    "setup_future_usage" text generated always as ((_raw_data ->> 'setup_future_usage'::text)) stored,
    "shipping" jsonb generated always as ((_raw_data -> 'shipping'::text)) stored,
    "statement_descriptor" text generated always as ((_raw_data ->> 'statement_descriptor'::text)) stored,
    "statement_descriptor_suffix" text generated always as ((_raw_data ->> 'statement_descriptor_suffix'::text)) stored,
    "status" text generated always as ((_raw_data ->> 'status'::text)) stored,
    "transfer_data" jsonb generated always as ((_raw_data -> 'transfer_data'::text)) stored,
    "transfer_group" text generated always as ((_raw_data ->> 'transfer_group'::text)) stored,
    "id" text not null generated always as ((_raw_data ->> 'id'::text)) stored,
    "amount" bigint generated always as (((_raw_data ->> 'amount'::text))::bigint) stored,
    "amount_capturable" bigint generated always as (((_raw_data ->> 'amount_capturable'::text))::bigint) stored,
    "amount_received" bigint generated always as (((_raw_data ->> 'amount_received'::text))::bigint) stored,
    "application_fee_amount" bigint generated always as (((_raw_data ->> 'application_fee_amount'::text))::bigint) stored
      );



  create table "stripe"."payment_methods" (
    "_last_synced_at" timestamp with time zone,
    "_raw_data" jsonb,
    "_account_id" text not null,
    "object" text generated always as ((_raw_data ->> 'object'::text)) stored,
    "created" integer generated always as (((_raw_data ->> 'created'::text))::integer) stored,
    "customer" text generated always as ((_raw_data ->> 'customer'::text)) stored,
    "type" text generated always as ((_raw_data ->> 'type'::text)) stored,
    "billing_details" jsonb generated always as ((_raw_data -> 'billing_details'::text)) stored,
    "metadata" jsonb generated always as ((_raw_data -> 'metadata'::text)) stored,
    "card" jsonb generated always as ((_raw_data -> 'card'::text)) stored,
    "id" text not null generated always as ((_raw_data ->> 'id'::text)) stored
      );



  create table "stripe"."payouts" (
    "_updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "_last_synced_at" timestamp with time zone,
    "_raw_data" jsonb,
    "object" text generated always as ((_raw_data ->> 'object'::text)) stored,
    "date" text generated always as ((_raw_data ->> 'date'::text)) stored,
    "type" text generated always as ((_raw_data ->> 'type'::text)) stored,
    "amount" bigint generated always as (((_raw_data ->> 'amount'::text))::bigint) stored,
    "method" text generated always as ((_raw_data ->> 'method'::text)) stored,
    "status" text generated always as ((_raw_data ->> 'status'::text)) stored,
    "created" integer generated always as (((_raw_data ->> 'created'::text))::integer) stored,
    "updated" integer generated always as (((_raw_data ->> 'updated'::text))::integer) stored,
    "currency" text generated always as ((_raw_data ->> 'currency'::text)) stored,
    "livemode" boolean generated always as (((_raw_data ->> 'livemode'::text))::boolean) stored,
    "metadata" jsonb generated always as ((_raw_data -> 'metadata'::text)) stored,
    "automatic" boolean generated always as (((_raw_data ->> 'automatic'::text))::boolean) stored,
    "recipient" text generated always as ((_raw_data ->> 'recipient'::text)) stored,
    "description" text generated always as ((_raw_data ->> 'description'::text)) stored,
    "destination" text generated always as ((_raw_data ->> 'destination'::text)) stored,
    "source_type" text generated always as ((_raw_data ->> 'source_type'::text)) stored,
    "arrival_date" text generated always as ((_raw_data ->> 'arrival_date'::text)) stored,
    "bank_account" jsonb generated always as ((_raw_data -> 'bank_account'::text)) stored,
    "failure_code" text generated always as ((_raw_data ->> 'failure_code'::text)) stored,
    "transfer_group" text generated always as ((_raw_data ->> 'transfer_group'::text)) stored,
    "amount_reversed" bigint generated always as (((_raw_data ->> 'amount_reversed'::text))::bigint) stored,
    "failure_message" text generated always as ((_raw_data ->> 'failure_message'::text)) stored,
    "source_transaction" text generated always as ((_raw_data ->> 'source_transaction'::text)) stored,
    "balance_transaction" text generated always as ((_raw_data ->> 'balance_transaction'::text)) stored,
    "statement_descriptor" text generated always as ((_raw_data ->> 'statement_descriptor'::text)) stored,
    "statement_description" text generated always as ((_raw_data ->> 'statement_description'::text)) stored,
    "failure_balance_transaction" text generated always as ((_raw_data ->> 'failure_balance_transaction'::text)) stored,
    "id" text not null generated always as ((_raw_data ->> 'id'::text)) stored
      );



  create table "stripe"."plans" (
    "_updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "_last_synced_at" timestamp with time zone,
    "_raw_data" jsonb,
    "_account_id" text not null,
    "object" text generated always as ((_raw_data ->> 'object'::text)) stored,
    "name" text generated always as ((_raw_data ->> 'name'::text)) stored,
    "tiers" jsonb generated always as ((_raw_data -> 'tiers'::text)) stored,
    "active" boolean generated always as (((_raw_data ->> 'active'::text))::boolean) stored,
    "amount" bigint generated always as (((_raw_data ->> 'amount'::text))::bigint) stored,
    "created" integer generated always as (((_raw_data ->> 'created'::text))::integer) stored,
    "product" text generated always as ((_raw_data ->> 'product'::text)) stored,
    "updated" integer generated always as (((_raw_data ->> 'updated'::text))::integer) stored,
    "currency" text generated always as ((_raw_data ->> 'currency'::text)) stored,
    "interval" text generated always as ((_raw_data ->> 'interval'::text)) stored,
    "livemode" boolean generated always as (((_raw_data ->> 'livemode'::text))::boolean) stored,
    "metadata" jsonb generated always as ((_raw_data -> 'metadata'::text)) stored,
    "nickname" text generated always as ((_raw_data ->> 'nickname'::text)) stored,
    "tiers_mode" text generated always as ((_raw_data ->> 'tiers_mode'::text)) stored,
    "usage_type" text generated always as ((_raw_data ->> 'usage_type'::text)) stored,
    "billing_scheme" text generated always as ((_raw_data ->> 'billing_scheme'::text)) stored,
    "interval_count" bigint generated always as (((_raw_data ->> 'interval_count'::text))::bigint) stored,
    "aggregate_usage" text generated always as ((_raw_data ->> 'aggregate_usage'::text)) stored,
    "transform_usage" text generated always as ((_raw_data ->> 'transform_usage'::text)) stored,
    "trial_period_days" bigint generated always as (((_raw_data ->> 'trial_period_days'::text))::bigint) stored,
    "statement_descriptor" text generated always as ((_raw_data ->> 'statement_descriptor'::text)) stored,
    "statement_description" text generated always as ((_raw_data ->> 'statement_description'::text)) stored,
    "id" text not null generated always as ((_raw_data ->> 'id'::text)) stored
      );



  create table "stripe"."prices" (
    "_updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "_last_synced_at" timestamp with time zone,
    "_raw_data" jsonb,
    "_account_id" text not null,
    "object" text generated always as ((_raw_data ->> 'object'::text)) stored,
    "active" boolean generated always as (((_raw_data ->> 'active'::text))::boolean) stored,
    "currency" text generated always as ((_raw_data ->> 'currency'::text)) stored,
    "metadata" jsonb generated always as ((_raw_data -> 'metadata'::text)) stored,
    "nickname" text generated always as ((_raw_data ->> 'nickname'::text)) stored,
    "recurring" jsonb generated always as ((_raw_data -> 'recurring'::text)) stored,
    "type" text generated always as ((_raw_data ->> 'type'::text)) stored,
    "billing_scheme" text generated always as ((_raw_data ->> 'billing_scheme'::text)) stored,
    "created" integer generated always as (((_raw_data ->> 'created'::text))::integer) stored,
    "livemode" boolean generated always as (((_raw_data ->> 'livemode'::text))::boolean) stored,
    "lookup_key" text generated always as ((_raw_data ->> 'lookup_key'::text)) stored,
    "tiers_mode" text generated always as ((_raw_data ->> 'tiers_mode'::text)) stored,
    "transform_quantity" jsonb generated always as ((_raw_data -> 'transform_quantity'::text)) stored,
    "unit_amount_decimal" text generated always as ((_raw_data ->> 'unit_amount_decimal'::text)) stored,
    "product" text generated always as ((_raw_data ->> 'product'::text)) stored,
    "id" text not null generated always as ((_raw_data ->> 'id'::text)) stored,
    "unit_amount" bigint generated always as (((_raw_data ->> 'unit_amount'::text))::bigint) stored
      );



  create table "stripe"."products" (
    "_updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "_last_synced_at" timestamp with time zone,
    "_raw_data" jsonb,
    "_account_id" text not null,
    "object" text generated always as ((_raw_data ->> 'object'::text)) stored,
    "active" boolean generated always as (((_raw_data ->> 'active'::text))::boolean) stored,
    "default_price" text generated always as ((_raw_data ->> 'default_price'::text)) stored,
    "description" text generated always as ((_raw_data ->> 'description'::text)) stored,
    "metadata" jsonb generated always as ((_raw_data -> 'metadata'::text)) stored,
    "name" text generated always as ((_raw_data ->> 'name'::text)) stored,
    "created" integer generated always as (((_raw_data ->> 'created'::text))::integer) stored,
    "images" jsonb generated always as ((_raw_data -> 'images'::text)) stored,
    "marketing_features" jsonb generated always as ((_raw_data -> 'marketing_features'::text)) stored,
    "livemode" boolean generated always as (((_raw_data ->> 'livemode'::text))::boolean) stored,
    "package_dimensions" jsonb generated always as ((_raw_data -> 'package_dimensions'::text)) stored,
    "shippable" boolean generated always as (((_raw_data ->> 'shippable'::text))::boolean) stored,
    "statement_descriptor" text generated always as ((_raw_data ->> 'statement_descriptor'::text)) stored,
    "unit_label" text generated always as ((_raw_data ->> 'unit_label'::text)) stored,
    "updated" integer generated always as (((_raw_data ->> 'updated'::text))::integer) stored,
    "url" text generated always as ((_raw_data ->> 'url'::text)) stored,
    "id" text not null generated always as ((_raw_data ->> 'id'::text)) stored
      );



  create table "stripe"."refunds" (
    "_updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "_last_synced_at" timestamp with time zone,
    "_raw_data" jsonb,
    "_account_id" text not null,
    "object" text generated always as ((_raw_data ->> 'object'::text)) stored,
    "balance_transaction" text generated always as ((_raw_data ->> 'balance_transaction'::text)) stored,
    "charge" text generated always as ((_raw_data ->> 'charge'::text)) stored,
    "created" integer generated always as (((_raw_data ->> 'created'::text))::integer) stored,
    "currency" text generated always as ((_raw_data ->> 'currency'::text)) stored,
    "destination_details" jsonb generated always as ((_raw_data -> 'destination_details'::text)) stored,
    "metadata" jsonb generated always as ((_raw_data -> 'metadata'::text)) stored,
    "payment_intent" text generated always as ((_raw_data ->> 'payment_intent'::text)) stored,
    "reason" text generated always as ((_raw_data ->> 'reason'::text)) stored,
    "receipt_number" text generated always as ((_raw_data ->> 'receipt_number'::text)) stored,
    "source_transfer_reversal" text generated always as ((_raw_data ->> 'source_transfer_reversal'::text)) stored,
    "status" text generated always as ((_raw_data ->> 'status'::text)) stored,
    "transfer_reversal" text generated always as ((_raw_data ->> 'transfer_reversal'::text)) stored,
    "id" text not null generated always as ((_raw_data ->> 'id'::text)) stored,
    "amount" bigint generated always as (((_raw_data ->> 'amount'::text))::bigint) stored
      );



  create table "stripe"."reviews" (
    "_updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "_last_synced_at" timestamp with time zone,
    "_raw_data" jsonb,
    "_account_id" text not null,
    "object" text generated always as ((_raw_data ->> 'object'::text)) stored,
    "billing_zip" text generated always as ((_raw_data ->> 'billing_zip'::text)) stored,
    "charge" text generated always as ((_raw_data ->> 'charge'::text)) stored,
    "created" integer generated always as (((_raw_data ->> 'created'::text))::integer) stored,
    "closed_reason" text generated always as ((_raw_data ->> 'closed_reason'::text)) stored,
    "livemode" boolean generated always as (((_raw_data ->> 'livemode'::text))::boolean) stored,
    "ip_address" text generated always as ((_raw_data ->> 'ip_address'::text)) stored,
    "ip_address_location" jsonb generated always as ((_raw_data -> 'ip_address_location'::text)) stored,
    "open" boolean generated always as (((_raw_data ->> 'open'::text))::boolean) stored,
    "opened_reason" text generated always as ((_raw_data ->> 'opened_reason'::text)) stored,
    "payment_intent" text generated always as ((_raw_data ->> 'payment_intent'::text)) stored,
    "reason" text generated always as ((_raw_data ->> 'reason'::text)) stored,
    "session" text generated always as ((_raw_data ->> 'session'::text)) stored,
    "id" text not null generated always as ((_raw_data ->> 'id'::text)) stored
      );



  create table "stripe"."setup_intents" (
    "_last_synced_at" timestamp with time zone,
    "_raw_data" jsonb,
    "_account_id" text not null,
    "object" text generated always as ((_raw_data ->> 'object'::text)) stored,
    "created" integer generated always as (((_raw_data ->> 'created'::text))::integer) stored,
    "customer" text generated always as ((_raw_data ->> 'customer'::text)) stored,
    "description" text generated always as ((_raw_data ->> 'description'::text)) stored,
    "payment_method" text generated always as ((_raw_data ->> 'payment_method'::text)) stored,
    "status" text generated always as ((_raw_data ->> 'status'::text)) stored,
    "usage" text generated always as ((_raw_data ->> 'usage'::text)) stored,
    "cancellation_reason" text generated always as ((_raw_data ->> 'cancellation_reason'::text)) stored,
    "latest_attempt" text generated always as ((_raw_data ->> 'latest_attempt'::text)) stored,
    "mandate" text generated always as ((_raw_data ->> 'mandate'::text)) stored,
    "single_use_mandate" text generated always as ((_raw_data ->> 'single_use_mandate'::text)) stored,
    "on_behalf_of" text generated always as ((_raw_data ->> 'on_behalf_of'::text)) stored,
    "id" text not null generated always as ((_raw_data ->> 'id'::text)) stored
      );



  create table "stripe"."subscription_item_change_events_v2_beta" (
    "_raw_data" jsonb not null,
    "_last_synced_at" timestamp with time zone,
    "_updated_at" timestamp with time zone default now(),
    "_account_id" text not null,
    "event_timestamp" timestamp with time zone not null,
    "event_type" text not null,
    "subscription_item_id" text not null,
    "currency" text generated always as (NULLIF((_raw_data ->> 'currency'::text), ''::text)) stored,
    "mrr_change" bigint generated always as ((NULLIF((_raw_data ->> 'mrr_change'::text), ''::text))::bigint) stored,
    "quantity_change" bigint generated always as ((NULLIF((_raw_data ->> 'quantity_change'::text), ''::text))::bigint) stored,
    "subscription_id" text generated always as (NULLIF((_raw_data ->> 'subscription_id'::text), ''::text)) stored,
    "customer_id" text generated always as (NULLIF((_raw_data ->> 'customer_id'::text), ''::text)) stored,
    "price_id" text generated always as (NULLIF((_raw_data ->> 'price_id'::text), ''::text)) stored,
    "product_id" text generated always as (NULLIF((_raw_data ->> 'product_id'::text), ''::text)) stored,
    "local_event_timestamp" text generated always as (NULLIF((_raw_data ->> 'local_event_timestamp'::text), ''::text)) stored
      );



  create table "stripe"."subscription_items" (
    "_last_synced_at" timestamp with time zone,
    "_raw_data" jsonb,
    "_account_id" text not null,
    "object" text generated always as ((_raw_data ->> 'object'::text)) stored,
    "billing_thresholds" jsonb generated always as ((_raw_data -> 'billing_thresholds'::text)) stored,
    "created" integer generated always as (((_raw_data ->> 'created'::text))::integer) stored,
    "deleted" boolean generated always as (((_raw_data ->> 'deleted'::text))::boolean) stored,
    "metadata" jsonb generated always as ((_raw_data -> 'metadata'::text)) stored,
    "quantity" integer generated always as (((_raw_data ->> 'quantity'::text))::integer) stored,
    "price" text generated always as ((_raw_data ->> 'price'::text)) stored,
    "subscription" text generated always as ((_raw_data ->> 'subscription'::text)) stored,
    "tax_rates" jsonb generated always as ((_raw_data -> 'tax_rates'::text)) stored,
    "current_period_end" integer generated always as (((_raw_data ->> 'current_period_end'::text))::integer) stored,
    "current_period_start" integer generated always as (((_raw_data ->> 'current_period_start'::text))::integer) stored,
    "id" text not null generated always as ((_raw_data ->> 'id'::text)) stored
      );



  create table "stripe"."subscription_schedules" (
    "_last_synced_at" timestamp with time zone,
    "_raw_data" jsonb,
    "_account_id" text not null,
    "object" text generated always as ((_raw_data ->> 'object'::text)) stored,
    "application" text generated always as ((_raw_data ->> 'application'::text)) stored,
    "canceled_at" integer generated always as (((_raw_data ->> 'canceled_at'::text))::integer) stored,
    "completed_at" integer generated always as (((_raw_data ->> 'completed_at'::text))::integer) stored,
    "created" integer generated always as (((_raw_data ->> 'created'::text))::integer) stored,
    "current_phase" jsonb generated always as ((_raw_data -> 'current_phase'::text)) stored,
    "customer" text generated always as ((_raw_data ->> 'customer'::text)) stored,
    "default_settings" jsonb generated always as ((_raw_data -> 'default_settings'::text)) stored,
    "end_behavior" text generated always as ((_raw_data ->> 'end_behavior'::text)) stored,
    "livemode" boolean generated always as (((_raw_data ->> 'livemode'::text))::boolean) stored,
    "metadata" jsonb generated always as ((_raw_data -> 'metadata'::text)) stored,
    "phases" jsonb generated always as ((_raw_data -> 'phases'::text)) stored,
    "released_at" integer generated always as (((_raw_data ->> 'released_at'::text))::integer) stored,
    "released_subscription" text generated always as ((_raw_data ->> 'released_subscription'::text)) stored,
    "status" text generated always as ((_raw_data ->> 'status'::text)) stored,
    "subscription" text generated always as ((_raw_data ->> 'subscription'::text)) stored,
    "test_clock" text generated always as ((_raw_data ->> 'test_clock'::text)) stored,
    "id" text not null generated always as ((_raw_data ->> 'id'::text)) stored
      );



  create table "stripe"."subscriptions" (
    "_updated_at" timestamp with time zone not null default timezone('utc'::text, now()),
    "_last_synced_at" timestamp with time zone,
    "_raw_data" jsonb,
    "_account_id" text not null,
    "object" text generated always as ((_raw_data ->> 'object'::text)) stored,
    "cancel_at_period_end" boolean generated always as (((_raw_data ->> 'cancel_at_period_end'::text))::boolean) stored,
    "current_period_end" integer generated always as (((_raw_data ->> 'current_period_end'::text))::integer) stored,
    "current_period_start" integer generated always as (((_raw_data ->> 'current_period_start'::text))::integer) stored,
    "default_payment_method" text generated always as ((_raw_data ->> 'default_payment_method'::text)) stored,
    "items" jsonb generated always as ((_raw_data -> 'items'::text)) stored,
    "metadata" jsonb generated always as ((_raw_data -> 'metadata'::text)) stored,
    "pending_setup_intent" text generated always as ((_raw_data ->> 'pending_setup_intent'::text)) stored,
    "pending_update" jsonb generated always as ((_raw_data -> 'pending_update'::text)) stored,
    "status" text generated always as ((_raw_data ->> 'status'::text)) stored,
    "application_fee_percent" double precision generated always as (((_raw_data ->> 'application_fee_percent'::text))::double precision) stored,
    "billing_cycle_anchor" integer generated always as (((_raw_data ->> 'billing_cycle_anchor'::text))::integer) stored,
    "billing_thresholds" jsonb generated always as ((_raw_data -> 'billing_thresholds'::text)) stored,
    "cancel_at" integer generated always as (((_raw_data ->> 'cancel_at'::text))::integer) stored,
    "canceled_at" integer generated always as (((_raw_data ->> 'canceled_at'::text))::integer) stored,
    "collection_method" text generated always as ((_raw_data ->> 'collection_method'::text)) stored,
    "created" integer generated always as (((_raw_data ->> 'created'::text))::integer) stored,
    "days_until_due" integer generated always as (((_raw_data ->> 'days_until_due'::text))::integer) stored,
    "default_source" text generated always as ((_raw_data ->> 'default_source'::text)) stored,
    "default_tax_rates" jsonb generated always as ((_raw_data -> 'default_tax_rates'::text)) stored,
    "discount" jsonb generated always as ((_raw_data -> 'discount'::text)) stored,
    "ended_at" integer generated always as (((_raw_data ->> 'ended_at'::text))::integer) stored,
    "livemode" boolean generated always as (((_raw_data ->> 'livemode'::text))::boolean) stored,
    "next_pending_invoice_item_invoice" integer generated always as (((_raw_data ->> 'next_pending_invoice_item_invoice'::text))::integer) stored,
    "pause_collection" jsonb generated always as ((_raw_data -> 'pause_collection'::text)) stored,
    "pending_invoice_item_interval" jsonb generated always as ((_raw_data -> 'pending_invoice_item_interval'::text)) stored,
    "start_date" integer generated always as (((_raw_data ->> 'start_date'::text))::integer) stored,
    "transfer_data" jsonb generated always as ((_raw_data -> 'transfer_data'::text)) stored,
    "trial_end" jsonb generated always as ((_raw_data -> 'trial_end'::text)) stored,
    "trial_start" jsonb generated always as ((_raw_data -> 'trial_start'::text)) stored,
    "schedule" text generated always as ((_raw_data ->> 'schedule'::text)) stored,
    "customer" text generated always as ((_raw_data ->> 'customer'::text)) stored,
    "latest_invoice" text generated always as ((_raw_data ->> 'latest_invoice'::text)) stored,
    "plan" text generated always as ((_raw_data ->> 'plan'::text)) stored,
    "id" text not null generated always as ((_raw_data ->> 'id'::text)) stored
      );



  create table "stripe"."tax_ids" (
    "_last_synced_at" timestamp with time zone,
    "_raw_data" jsonb,
    "_account_id" text not null,
    "object" text generated always as ((_raw_data ->> 'object'::text)) stored,
    "country" text generated always as ((_raw_data ->> 'country'::text)) stored,
    "customer" text generated always as ((_raw_data ->> 'customer'::text)) stored,
    "type" text generated always as ((_raw_data ->> 'type'::text)) stored,
    "value" text generated always as ((_raw_data ->> 'value'::text)) stored,
    "created" integer generated always as (((_raw_data ->> 'created'::text))::integer) stored,
    "livemode" boolean generated always as (((_raw_data ->> 'livemode'::text))::boolean) stored,
    "owner" jsonb generated always as ((_raw_data -> 'owner'::text)) stored,
    "id" text not null generated always as ((_raw_data ->> 'id'::text)) stored
      );


alter table "public"."profiles" drop column "role";

alter table "public"."profiles" add column "bio" text;

alter table "public"."profiles" add column "current_bucket" text;

alter table "public"."profiles" add column "email" text;

alter table "public"."profiles" add column "full_name" text;

alter table "public"."profiles" add column "handle" text;

alter table "public"."profiles" add column "is_admin" boolean default false;

alter table "public"."profiles" add column "is_onboarded" boolean default false;

alter table "public"."profiles" add column "last_sign_in_at" timestamp with time zone;

alter table "public"."profiles" add column "preferences" jsonb default '{}'::jsonb;

alter table "public"."profiles" add column "username" text;

alter table "public"."profiles" add column "website" text;

alter sequence "n8n"."auth_provider_sync_history_id_seq" owned by "n8n"."auth_provider_sync_history"."id";

alter sequence "n8n"."execution_annotations_id_seq" owned by "n8n"."execution_annotations"."id";

alter sequence "n8n"."execution_entity_id_seq" owned by "n8n"."execution_entity"."id";

alter sequence "n8n"."execution_metadata_temp_id_seq" owned by "n8n"."execution_metadata"."id";

alter sequence "n8n"."migrations_id_seq" owned by "n8n"."migrations"."id";

alter sequence "n8n"."n8n_credentials_entity_id_seq" owned by "n8n"."n8n_credentials_entity"."id";

alter sequence "n8n"."n8n_execution_entity_id_seq" owned by "n8n"."n8n_execution_entity"."id";

alter sequence "n8n"."n8n_migrations_id_seq" owned by "n8n"."n8n_migrations"."id";

alter sequence "n8n"."n8n_tag_entity_id_seq" owned by "n8n"."n8n_tag_entity"."id";

alter sequence "n8n"."n8n_workflow_entity_id_seq" owned by "n8n"."n8n_workflow_entity"."id";

alter sequence "public"."auth_provider_sync_history_id_seq" owned by "public"."auth_provider_sync_history"."id";

alter sequence "public"."execution_annotations_id_seq" owned by "public"."execution_annotations"."id";

alter sequence "public"."execution_entity_id_seq" owned by "public"."execution_entity"."id";

alter sequence "public"."execution_metadata_temp_id_seq" owned by "public"."execution_metadata"."id";

alter sequence "public"."migrations_id_seq" owned by "public"."migrations"."id";

alter sequence "public"."workflow_statistics_id_seq" owned by "public"."workflow_statistics"."id";

CREATE INDEX "IDX_070b5de842ece9ccdda0d9738b" ON n8n.workflow_publish_history USING btree ("workflowId", "versionId");

CREATE UNIQUE INDEX "IDX_14f68deffaf858465715995508" ON n8n.folder USING btree ("projectId", id);

CREATE UNIQUE INDEX "IDX_1d8ab99d5861c9388d2dc1cf73" ON n8n.insights_metadata USING btree ("workflowId");

CREATE INDEX "IDX_1e31657f5fe46816c34be7c1b4" ON n8n.workflow_history USING btree ("workflowId");

CREATE UNIQUE INDEX "IDX_1ef35bac35d20bdae979d917a3" ON n8n.user_api_keys USING btree ("apiKey");

CREATE INDEX "IDX_56900edc3cfd16612e2ef2c6a8" ON n8n.binary_data USING btree ("sourceType", "sourceId");

CREATE INDEX "IDX_5f0643f6717905a05164090dde" ON n8n.project_relation USING btree ("userId");

CREATE UNIQUE INDEX "IDX_60b6a84299eeb3f671dfec7693" ON n8n.insights_by_period USING btree ("periodStart", type, "periodUnit", "metaId");

CREATE INDEX "IDX_61448d56d61802b5dfde5cdb00" ON n8n.project_relation USING btree ("projectId");

CREATE UNIQUE INDEX "IDX_63d7bbae72c767cf162d459fcc" ON n8n.user_api_keys USING btree ("userId", label);

CREATE INDEX "IDX_8e4b4774db42f1e6dda3452b2a" ON n8n.test_case_execution USING btree ("testRunId");

CREATE UNIQUE INDEX "IDX_97f863fa83c4786f1956508496" ON n8n.execution_annotations USING btree ("executionId");

CREATE INDEX "IDX_9acddcb7a2b51fe37669049fc6" ON n8n.chat_message_feedback USING btree ("chatId");

CREATE UNIQUE INDEX "IDX_UniqueRoleDisplayName" ON n8n.role USING btree ("displayName");

CREATE INDEX "IDX_a3697779b366e131b2bbdae297" ON n8n.execution_annotation_tags USING btree ("tagId");

CREATE INDEX "IDX_a4ff2d9b9628ea988fa9e7d0bf" ON n8n.workflow_dependency USING btree ("workflowId");

CREATE UNIQUE INDEX "IDX_ae51b54c4bb430cf92f48b623f" ON n8n.annotation_tag_entity USING btree (name);

CREATE INDEX "IDX_c1519757391996eb06064f0e7c" ON n8n.execution_annotation_tags USING btree ("annotationId");

CREATE UNIQUE INDEX "IDX_cec8eea3bf49551482ccb4933e" ON n8n.execution_metadata USING btree ("executionId", key);

CREATE INDEX "IDX_d6870d3b6e4c185d33926f423c" ON n8n.test_run USING btree ("workflowId");

CREATE INDEX "IDX_e213b811b01405a42309a6a410" ON n8n.document_store_file_chunk USING btree ("storeId");

CREATE INDEX "IDX_e48a201071ab85d9d09119d640" ON n8n.workflow_dependency USING btree ("dependencyKey");

CREATE INDEX "IDX_e574527322272fd838f4f0f3d3" ON n8n.chat_message USING btree (chatflowid);

CREATE INDEX "IDX_e76bae1780b77e56aab1h2asd4" ON n8n.document_store_file_chunk USING btree ("docId");

CREATE INDEX "IDX_e7fe1cfda990c14a445937d0b9" ON n8n.workflow_dependency USING btree ("dependencyType");

CREATE INDEX "IDX_execution_entity_deletedAt" ON n8n.execution_entity USING btree ("deletedAt");

CREATE INDEX "IDX_f56c36fe42894d57e5c664d229" ON n8n.chat_message USING btree (chatflowid);

CREATE INDEX "IDX_f56c36fe42894d57e5c664d230" ON n8n.chat_message_feedback USING btree (chatflowid);

CREATE UNIQUE INDEX "IDX_n8n_a252c527c4c89237221fe2c0ab" ON n8n.n8n_workflow_entity USING btree (name);

CREATE INDEX "IDX_role_scope_scopeSlug" ON n8n.role_scope USING btree ("scopeSlug");

CREATE INDEX "IDX_workflow_entity_name" ON n8n.workflow_entity USING btree (name);

CREATE UNIQUE INDEX "PK_011c050f566e9db509a0fadb9b9" ON n8n.test_run USING btree (id);

CREATE UNIQUE INDEX "PK_08cc9197c39b028c1e9beca225940576fd1a5804" ON n8n.installed_packages USING btree ("packageName");

CREATE UNIQUE INDEX "PK_17a0b6284f8d626aae88e1c16e4" ON n8n.execution_metadata USING btree (id);

CREATE UNIQUE INDEX "PK_1caaa312a5d7184a003be0f0cb6" ON n8n.project_relation USING btree ("projectId", "userId");

CREATE UNIQUE INDEX "PK_1eafef1273c70e4464fec703412" ON n8n.chat_hub_sessions USING btree (id);

CREATE UNIQUE INDEX "PK_27e4e00852f6b06a925a4d83a3e" ON n8n.folder_tag USING btree ("folderId", "tagId");

CREATE UNIQUE INDEX "PK_35c9b140caaf6da09cfabb0d675" ON n8n.role USING btree (slug);

CREATE UNIQUE INDEX "PK_37327b22b6e246319bd5eeb0e88" ON n8n.upsert_history USING btree (id);

CREATE UNIQUE INDEX "PK_3a5169bcd3d5463cefeec78be82" ON n8n.credential USING btree (id);

CREATE UNIQUE INDEX "PK_3bf5b1016a384916073184f99b7" ON n8n.tool USING btree (id);

CREATE UNIQUE INDEX "PK_3c7cea7a044ac4c92764576cdbf" ON n8n.assistant USING btree (id);

CREATE UNIQUE INDEX "PK_3c7cea7d047ac4b91764574cdbf" ON n8n.chat_flow USING btree (id);

CREATE UNIQUE INDEX "PK_3c7cea7d087ac4b91764574cdbf" ON n8n.custom_template USING btree (id);

CREATE UNIQUE INDEX "PK_3cc0d85193aade457d3077dd06b" ON n8n.chat_message USING btree (id);

CREATE UNIQUE INDEX "PK_4d68b1358bb5b766d3e78f32f57" ON n8n.project USING btree (id);

CREATE UNIQUE INDEX "PK_52325e34cd7a2f0f67b0f3cad65" ON n8n.workflow_dependency USING btree (id);

CREATE UNIQUE INDEX "PK_5779069b7235b256d91f7af1a15" ON n8n.invalid_auth_token USING btree (token);

CREATE UNIQUE INDEX "PK_5ba87620386b847201c9531c58f" ON n8n.shared_workflow USING btree ("workflowId", "projectId");

CREATE UNIQUE INDEX "PK_6278a41a706740c94c02e288df8" ON n8n.folder USING btree (id);

CREATE UNIQUE INDEX "PK_673cb121ee4a8a5e27850c72c51" ON n8n.data_table_column USING btree (id);

CREATE UNIQUE INDEX "PK_69dfa041592c30bbc0d4b84aa00" ON n8n.annotation_tag_entity USING btree (id);

CREATE UNIQUE INDEX "PK_74abaed0b30711b6532598b0392" ON n8n.oauth_refresh_tokens USING btree (token);

CREATE UNIQUE INDEX "PK_7704a5add6baed43eef835f0bfb" ON n8n.chat_hub_messages USING btree (id);

CREATE UNIQUE INDEX "PK_7afcf93ffa20c4252869a7c6a23" ON n8n.execution_annotations USING btree (id);

CREATE UNIQUE INDEX "PK_85b9ada746802c8993103470f05" ON n8n.oauth_user_consents USING btree (id);

CREATE UNIQUE INDEX "PK_8c82d7f526340ab734260ea46be" ON n8n.migrations USING btree (id);

CREATE UNIQUE INDEX "PK_8ebd28194e4f792f96b5933423fc439df97d9689" ON n8n.installed_nodes USING btree (name);

CREATE UNIQUE INDEX "PK_8ef3a59796a228913f251779cff" ON n8n.shared_credentials USING btree ("credentialsId", "projectId");

CREATE UNIQUE INDEX "PK_90005043dd774f54-9830ab78f9" ON n8n.document_store_file_chunk USING btree (id);

CREATE UNIQUE INDEX "PK_90016043dd804f55-9830ab97f8" ON n8n.workspace_shared USING btree (id);

CREATE UNIQUE INDEX "PK_90019043dd804f54-9830ab11f8" ON n8n.evaluator USING btree (id);

CREATE UNIQUE INDEX "PK_90c121f77a78a6580e94b794bce" ON n8n.test_case_execution USING btree (id);

CREATE UNIQUE INDEX "PK_91f7b8c9fb325ea62c330b41886" ON n8n.n8n_migrations USING btree (id);

CREATE UNIQUE INDEX "PK_96109043dd704f53-9830ab78f0" ON n8n.apikey USING btree (id);

CREATE UNIQUE INDEX "PK_978fa5caa3468f463dac9d92e69" ON n8n.user_api_keys USING btree (id);

CREATE UNIQUE INDEX "PK_979ec03d31294cca484be65d11f" ON n8n.execution_annotation_tags USING btree ("annotationId", "tagId");

CREATE UNIQUE INDEX "PK_98419043dd704f54-9830ab78f0" ON n8n.lead USING btree (id);

CREATE UNIQUE INDEX "PK_98419043dd704f54-9830ab78f8" ON n8n.variable USING btree (id);

CREATE UNIQUE INDEX "PK_98419043dd704f54-9830ab78f9" ON n8n.chat_message_feedback USING btree (id);

CREATE UNIQUE INDEX "PK_98419043dd804f54-9830ab99f8" ON n8n.dataset USING btree (id);

CREATE UNIQUE INDEX "PK_98488643dd3554f54-9830ab78f9" ON n8n.roles USING btree (id);

CREATE UNIQUE INDEX "PK_98495043dd774f54-9830ab78f9" ON n8n.document_store USING btree (id);

CREATE UNIQUE INDEX "PK_98718943dd804f55-9830ab99f8" ON n8n.workspace_users USING btree (id);

CREATE UNIQUE INDEX "PK_98719043dd804f55-9830ab99f8" ON n8n.workspace USING btree (id);

CREATE UNIQUE INDEX "PK_98909027dd804f54-9840ab99f8" ON n8n.dataset_row USING btree (id);

CREATE UNIQUE INDEX "PK_98989043dd804f54-9830ab99f8" ON n8n.evaluation USING btree (id);

CREATE UNIQUE INDEX "PK_98989927dd804f54-9840ab23f8" ON n8n.evaluation_run USING btree (id);

CREATE UNIQUE INDEX "PK_99619041dd804f00-9830ab99f8" ON n8n.organization USING btree (id);

CREATE UNIQUE INDEX "PK_b21ace2e13596ccd87dc9bf4ea6" ON n8n.webhook_entity USING btree ("webhookPath", method);

CREATE UNIQUE INDEX "PK_b606942249b90cc39b0265f0575" ON n8n.insights_by_period USING btree (id);

CREATE UNIQUE INDEX "PK_b6572dd6173e4cd06fe79937b58" ON n8n.workflow_history USING btree ("versionId");

CREATE UNIQUE INDEX "PK_bfc45df0481abd7f355d6187da1" ON n8n.scope USING btree (slug);

CREATE UNIQUE INDEX "PK_c4759172d3431bae6f04e678e0d" ON n8n.oauth_clients USING btree (id);

CREATE UNIQUE INDEX "PK_c788f7caf88e91e365c97d6d04a" ON n8n.workflow_publish_history USING btree (id);

CREATE UNIQUE INDEX "PK_ca04b9d8dc72de268fe07a65773" ON n8n.processed_data USING btree ("workflowId", context);

CREATE UNIQUE INDEX "PK_dc0fe14e6d9943f268e7b119f69ab8bd" ON n8n.settings USING btree (key);

CREATE UNIQUE INDEX "PK_dcd71f96a5d5f4bf79e67d322bf" ON n8n.oauth_access_tokens USING btree (token);

CREATE UNIQUE INDEX "PK_e226d0001b9e6097cbfe70617cb" ON n8n.data_table USING btree (id);

CREATE UNIQUE INDEX "PK_ea8f538c94b6e352418254ed6474a81f" ON n8n."user" USING btree (id);

CREATE UNIQUE INDEX "PK_ec15125755151e3a7e00e00014f" ON n8n.insights_raw USING btree (id);

CREATE UNIQUE INDEX "PK_f39a3b36bbdf0e2979ddb21cf78" ON n8n.chat_hub_agents USING btree (id);

CREATE UNIQUE INDEX "PK_f448a94c35218b6208ce20cf5a1" ON n8n.insights_metadata USING btree ("metaId");

CREATE UNIQUE INDEX "PK_fb91ab932cfbd694061501cc20f" ON n8n.oauth_authorization_codes USING btree (code);

CREATE UNIQUE INDEX "PK_fc3691585b39408bb0551122af6" ON n8n.binary_data USING btree ("fileId");

CREATE UNIQUE INDEX "PK_n8n_7a50a9b74ae6855c0dcaee25052" ON n8n.n8n_tag_entity USING btree (id);

CREATE UNIQUE INDEX "PK_n8n_a60448a90e51a114e95e2a125b3" ON n8n.n8n_workflows_tags USING btree ("workflowId", "tagId");

CREATE UNIQUE INDEX "PK_n8n_b21ace2e13596ccd87dc9bf4ea6" ON n8n.n8n_webhook_entity USING btree ("webhookPath", method);

CREATE UNIQUE INDEX "PK_role_scope" ON n8n.role_scope USING btree ("roleSlug", "scopeSlug");

CREATE UNIQUE INDEX "UQ_083721d99ce8db4033e2958ebb4" ON n8n.oauth_user_consents USING btree ("userId", "clientId");

CREATE UNIQUE INDEX "UQ_6352078b5a294f2d22179ea7956" ON n8n.chat_message_feedback USING btree ("messageId");

CREATE UNIQUE INDEX "UQ_8082ec4890f892f0bc77473a123" ON n8n.data_table_column USING btree ("dataTableId", name);

CREATE UNIQUE INDEX "UQ_b23096ef747281ac944d28e8b0d" ON n8n.data_table USING btree ("projectId", name);

CREATE UNIQUE INDEX "UQ_e12875dfb3b1d92d7d7c5377e2" ON n8n."user" USING btree (email);

CREATE UNIQUE INDEX auth_identity_pkey ON n8n.auth_identity USING btree ("providerId", "providerType");

CREATE UNIQUE INDEX auth_provider_sync_history_pkey ON n8n.auth_provider_sync_history USING btree (id);

CREATE UNIQUE INDEX credentials_entity_pkey ON n8n.credentials_entity USING btree (id);

CREATE UNIQUE INDEX event_destinations_pkey ON n8n.event_destinations USING btree (id);

CREATE UNIQUE INDEX execution_data_pkey ON n8n.execution_data USING btree ("executionId");

CREATE INDEX idx_07fde106c0b471d8cc80a64fc8 ON n8n.credentials_entity USING btree (type);

CREATE INDEX idx_16f4436789e804e3e1c9eeb240 ON n8n.webhook_entity USING btree ("webhookId", method, "pathLength");

CREATE UNIQUE INDEX idx_812eb05f7451ca757fb98444ce ON n8n.tag_entity USING btree (name);

CREATE INDEX "idx_apikey_workspaceId" ON n8n.apikey USING btree ("workspaceId");

CREATE INDEX "idx_assistant_workspaceId" ON n8n.assistant USING btree ("workspaceId");

CREATE INDEX "idx_chat_flow_workspaceId" ON n8n.chat_flow USING btree ("workspaceId");

CREATE INDEX "idx_credential_workspaceId" ON n8n.credential USING btree ("workspaceId");

CREATE INDEX "idx_custom_template_workspaceId" ON n8n.custom_template USING btree ("workspaceId");

CREATE INDEX "idx_dataset_workspaceId" ON n8n.dataset USING btree ("workspaceId");

CREATE INDEX "idx_document_store_workspaceId" ON n8n.document_store USING btree ("workspaceId");

CREATE INDEX "idx_evaluation_workspaceId" ON n8n.evaluation USING btree ("workspaceId");

CREATE INDEX "idx_evaluator_workspaceId" ON n8n.evaluator USING btree ("workspaceId");

CREATE INDEX idx_execution_entity_stopped_at_status_deleted_at ON n8n.execution_entity USING btree ("stoppedAt", status, "deletedAt") WHERE (("stoppedAt" IS NOT NULL) AND ("deletedAt" IS NULL));

CREATE INDEX idx_execution_entity_wait_till_status_deleted_at ON n8n.execution_entity USING btree ("waitTill", status, "deletedAt") WHERE (("waitTill" IS NOT NULL) AND ("deletedAt" IS NULL));

CREATE INDEX idx_execution_entity_workflow_id_started_at ON n8n.execution_entity USING btree ("workflowId", "startedAt") WHERE (("startedAt" IS NOT NULL) AND ("deletedAt" IS NULL));

CREATE INDEX idx_n8n_07fde106c0b471d8cc80a64fc8 ON n8n.n8n_credentials_entity USING btree (type);

CREATE INDEX idx_n8n_16f4436789e804e3e1c9eeb240 ON n8n.n8n_webhook_entity USING btree ("webhookId", method, "pathLength");

CREATE INDEX idx_n8n_31140eb41f019805b40d008744 ON n8n.n8n_workflows_tags USING btree ("workflowId");

CREATE INDEX idx_n8n_33228da131bb1112247cf52a42 ON n8n.n8n_execution_entity USING btree ("stoppedAt");

CREATE INDEX idx_n8n_5e29bfe9e22c5d6567f509d4a4 ON n8n.n8n_workflows_tags USING btree ("tagId");

CREATE UNIQUE INDEX idx_n8n_812eb05f7451ca757fb98444ce ON n8n.n8n_tag_entity USING btree (name);

CREATE INDEX idx_n8n_c4d999a5e90784e8caccf5589d ON n8n.n8n_execution_entity USING btree ("workflowId");

CREATE INDEX "idx_tool_workspaceId" ON n8n.tool USING btree ("workspaceId");

CREATE INDEX "idx_user_activeWorkspaceId" ON n8n."user" USING btree ("activeWorkspaceId");

CREATE INDEX "idx_variable_workspaceId" ON n8n.variable USING btree ("workspaceId");

CREATE INDEX idx_workflows_tags_workflow_id ON n8n.workflows_tags USING btree ("workflowId");

CREATE INDEX "idx_workspace_organizationId" ON n8n.workspace USING btree ("organizationId");

CREATE INDEX "idx_workspace_shared_workspaceId" ON n8n.workspace_shared USING btree ("workspaceId");

CREATE INDEX "idx_workspace_users_workspaceId" ON n8n.workspace_users USING btree ("workspaceId");

CREATE UNIQUE INDEX pk_credentials_entity_id ON n8n.credentials_entity USING btree (id);

CREATE UNIQUE INDEX pk_e3e63bbf986767844bbe1166d4e ON n8n.execution_entity USING btree (id);

CREATE UNIQUE INDEX pk_n8n_814c3d3c36e8a27fa8edb761b0e ON n8n.n8n_credentials_entity USING btree (id);

CREATE UNIQUE INDEX pk_n8n_e3e63bbf986767844bbe1166d4e ON n8n.n8n_execution_entity USING btree (id);

CREATE UNIQUE INDEX pk_n8n_eded7d72664448da7745d551207 ON n8n.n8n_workflow_entity USING btree (id);

CREATE UNIQUE INDEX pk_tag_entity_id ON n8n.tag_entity USING btree (id);

CREATE UNIQUE INDEX pk_workflow_entity_id ON n8n.workflow_entity USING btree (id);

CREATE UNIQUE INDEX pk_workflow_statistics ON n8n.workflow_statistics USING btree ("workflowId", name);

CREATE UNIQUE INDEX pk_workflows_tags ON n8n.workflows_tags USING btree ("workflowId", "tagId");

CREATE INDEX project_relation_role_idx ON n8n.project_relation USING btree (role);

CREATE INDEX project_relation_role_project_idx ON n8n.project_relation USING btree ("projectId", role);

CREATE UNIQUE INDEX tag_entity_pkey ON n8n.tag_entity USING btree (id);

CREATE INDEX user_role_idx ON n8n."user" USING btree ("roleSlug");

CREATE UNIQUE INDEX variables_global_key_unique ON n8n.variables USING btree (key) WHERE ("projectId" IS NULL);

CREATE UNIQUE INDEX variables_pkey ON n8n.variables USING btree (id);

CREATE UNIQUE INDEX variables_project_key_unique ON n8n.variables USING btree ("projectId", key) WHERE ("projectId" IS NOT NULL);

CREATE UNIQUE INDEX workflow_entity_pkey ON n8n.workflow_entity USING btree (id);

CREATE INDEX "IDX_070b5de842ece9ccdda0d9738b" ON public.workflow_publish_history USING btree ("workflowId", "versionId");

CREATE UNIQUE INDEX "IDX_14f68deffaf858465715995508" ON public.folder USING btree ("projectId", id);

CREATE UNIQUE INDEX "IDX_1d8ab99d5861c9388d2dc1cf73" ON public.insights_metadata USING btree ("workflowId");

CREATE INDEX "IDX_1e31657f5fe46816c34be7c1b4" ON public.workflow_history USING btree ("workflowId");

CREATE UNIQUE INDEX "IDX_1ef35bac35d20bdae979d917a3" ON public.user_api_keys USING btree ("apiKey");

CREATE INDEX "IDX_56900edc3cfd16612e2ef2c6a8" ON public.binary_data USING btree ("sourceType", "sourceId");

CREATE INDEX "IDX_5f0643f6717905a05164090dde" ON public.project_relation USING btree ("userId");

CREATE UNIQUE INDEX "IDX_60b6a84299eeb3f671dfec7693" ON public.insights_by_period USING btree ("periodStart", type, "periodUnit", "metaId");

CREATE INDEX "IDX_61448d56d61802b5dfde5cdb00" ON public.project_relation USING btree ("projectId");

CREATE UNIQUE INDEX "IDX_63d7bbae72c767cf162d459fcc" ON public.user_api_keys USING btree ("userId", label);

CREATE INDEX "IDX_8e4b4774db42f1e6dda3452b2a" ON public.test_case_execution USING btree ("testRunId");

CREATE UNIQUE INDEX "IDX_97f863fa83c4786f1956508496" ON public.execution_annotations USING btree ("executionId");

CREATE INDEX "IDX_99b3e329d13b7bb2fa9b6a43f5" ON public.dynamic_credential_entry USING btree (subject_id);

CREATE INDEX "IDX_9acddcb7a2b51fe37669049fc6" ON public.chat_message_feedback USING btree ("chatId");

CREATE INDEX "IDX_9c9ee9df586e60bb723234e499" ON public.dynamic_credential_resolver USING btree (type);

CREATE UNIQUE INDEX "IDX_UniqueRoleDisplayName" ON public.role USING btree ("displayName");

CREATE INDEX "IDX_a3697779b366e131b2bbdae297" ON public.execution_annotation_tags USING btree ("tagId");

CREATE INDEX "IDX_a4ff2d9b9628ea988fa9e7d0bf" ON public.workflow_dependency USING btree ("workflowId");

CREATE UNIQUE INDEX "IDX_ae51b54c4bb430cf92f48b623f" ON public.annotation_tag_entity USING btree (name);

CREATE INDEX "IDX_c1519757391996eb06064f0e7c" ON public.execution_annotation_tags USING btree ("annotationId");

CREATE UNIQUE INDEX "IDX_cec8eea3bf49551482ccb4933e" ON public.execution_metadata USING btree ("executionId", key);

CREATE INDEX "IDX_chat_hub_messages_sessionId" ON public.chat_hub_messages USING btree ("sessionId");

CREATE INDEX "IDX_chat_hub_sessions_owner_lastmsg_id" ON public.chat_hub_sessions USING btree ("ownerId", "lastMessageAt" DESC, id);

CREATE INDEX "IDX_d57808fe08b77464f6a88a2549" ON public.dynamic_credential_entry USING btree (resolver_id);

CREATE INDEX "IDX_d6870d3b6e4c185d33926f423c" ON public.test_run USING btree ("workflowId");

CREATE INDEX "IDX_e213b811b01405a42309a6a410" ON public.document_store_file_chunk USING btree ("storeId");

CREATE INDEX "IDX_e48a201071ab85d9d09119d640" ON public.workflow_dependency USING btree ("dependencyKey");

CREATE INDEX "IDX_e574527322272fd838f4f0f3d3" ON public.chat_message USING btree (chatflowid);

CREATE INDEX "IDX_e76bae1780b77e56aab1h2asd4" ON public.document_store_file_chunk USING btree ("docId");

CREATE INDEX "IDX_e7fe1cfda990c14a445937d0b9" ON public.workflow_dependency USING btree ("dependencyType");

CREATE INDEX "IDX_execution_entity_deletedAt" ON public.execution_entity USING btree ("deletedAt");

CREATE INDEX "IDX_f56c36fe42894d57e5c664d229" ON public.chat_message USING btree (chatflowid);

CREATE INDEX "IDX_f56c36fe42894d57e5c664d230" ON public.chat_message_feedback USING btree (chatflowid);

CREATE INDEX "IDX_role_scope_scopeSlug" ON public.role_scope USING btree ("scopeSlug");

CREATE INDEX "IDX_workflow_entity_name" ON public.workflow_entity USING btree (name);

CREATE UNIQUE INDEX "IDX_workflow_statistics_workflow_name" ON public.workflow_statistics USING btree ("workflowId", name);

CREATE UNIQUE INDEX "PK_011c050f566e9db509a0fadb9b9" ON public.test_run USING btree (id);

CREATE UNIQUE INDEX "PK_08cc9197c39b028c1e9beca225940576fd1a5804" ON public.installed_packages USING btree ("packageName");

CREATE UNIQUE INDEX "PK_17a0b6284f8d626aae88e1c16e4" ON public.execution_metadata USING btree (id);

CREATE UNIQUE INDEX "PK_1caaa312a5d7184a003be0f0cb6" ON public.project_relation USING btree ("projectId", "userId");

CREATE UNIQUE INDEX "PK_1eafef1273c70e4464fec703412" ON public.chat_hub_sessions USING btree (id);

CREATE UNIQUE INDEX "PK_27e4e00852f6b06a925a4d83a3e" ON public.folder_tag USING btree ("folderId", "tagId");

CREATE UNIQUE INDEX "PK_35c9b140caaf6da09cfabb0d675" ON public.role USING btree (slug);

CREATE UNIQUE INDEX "PK_37327b22b6e246319bd5eeb0e88" ON public.upsert_history USING btree (id);

CREATE UNIQUE INDEX "PK_3a5169bcd3d5463cefeec78be82" ON public.credential USING btree (id);

CREATE UNIQUE INDEX "PK_3bf5b1016a384916073184f99b7" ON public.tool USING btree (id);

CREATE UNIQUE INDEX "PK_3c7cea7a044ac4c92764576cdbf" ON public.assistant USING btree (id);

CREATE UNIQUE INDEX "PK_3c7cea7d047ac4b91764574cdbf" ON public.chat_flow USING btree (id);

CREATE UNIQUE INDEX "PK_3c7cea7d087ac4b91764574cdbf" ON public.custom_template USING btree (id);

CREATE UNIQUE INDEX "PK_3cc0d85193aade457d3077dd06b" ON public.chat_message USING btree (id);

CREATE UNIQUE INDEX "PK_4d68b1358bb5b766d3e78f32f57" ON public.project USING btree (id);

CREATE UNIQUE INDEX "PK_52325e34cd7a2f0f67b0f3cad65" ON public.workflow_dependency USING btree (id);

CREATE UNIQUE INDEX "PK_5779069b7235b256d91f7af1a15" ON public.invalid_auth_token USING btree (token);

CREATE UNIQUE INDEX "PK_5ba87620386b847201c9531c58f" ON public.shared_workflow USING btree ("workflowId", "projectId");

CREATE UNIQUE INDEX "PK_6278a41a706740c94c02e288df8" ON public.folder USING btree (id);

CREATE UNIQUE INDEX "PK_673cb121ee4a8a5e27850c72c51" ON public.data_table_column USING btree (id);

CREATE UNIQUE INDEX "PK_69dfa041592c30bbc0d4b84aa00" ON public.annotation_tag_entity USING btree (id);

CREATE UNIQUE INDEX "PK_74abaed0b30711b6532598b0392" ON public.oauth_refresh_tokens USING btree (token);

CREATE UNIQUE INDEX "PK_7704a5add6baed43eef835f0bfb" ON public.chat_hub_messages USING btree (id);

CREATE UNIQUE INDEX "PK_7afcf93ffa20c4252869a7c6a23" ON public.execution_annotations USING btree (id);

CREATE UNIQUE INDEX "PK_7bc73da3b8be7591696e14809d5" ON public.dynamic_credential_entry USING btree (credential_id, subject_id, resolver_id);

CREATE UNIQUE INDEX "PK_85b9ada746802c8993103470f05" ON public.oauth_user_consents USING btree (id);

CREATE UNIQUE INDEX "PK_8c82d7f526340ab734260ea46be" ON public.migrations USING btree (id);

CREATE UNIQUE INDEX "PK_8ebd28194e4f792f96b5933423fc439df97d9689" ON public.installed_nodes USING btree (name);

CREATE UNIQUE INDEX "PK_8ef3a59796a228913f251779cff" ON public.shared_credentials USING btree ("credentialsId", "projectId");

CREATE UNIQUE INDEX "PK_90005043dd774f54-9830ab78f9" ON public.document_store_file_chunk USING btree (id);

CREATE UNIQUE INDEX "PK_90c121f77a78a6580e94b794bce" ON public.test_case_execution USING btree (id);

CREATE UNIQUE INDEX "PK_96109043dd704f53-9830ab78f0" ON public.apikey USING btree (id);

CREATE UNIQUE INDEX "PK_978fa5caa3468f463dac9d92e69" ON public.user_api_keys USING btree (id);

CREATE UNIQUE INDEX "PK_979ec03d31294cca484be65d11f" ON public.execution_annotation_tags USING btree ("annotationId", "tagId");

CREATE UNIQUE INDEX "PK_98419043dd704f54-9830ab78f0" ON public.lead USING btree (id);

CREATE UNIQUE INDEX "PK_98419043dd704f54-9830ab78f8" ON public.variable USING btree (id);

CREATE UNIQUE INDEX "PK_98419043dd704f54-9830ab78f9" ON public.chat_message_feedback USING btree (id);

CREATE UNIQUE INDEX "PK_98495043dd774f54-9830ab78f9" ON public.document_store USING btree (id);

CREATE UNIQUE INDEX "PK_b21ace2e13596ccd87dc9bf4ea6" ON public.webhook_entity USING btree ("webhookPath", method);

CREATE UNIQUE INDEX "PK_b606942249b90cc39b0265f0575" ON public.insights_by_period USING btree (id);

CREATE UNIQUE INDEX "PK_b6572dd6173e4cd06fe79937b58" ON public.workflow_history USING btree ("versionId");

CREATE UNIQUE INDEX "PK_b76cfb088dcdaf5275e9980bb64" ON public.dynamic_credential_resolver USING btree (id);

CREATE UNIQUE INDEX "PK_bfc45df0481abd7f355d6187da1" ON public.scope USING btree (slug);

CREATE UNIQUE INDEX "PK_c4759172d3431bae6f04e678e0d" ON public.oauth_clients USING btree (id);

CREATE UNIQUE INDEX "PK_c788f7caf88e91e365c97d6d04a" ON public.workflow_publish_history USING btree (id);

CREATE UNIQUE INDEX "PK_ca04b9d8dc72de268fe07a65773" ON public.processed_data USING btree ("workflowId", context);

CREATE UNIQUE INDEX "PK_dc0fe14e6d9943f268e7b119f69ab8bd" ON public.settings USING btree (key);

CREATE UNIQUE INDEX "PK_dcd71f96a5d5f4bf79e67d322bf" ON public.oauth_access_tokens USING btree (token);

CREATE UNIQUE INDEX "PK_e226d0001b9e6097cbfe70617cb" ON public.data_table USING btree (id);

CREATE UNIQUE INDEX "PK_ea8f538c94b6e352418254ed6474a81f" ON public."user" USING btree (id);

CREATE UNIQUE INDEX "PK_ec15125755151e3a7e00e00014f" ON public.insights_raw USING btree (id);

CREATE UNIQUE INDEX "PK_f39a3b36bbdf0e2979ddb21cf78" ON public.chat_hub_agents USING btree (id);

CREATE UNIQUE INDEX "PK_f448a94c35218b6208ce20cf5a1" ON public.insights_metadata USING btree ("metaId");

CREATE UNIQUE INDEX "PK_fb91ab932cfbd694061501cc20f" ON public.oauth_authorization_codes USING btree (code);

CREATE UNIQUE INDEX "PK_fc3691585b39408bb0551122af6" ON public.binary_data USING btree ("fileId");

CREATE UNIQUE INDEX "PK_role_scope" ON public.role_scope USING btree ("roleSlug", "scopeSlug");

CREATE UNIQUE INDEX "UQ_083721d99ce8db4033e2958ebb4" ON public.oauth_user_consents USING btree ("userId", "clientId");

CREATE UNIQUE INDEX "UQ_6352078b5a294f2d22179ea7956" ON public.chat_message_feedback USING btree ("messageId");

CREATE UNIQUE INDEX "UQ_8082ec4890f892f0bc77473a123" ON public.data_table_column USING btree ("dataTableId", name);

CREATE UNIQUE INDEX "UQ_b23096ef747281ac944d28e8b0d" ON public.data_table USING btree ("projectId", name);

CREATE UNIQUE INDEX "UQ_e12875dfb3b1d92d7d7c5377e2" ON public."user" USING btree (email);

CREATE INDEX _i_d_x_e574527322272fd838f4f0f3d3 ON public.chat_message USING btree (chatflowid);

CREATE UNIQUE INDEX ai_agents_pkey ON public.ai_agents USING btree (id);

CREATE UNIQUE INDEX albums_pkey ON public.albums USING btree (id);

CREATE INDEX albums_primary_artist_id_idx ON public.albums USING btree (primary_artist_id);

CREATE UNIQUE INDEX analytics_pkey ON public.analytics USING btree (id);

CREATE UNIQUE INDEX artists_name_key ON public.artists USING btree (name);

CREATE UNIQUE INDEX artists_pkey ON public.artists USING btree (id);

CREATE UNIQUE INDEX auth_identity_pkey ON public.auth_identity USING btree ("providerId", "providerType");

CREATE UNIQUE INDEX auth_provider_sync_history_pkey ON public.auth_provider_sync_history USING btree (id);

CREATE UNIQUE INDEX conversations_pkey ON public.conversations USING btree (id);

CREATE UNIQUE INDEX credentials_entity_pkey ON public.credentials_entity USING btree (id);

CREATE UNIQUE INDEX customers_pkey ON public.customers USING btree (id);

CREATE UNIQUE INDEX documents_pkey ON public.documents USING btree (id);

CREATE UNIQUE INDEX event_destinations_pkey ON public.event_destinations USING btree (id);

CREATE UNIQUE INDEX execution_data_pkey ON public.execution_data USING btree ("executionId");

CREATE UNIQUE INDEX fragrance_blends_pkey ON public.fragrance_blends USING btree (id);

CREATE UNIQUE INDEX fragrance_oils_pkey ON public.fragrance_oils USING btree (id);

CREATE UNIQUE INDEX fragrance_oils_url_key ON public.fragrance_oils USING btree (url);

CREATE UNIQUE INDEX fragrance_reviews_pkey ON public.fragrance_reviews USING btree (id);

CREATE INDEX idx_07fde106c0b471d8cc80a64fc8 ON public.credentials_entity USING btree (type);

CREATE INDEX idx_16f4436789e804e3e1c9eeb240 ON public.webhook_entity USING btree ("webhookId", method, "pathLength");

CREATE UNIQUE INDEX idx_812eb05f7451ca757fb98444ce ON public.tag_entity USING btree (name);

CREATE INDEX idx_execution_entity_stopped_at_status_deleted_at ON public.execution_entity USING btree ("stoppedAt", status, "deletedAt") WHERE (("stoppedAt" IS NOT NULL) AND ("deletedAt" IS NULL));

CREATE INDEX idx_execution_entity_wait_till_status_deleted_at ON public.execution_entity USING btree ("waitTill", status, "deletedAt") WHERE (("waitTill" IS NOT NULL) AND ("deletedAt" IS NULL));

CREATE INDEX idx_execution_entity_workflow_id_started_at ON public.execution_entity USING btree ("workflowId", "startedAt") WHERE (("startedAt" IS NOT NULL) AND ("deletedAt" IS NULL));

CREATE INDEX idx_fragrance_blends_fragrance_id ON public.fragrance_blends USING btree (fragrance_oil_id);

CREATE INDEX idx_fragrance_oils_base_notes ON public.fragrance_oils USING gin (base_notes);

CREATE INDEX idx_fragrance_oils_category ON public.fragrance_oils USING gin (category);

CREATE INDEX idx_fragrance_oils_middle_notes ON public.fragrance_oils USING gin (middle_notes);

CREATE INDEX idx_fragrance_oils_name ON public.fragrance_oils USING btree (name);

CREATE INDEX idx_fragrance_oils_natural_oils ON public.fragrance_oils USING gin (natural_essential_oils);

CREATE INDEX idx_fragrance_oils_pricing_variants ON public.fragrance_oils USING gin (pricing_variants);

CREATE INDEX idx_fragrance_oils_rating ON public.fragrance_oils USING btree (rating);

CREATE INDEX idx_fragrance_oils_top_notes ON public.fragrance_oils USING gin (top_notes);

CREATE INDEX idx_fragrance_oils_url ON public.fragrance_oils USING btree (url);

CREATE INDEX idx_fragrance_reviews_fragrance_id ON public.fragrance_reviews USING btree (fragrance_oil_id);

CREATE INDEX idx_fragrance_reviews_rating ON public.fragrance_reviews USING btree (rating);

CREATE INDEX idx_pending_logins_expires_at ON public.pending_logins USING btree (expires_at);

CREATE INDEX idx_pending_logins_short_code ON public.pending_logins USING btree (short_code);

CREATE INDEX idx_spotify_recommendations_fragrance_blend ON public.spotify_recommendations USING btree (fragrance_blend_id);

CREATE INDEX idx_spotify_recommendations_fragrance_oil ON public.spotify_recommendations USING btree (fragrance_oil_id);

CREATE INDEX idx_spotify_recommendations_track ON public.spotify_recommendations USING btree (spotify_track_id);

CREATE INDEX idx_workflows_tags_workflow_id ON public.workflows_tags USING btree ("workflowId");

CREATE UNIQUE INDEX liked_navidrome_tracks_pkey ON public.liked_navidrome_tracks USING btree (user_id, navidrome_track_id);

CREATE UNIQUE INDEX liked_songs_pkey ON public.liked_songs USING btree (user_id, song_id);

CREATE UNIQUE INDEX likes_pkey ON public.likes USING btree (id);

CREATE UNIQUE INDEX likes_unique_playlist ON public.likes USING btree (user_id, playlist_id);

CREATE UNIQUE INDEX likes_unique_track ON public.likes USING btree (user_id, track_id);

CREATE INDEX likes_user_id_idx ON public.likes USING btree (user_id);

CREATE UNIQUE INDEX listening_history_pkey ON public.listening_history USING btree (id);

CREATE INDEX listening_history_played_at_idx ON public.listening_history USING btree (played_at DESC);

CREATE INDEX listening_history_user_id_idx ON public.listening_history USING btree (user_id);

CREATE UNIQUE INDEX messages_pkey ON public.messages USING btree (id);

CREATE INDEX music_requests_created_at_idx ON public.music_requests USING btree (created_at DESC);

CREATE UNIQUE INDEX music_requests_pkey ON public.music_requests USING btree (id);

CREATE INDEX music_requests_user_id_idx ON public.music_requests USING btree (user_id);

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

CREATE UNIQUE INDEX ollama_documents_pkey ON public.ollama_documents USING btree (id);

CREATE UNIQUE INDEX pending_logins_pkey ON public.pending_logins USING btree (id);

CREATE UNIQUE INDEX pending_logins_short_code_key ON public.pending_logins USING btree (short_code);

CREATE UNIQUE INDEX pk_credentials_entity_id ON public.credentials_entity USING btree (id);

CREATE UNIQUE INDEX pk_e3e63bbf986767844bbe1166d4e ON public.execution_entity USING btree (id);

CREATE UNIQUE INDEX pk_tag_entity_id ON public.tag_entity USING btree (id);

CREATE UNIQUE INDEX pk_workflow_entity_id ON public.workflow_entity USING btree (id);

CREATE UNIQUE INDEX pk_workflows_tags ON public.workflows_tags USING btree ("workflowId", "tagId");

CREATE UNIQUE INDEX playlist_tracks_pkey ON public.playlist_tracks USING btree (playlist_id, track_id);

CREATE INDEX playlist_tracks_playlist_id_idx ON public.playlist_tracks USING btree (playlist_id);

CREATE INDEX playlist_tracks_track_id_idx ON public.playlist_tracks USING btree (track_id);

CREATE INDEX playlists_owner_id_idx ON public.playlists USING btree (owner_id);

CREATE UNIQUE INDEX playlists_pkey ON public.playlists USING btree (id);

CREATE UNIQUE INDEX prices_pkey ON public.prices USING btree (id);

CREATE UNIQUE INDEX products_pkey ON public.products USING btree (id);

CREATE UNIQUE INDEX profiles_email_key ON public.profiles USING btree (email);

CREATE UNIQUE INDEX profiles_handle_unique ON public.profiles USING btree (handle) WHERE (handle IS NOT NULL);

CREATE UNIQUE INDEX profiles_username_key ON public.profiles USING btree (username);

CREATE INDEX project_relation_role_idx ON public.project_relation USING btree (role);

CREATE INDEX project_relation_role_project_idx ON public.project_relation USING btree ("projectId", role);

CREATE UNIQUE INDEX songs_pkey ON public.songs USING btree (id);

CREATE UNIQUE INDEX spotify_recommendations_pkey ON public.spotify_recommendations USING btree (id);

CREATE UNIQUE INDEX subscriptions_pkey ON public.subscriptions USING btree (id);

CREATE UNIQUE INDEX tag_entity_pkey ON public.tag_entity USING btree (id);

CREATE INDEX track_artists_artist_id_idx ON public.track_artists USING btree (artist_id);

CREATE UNIQUE INDEX track_artists_pkey ON public.track_artists USING btree (track_id, artist_id);

CREATE INDEX track_artists_track_id_idx ON public.track_artists USING btree (track_id);

CREATE INDEX tracks_album_id_idx ON public.tracks USING btree (album_id);

CREATE INDEX tracks_navidrome_track_id_idx ON public.tracks USING btree (navidrome_track_id) WHERE (navidrome_track_id IS NOT NULL);

CREATE UNIQUE INDEX tracks_navidrome_track_id_key ON public.tracks USING btree (navidrome_track_id) WHERE (navidrome_track_id IS NOT NULL);

CREATE UNIQUE INDEX tracks_pkey ON public.tracks USING btree (id);

CREATE INDEX user_role_idx ON public."user" USING btree ("roleSlug");

CREATE UNIQUE INDEX user_settings_pkey ON public.user_settings USING btree (user_id);

CREATE UNIQUE INDEX user_spotify_tokens_pkey ON public.user_spotify_tokens USING btree (user_id);

CREATE UNIQUE INDEX users_pkey ON public.users USING btree (id);

CREATE UNIQUE INDEX variables_global_key_unique ON public.variables USING btree (key) WHERE ("projectId" IS NULL);

CREATE UNIQUE INDEX variables_pkey ON public.variables USING btree (id);

CREATE UNIQUE INDEX variables_project_key_unique ON public.variables USING btree ("projectId", key) WHERE ("projectId" IS NOT NULL);

CREATE UNIQUE INDEX workflow_entity_pkey ON public.workflow_entity USING btree (id);

CREATE UNIQUE INDEX workflow_statistics_pkey ON public.workflow_statistics USING btree (id);

CREATE UNIQUE INDEX _migrations_name_key ON stripe._migrations USING btree (name);

CREATE UNIQUE INDEX _migrations_pkey ON stripe._migrations USING btree (id);

CREATE UNIQUE INDEX _sync_obj_run_pkey ON stripe._sync_obj_runs USING btree (_account_id, run_started_at, object);

CREATE UNIQUE INDEX _sync_run_pkey ON stripe._sync_runs USING btree (_account_id, started_at);

CREATE UNIQUE INDEX accounts_pkey ON stripe.accounts USING btree (id);

CREATE UNIQUE INDEX active_entitlements_lookup_key_key ON stripe.active_entitlements USING btree (lookup_key) WHERE (lookup_key IS NOT NULL);

CREATE UNIQUE INDEX active_entitlements_pkey ON stripe.active_entitlements USING btree (id);

CREATE UNIQUE INDEX charges_pkey ON stripe.charges USING btree (id);

CREATE UNIQUE INDEX checkout_session_line_items_pkey ON stripe.checkout_session_line_items USING btree (id);

CREATE UNIQUE INDEX checkout_sessions_pkey ON stripe.checkout_sessions USING btree (id);

CREATE UNIQUE INDEX coupons_pkey ON stripe.coupons USING btree (id);

CREATE UNIQUE INDEX credit_notes_pkey ON stripe.credit_notes USING btree (id);

CREATE UNIQUE INDEX customers_pkey ON stripe.customers USING btree (id);

CREATE UNIQUE INDEX disputes_pkey ON stripe.disputes USING btree (id);

CREATE UNIQUE INDEX early_fraud_warnings_pkey ON stripe.early_fraud_warnings USING btree (id);

CREATE UNIQUE INDEX events_pkey ON stripe.events USING btree (id);

CREATE UNIQUE INDEX exchange_rates_from_usd_pkey ON stripe.exchange_rates_from_usd USING btree (_account_id, date, sell_currency);

CREATE UNIQUE INDEX features_lookup_key_key ON stripe.features USING btree (lookup_key) WHERE (lookup_key IS NOT NULL);

CREATE UNIQUE INDEX features_pkey ON stripe.features USING btree (id);

CREATE INDEX idx_accounts_api_key_hashes ON stripe.accounts USING gin (api_key_hashes);

CREATE INDEX idx_accounts_business_name ON stripe.accounts USING btree (business_name);

CREATE INDEX idx_exchange_rates_from_usd_date ON stripe.exchange_rates_from_usd USING btree (date);

CREATE INDEX idx_exchange_rates_from_usd_sell_currency ON stripe.exchange_rates_from_usd USING btree (sell_currency);

CREATE INDEX idx_sync_obj_runs_status ON stripe._sync_obj_runs USING btree (_account_id, run_started_at, status);

CREATE INDEX idx_sync_runs_account_status ON stripe._sync_runs USING btree (_account_id, closed_at);

CREATE UNIQUE INDEX invoices_pkey ON stripe.invoices USING btree (id);

CREATE UNIQUE INDEX managed_webhooks_pkey ON stripe._managed_webhooks USING btree (id);

CREATE UNIQUE INDEX managed_webhooks_url_account_unique ON stripe._managed_webhooks USING btree (url, account_id);

select 1; 
-- CREATE INDEX one_active_run_per_account ON stripe._sync_runs USING btree (_account_id) WHERE (closed_at IS NULL);

CREATE UNIQUE INDEX payment_intents_pkey ON stripe.payment_intents USING btree (id);

CREATE UNIQUE INDEX payment_methods_pkey ON stripe.payment_methods USING btree (id);

CREATE UNIQUE INDEX payouts_pkey ON stripe.payouts USING btree (id);

CREATE UNIQUE INDEX plans_pkey ON stripe.plans USING btree (id);

CREATE UNIQUE INDEX prices_pkey ON stripe.prices USING btree (id);

CREATE UNIQUE INDEX products_pkey ON stripe.products USING btree (id);

CREATE UNIQUE INDEX refunds_pkey ON stripe.refunds USING btree (id);

CREATE UNIQUE INDEX reviews_pkey ON stripe.reviews USING btree (id);

CREATE UNIQUE INDEX setup_intents_pkey ON stripe.setup_intents USING btree (id);

CREATE INDEX stripe_active_entitlements_customer_idx ON stripe.active_entitlements USING btree (customer);

CREATE INDEX stripe_active_entitlements_feature_idx ON stripe.active_entitlements USING btree (feature);

CREATE INDEX stripe_checkout_session_line_items_price_idx ON stripe.checkout_session_line_items USING btree (price);

CREATE INDEX stripe_checkout_session_line_items_session_idx ON stripe.checkout_session_line_items USING btree (checkout_session);

CREATE INDEX stripe_checkout_sessions_customer_idx ON stripe.checkout_sessions USING btree (customer);

CREATE INDEX stripe_checkout_sessions_invoice_idx ON stripe.checkout_sessions USING btree (invoice);

CREATE INDEX stripe_checkout_sessions_payment_intent_idx ON stripe.checkout_sessions USING btree (payment_intent);

CREATE INDEX stripe_checkout_sessions_subscription_idx ON stripe.checkout_sessions USING btree (subscription);

CREATE INDEX stripe_credit_notes_customer_idx ON stripe.credit_notes USING btree (customer);

CREATE INDEX stripe_credit_notes_invoice_idx ON stripe.credit_notes USING btree (invoice);

CREATE INDEX stripe_dispute_created_idx ON stripe.disputes USING btree (created);

CREATE INDEX stripe_early_fraud_warnings_charge_idx ON stripe.early_fraud_warnings USING btree (charge);

CREATE INDEX stripe_early_fraud_warnings_payment_intent_idx ON stripe.early_fraud_warnings USING btree (payment_intent);

CREATE INDEX stripe_invoices_customer_idx ON stripe.invoices USING btree (customer);

CREATE INDEX stripe_invoices_subscription_idx ON stripe.invoices USING btree (subscription);

CREATE INDEX stripe_managed_webhooks_enabled_idx ON stripe._managed_webhooks USING btree (enabled);

CREATE INDEX stripe_managed_webhooks_status_idx ON stripe._managed_webhooks USING btree (status);

CREATE INDEX stripe_payment_intents_customer_idx ON stripe.payment_intents USING btree (customer);

CREATE INDEX stripe_payment_intents_invoice_idx ON stripe.payment_intents USING btree (invoice);

CREATE INDEX stripe_payment_methods_customer_idx ON stripe.payment_methods USING btree (customer);

CREATE INDEX stripe_refunds_charge_idx ON stripe.refunds USING btree (charge);

CREATE INDEX stripe_refunds_payment_intent_idx ON stripe.refunds USING btree (payment_intent);

CREATE INDEX stripe_reviews_charge_idx ON stripe.reviews USING btree (charge);

CREATE INDEX stripe_reviews_payment_intent_idx ON stripe.reviews USING btree (payment_intent);

CREATE INDEX stripe_setup_intents_customer_idx ON stripe.setup_intents USING btree (customer);

CREATE INDEX stripe_tax_ids_customer_idx ON stripe.tax_ids USING btree (customer);

CREATE UNIQUE INDEX subscription_item_change_events_v2_beta_pkey ON stripe.subscription_item_change_events_v2_beta USING btree (_account_id, event_timestamp, event_type, subscription_item_id);

CREATE UNIQUE INDEX subscription_items_pkey ON stripe.subscription_items USING btree (id);

CREATE UNIQUE INDEX subscription_schedules_pkey ON stripe.subscription_schedules USING btree (id);

CREATE UNIQUE INDEX subscriptions_pkey ON stripe.subscriptions USING btree (id);

CREATE UNIQUE INDEX tax_ids_pkey ON stripe.tax_ids USING btree (id);

alter table "n8n"."annotation_tag_entity" add constraint "PK_69dfa041592c30bbc0d4b84aa00" PRIMARY KEY using index "PK_69dfa041592c30bbc0d4b84aa00";

alter table "n8n"."apikey" add constraint "PK_96109043dd704f53-9830ab78f0" PRIMARY KEY using index "PK_96109043dd704f53-9830ab78f0";

alter table "n8n"."assistant" add constraint "PK_3c7cea7a044ac4c92764576cdbf" PRIMARY KEY using index "PK_3c7cea7a044ac4c92764576cdbf";

alter table "n8n"."auth_identity" add constraint "auth_identity_pkey" PRIMARY KEY using index "auth_identity_pkey";

alter table "n8n"."auth_provider_sync_history" add constraint "auth_provider_sync_history_pkey" PRIMARY KEY using index "auth_provider_sync_history_pkey";

alter table "n8n"."binary_data" add constraint "PK_fc3691585b39408bb0551122af6" PRIMARY KEY using index "PK_fc3691585b39408bb0551122af6";

alter table "n8n"."chat_flow" add constraint "PK_3c7cea7d047ac4b91764574cdbf" PRIMARY KEY using index "PK_3c7cea7d047ac4b91764574cdbf";

alter table "n8n"."chat_hub_agents" add constraint "PK_f39a3b36bbdf0e2979ddb21cf78" PRIMARY KEY using index "PK_f39a3b36bbdf0e2979ddb21cf78";

alter table "n8n"."chat_hub_messages" add constraint "PK_7704a5add6baed43eef835f0bfb" PRIMARY KEY using index "PK_7704a5add6baed43eef835f0bfb";

alter table "n8n"."chat_hub_sessions" add constraint "PK_1eafef1273c70e4464fec703412" PRIMARY KEY using index "PK_1eafef1273c70e4464fec703412";

alter table "n8n"."chat_message" add constraint "PK_3cc0d85193aade457d3077dd06b" PRIMARY KEY using index "PK_3cc0d85193aade457d3077dd06b";

alter table "n8n"."chat_message_feedback" add constraint "PK_98419043dd704f54-9830ab78f9" PRIMARY KEY using index "PK_98419043dd704f54-9830ab78f9";

alter table "n8n"."credential" add constraint "PK_3a5169bcd3d5463cefeec78be82" PRIMARY KEY using index "PK_3a5169bcd3d5463cefeec78be82";

alter table "n8n"."credentials_entity" add constraint "credentials_entity_pkey" PRIMARY KEY using index "credentials_entity_pkey";

alter table "n8n"."custom_template" add constraint "PK_3c7cea7d087ac4b91764574cdbf" PRIMARY KEY using index "PK_3c7cea7d087ac4b91764574cdbf";

alter table "n8n"."data_table" add constraint "PK_e226d0001b9e6097cbfe70617cb" PRIMARY KEY using index "PK_e226d0001b9e6097cbfe70617cb";

alter table "n8n"."data_table_column" add constraint "PK_673cb121ee4a8a5e27850c72c51" PRIMARY KEY using index "PK_673cb121ee4a8a5e27850c72c51";

alter table "n8n"."dataset" add constraint "PK_98419043dd804f54-9830ab99f8" PRIMARY KEY using index "PK_98419043dd804f54-9830ab99f8";

alter table "n8n"."dataset_row" add constraint "PK_98909027dd804f54-9840ab99f8" PRIMARY KEY using index "PK_98909027dd804f54-9840ab99f8";

alter table "n8n"."document_store" add constraint "PK_98495043dd774f54-9830ab78f9" PRIMARY KEY using index "PK_98495043dd774f54-9830ab78f9";

alter table "n8n"."document_store_file_chunk" add constraint "PK_90005043dd774f54-9830ab78f9" PRIMARY KEY using index "PK_90005043dd774f54-9830ab78f9";

alter table "n8n"."evaluation" add constraint "PK_98989043dd804f54-9830ab99f8" PRIMARY KEY using index "PK_98989043dd804f54-9830ab99f8";

alter table "n8n"."evaluation_run" add constraint "PK_98989927dd804f54-9840ab23f8" PRIMARY KEY using index "PK_98989927dd804f54-9840ab23f8";

alter table "n8n"."evaluator" add constraint "PK_90019043dd804f54-9830ab11f8" PRIMARY KEY using index "PK_90019043dd804f54-9830ab11f8";

alter table "n8n"."event_destinations" add constraint "event_destinations_pkey" PRIMARY KEY using index "event_destinations_pkey";

alter table "n8n"."execution_annotation_tags" add constraint "PK_979ec03d31294cca484be65d11f" PRIMARY KEY using index "PK_979ec03d31294cca484be65d11f";

alter table "n8n"."execution_annotations" add constraint "PK_7afcf93ffa20c4252869a7c6a23" PRIMARY KEY using index "PK_7afcf93ffa20c4252869a7c6a23";

alter table "n8n"."execution_data" add constraint "execution_data_pkey" PRIMARY KEY using index "execution_data_pkey";

alter table "n8n"."execution_entity" add constraint "pk_e3e63bbf986767844bbe1166d4e" PRIMARY KEY using index "pk_e3e63bbf986767844bbe1166d4e";

alter table "n8n"."execution_metadata" add constraint "PK_17a0b6284f8d626aae88e1c16e4" PRIMARY KEY using index "PK_17a0b6284f8d626aae88e1c16e4";

alter table "n8n"."folder" add constraint "PK_6278a41a706740c94c02e288df8" PRIMARY KEY using index "PK_6278a41a706740c94c02e288df8";

alter table "n8n"."folder_tag" add constraint "PK_27e4e00852f6b06a925a4d83a3e" PRIMARY KEY using index "PK_27e4e00852f6b06a925a4d83a3e";

alter table "n8n"."insights_by_period" add constraint "PK_b606942249b90cc39b0265f0575" PRIMARY KEY using index "PK_b606942249b90cc39b0265f0575";

alter table "n8n"."insights_metadata" add constraint "PK_f448a94c35218b6208ce20cf5a1" PRIMARY KEY using index "PK_f448a94c35218b6208ce20cf5a1";

alter table "n8n"."insights_raw" add constraint "PK_ec15125755151e3a7e00e00014f" PRIMARY KEY using index "PK_ec15125755151e3a7e00e00014f";

alter table "n8n"."installed_nodes" add constraint "PK_8ebd28194e4f792f96b5933423fc439df97d9689" PRIMARY KEY using index "PK_8ebd28194e4f792f96b5933423fc439df97d9689";

alter table "n8n"."installed_packages" add constraint "PK_08cc9197c39b028c1e9beca225940576fd1a5804" PRIMARY KEY using index "PK_08cc9197c39b028c1e9beca225940576fd1a5804";

alter table "n8n"."invalid_auth_token" add constraint "PK_5779069b7235b256d91f7af1a15" PRIMARY KEY using index "PK_5779069b7235b256d91f7af1a15";

alter table "n8n"."lead" add constraint "PK_98419043dd704f54-9830ab78f0" PRIMARY KEY using index "PK_98419043dd704f54-9830ab78f0";

alter table "n8n"."migrations" add constraint "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY using index "PK_8c82d7f526340ab734260ea46be";

alter table "n8n"."n8n_credentials_entity" add constraint "pk_n8n_814c3d3c36e8a27fa8edb761b0e" PRIMARY KEY using index "pk_n8n_814c3d3c36e8a27fa8edb761b0e";

alter table "n8n"."n8n_execution_entity" add constraint "pk_n8n_e3e63bbf986767844bbe1166d4e" PRIMARY KEY using index "pk_n8n_e3e63bbf986767844bbe1166d4e";

alter table "n8n"."n8n_migrations" add constraint "PK_91f7b8c9fb325ea62c330b41886" PRIMARY KEY using index "PK_91f7b8c9fb325ea62c330b41886";

alter table "n8n"."n8n_tag_entity" add constraint "PK_n8n_7a50a9b74ae6855c0dcaee25052" PRIMARY KEY using index "PK_n8n_7a50a9b74ae6855c0dcaee25052";

alter table "n8n"."n8n_webhook_entity" add constraint "PK_n8n_b21ace2e13596ccd87dc9bf4ea6" PRIMARY KEY using index "PK_n8n_b21ace2e13596ccd87dc9bf4ea6";

alter table "n8n"."n8n_workflow_entity" add constraint "pk_n8n_eded7d72664448da7745d551207" PRIMARY KEY using index "pk_n8n_eded7d72664448da7745d551207";

alter table "n8n"."n8n_workflows_tags" add constraint "PK_n8n_a60448a90e51a114e95e2a125b3" PRIMARY KEY using index "PK_n8n_a60448a90e51a114e95e2a125b3";

alter table "n8n"."oauth_access_tokens" add constraint "PK_dcd71f96a5d5f4bf79e67d322bf" PRIMARY KEY using index "PK_dcd71f96a5d5f4bf79e67d322bf";

alter table "n8n"."oauth_authorization_codes" add constraint "PK_fb91ab932cfbd694061501cc20f" PRIMARY KEY using index "PK_fb91ab932cfbd694061501cc20f";

alter table "n8n"."oauth_clients" add constraint "PK_c4759172d3431bae6f04e678e0d" PRIMARY KEY using index "PK_c4759172d3431bae6f04e678e0d";

alter table "n8n"."oauth_refresh_tokens" add constraint "PK_74abaed0b30711b6532598b0392" PRIMARY KEY using index "PK_74abaed0b30711b6532598b0392";

alter table "n8n"."oauth_user_consents" add constraint "PK_85b9ada746802c8993103470f05" PRIMARY KEY using index "PK_85b9ada746802c8993103470f05";

alter table "n8n"."organization" add constraint "PK_99619041dd804f00-9830ab99f8" PRIMARY KEY using index "PK_99619041dd804f00-9830ab99f8";

alter table "n8n"."processed_data" add constraint "PK_ca04b9d8dc72de268fe07a65773" PRIMARY KEY using index "PK_ca04b9d8dc72de268fe07a65773";

alter table "n8n"."project" add constraint "PK_4d68b1358bb5b766d3e78f32f57" PRIMARY KEY using index "PK_4d68b1358bb5b766d3e78f32f57";

alter table "n8n"."project_relation" add constraint "PK_1caaa312a5d7184a003be0f0cb6" PRIMARY KEY using index "PK_1caaa312a5d7184a003be0f0cb6";

alter table "n8n"."role" add constraint "PK_35c9b140caaf6da09cfabb0d675" PRIMARY KEY using index "PK_35c9b140caaf6da09cfabb0d675";

alter table "n8n"."role_scope" add constraint "PK_role_scope" PRIMARY KEY using index "PK_role_scope";

alter table "n8n"."roles" add constraint "PK_98488643dd3554f54-9830ab78f9" PRIMARY KEY using index "PK_98488643dd3554f54-9830ab78f9";

alter table "n8n"."scope" add constraint "PK_bfc45df0481abd7f355d6187da1" PRIMARY KEY using index "PK_bfc45df0481abd7f355d6187da1";

alter table "n8n"."settings" add constraint "PK_dc0fe14e6d9943f268e7b119f69ab8bd" PRIMARY KEY using index "PK_dc0fe14e6d9943f268e7b119f69ab8bd";

alter table "n8n"."shared_credentials" add constraint "PK_8ef3a59796a228913f251779cff" PRIMARY KEY using index "PK_8ef3a59796a228913f251779cff";

alter table "n8n"."shared_workflow" add constraint "PK_5ba87620386b847201c9531c58f" PRIMARY KEY using index "PK_5ba87620386b847201c9531c58f";

alter table "n8n"."tag_entity" add constraint "tag_entity_pkey" PRIMARY KEY using index "tag_entity_pkey";

alter table "n8n"."test_case_execution" add constraint "PK_90c121f77a78a6580e94b794bce" PRIMARY KEY using index "PK_90c121f77a78a6580e94b794bce";

alter table "n8n"."test_run" add constraint "PK_011c050f566e9db509a0fadb9b9" PRIMARY KEY using index "PK_011c050f566e9db509a0fadb9b9";

alter table "n8n"."tool" add constraint "PK_3bf5b1016a384916073184f99b7" PRIMARY KEY using index "PK_3bf5b1016a384916073184f99b7";

alter table "n8n"."upsert_history" add constraint "PK_37327b22b6e246319bd5eeb0e88" PRIMARY KEY using index "PK_37327b22b6e246319bd5eeb0e88";

alter table "n8n"."user" add constraint "PK_ea8f538c94b6e352418254ed6474a81f" PRIMARY KEY using index "PK_ea8f538c94b6e352418254ed6474a81f";

alter table "n8n"."user_api_keys" add constraint "PK_978fa5caa3468f463dac9d92e69" PRIMARY KEY using index "PK_978fa5caa3468f463dac9d92e69";

alter table "n8n"."variable" add constraint "PK_98419043dd704f54-9830ab78f8" PRIMARY KEY using index "PK_98419043dd704f54-9830ab78f8";

alter table "n8n"."variables" add constraint "variables_pkey" PRIMARY KEY using index "variables_pkey";

alter table "n8n"."webhook_entity" add constraint "PK_b21ace2e13596ccd87dc9bf4ea6" PRIMARY KEY using index "PK_b21ace2e13596ccd87dc9bf4ea6";

alter table "n8n"."workflow_dependency" add constraint "PK_52325e34cd7a2f0f67b0f3cad65" PRIMARY KEY using index "PK_52325e34cd7a2f0f67b0f3cad65";

alter table "n8n"."workflow_entity" add constraint "workflow_entity_pkey" PRIMARY KEY using index "workflow_entity_pkey";

alter table "n8n"."workflow_history" add constraint "PK_b6572dd6173e4cd06fe79937b58" PRIMARY KEY using index "PK_b6572dd6173e4cd06fe79937b58";

alter table "n8n"."workflow_publish_history" add constraint "PK_c788f7caf88e91e365c97d6d04a" PRIMARY KEY using index "PK_c788f7caf88e91e365c97d6d04a";

alter table "n8n"."workflow_statistics" add constraint "pk_workflow_statistics" PRIMARY KEY using index "pk_workflow_statistics";

alter table "n8n"."workflows_tags" add constraint "pk_workflows_tags" PRIMARY KEY using index "pk_workflows_tags";

alter table "n8n"."workspace" add constraint "PK_98719043dd804f55-9830ab99f8" PRIMARY KEY using index "PK_98719043dd804f55-9830ab99f8";

alter table "n8n"."workspace_shared" add constraint "PK_90016043dd804f55-9830ab97f8" PRIMARY KEY using index "PK_90016043dd804f55-9830ab97f8";

alter table "n8n"."workspace_users" add constraint "PK_98718943dd804f55-9830ab99f8" PRIMARY KEY using index "PK_98718943dd804f55-9830ab99f8";

alter table "public"."ai_agents" add constraint "ai_agents_pkey" PRIMARY KEY using index "ai_agents_pkey";

alter table "public"."albums" add constraint "albums_pkey" PRIMARY KEY using index "albums_pkey";

alter table "public"."analytics" add constraint "analytics_pkey" PRIMARY KEY using index "analytics_pkey";

alter table "public"."annotation_tag_entity" add constraint "PK_69dfa041592c30bbc0d4b84aa00" PRIMARY KEY using index "PK_69dfa041592c30bbc0d4b84aa00";

alter table "public"."apikey" add constraint "PK_96109043dd704f53-9830ab78f0" PRIMARY KEY using index "PK_96109043dd704f53-9830ab78f0";

alter table "public"."artists" add constraint "artists_pkey" PRIMARY KEY using index "artists_pkey";

alter table "public"."assistant" add constraint "PK_3c7cea7a044ac4c92764576cdbf" PRIMARY KEY using index "PK_3c7cea7a044ac4c92764576cdbf";

alter table "public"."auth_identity" add constraint "auth_identity_pkey" PRIMARY KEY using index "auth_identity_pkey";

alter table "public"."auth_provider_sync_history" add constraint "auth_provider_sync_history_pkey" PRIMARY KEY using index "auth_provider_sync_history_pkey";

alter table "public"."binary_data" add constraint "PK_fc3691585b39408bb0551122af6" PRIMARY KEY using index "PK_fc3691585b39408bb0551122af6";

alter table "public"."chat_flow" add constraint "PK_3c7cea7d047ac4b91764574cdbf" PRIMARY KEY using index "PK_3c7cea7d047ac4b91764574cdbf";

alter table "public"."chat_hub_agents" add constraint "PK_f39a3b36bbdf0e2979ddb21cf78" PRIMARY KEY using index "PK_f39a3b36bbdf0e2979ddb21cf78";

alter table "public"."chat_hub_messages" add constraint "PK_7704a5add6baed43eef835f0bfb" PRIMARY KEY using index "PK_7704a5add6baed43eef835f0bfb";

alter table "public"."chat_hub_sessions" add constraint "PK_1eafef1273c70e4464fec703412" PRIMARY KEY using index "PK_1eafef1273c70e4464fec703412";

alter table "public"."chat_message" add constraint "PK_3cc0d85193aade457d3077dd06b" PRIMARY KEY using index "PK_3cc0d85193aade457d3077dd06b";

alter table "public"."chat_message_feedback" add constraint "PK_98419043dd704f54-9830ab78f9" PRIMARY KEY using index "PK_98419043dd704f54-9830ab78f9";

alter table "public"."conversations" add constraint "conversations_pkey" PRIMARY KEY using index "conversations_pkey";

alter table "public"."credential" add constraint "PK_3a5169bcd3d5463cefeec78be82" PRIMARY KEY using index "PK_3a5169bcd3d5463cefeec78be82";

alter table "public"."credentials_entity" add constraint "credentials_entity_pkey" PRIMARY KEY using index "credentials_entity_pkey";

alter table "public"."custom_template" add constraint "PK_3c7cea7d087ac4b91764574cdbf" PRIMARY KEY using index "PK_3c7cea7d087ac4b91764574cdbf";

alter table "public"."customers" add constraint "customers_pkey" PRIMARY KEY using index "customers_pkey";

alter table "public"."data_table" add constraint "PK_e226d0001b9e6097cbfe70617cb" PRIMARY KEY using index "PK_e226d0001b9e6097cbfe70617cb";

alter table "public"."data_table_column" add constraint "PK_673cb121ee4a8a5e27850c72c51" PRIMARY KEY using index "PK_673cb121ee4a8a5e27850c72c51";

alter table "public"."document_store" add constraint "PK_98495043dd774f54-9830ab78f9" PRIMARY KEY using index "PK_98495043dd774f54-9830ab78f9";

alter table "public"."document_store_file_chunk" add constraint "PK_90005043dd774f54-9830ab78f9" PRIMARY KEY using index "PK_90005043dd774f54-9830ab78f9";

alter table "public"."documents" add constraint "documents_pkey" PRIMARY KEY using index "documents_pkey";

alter table "public"."dynamic_credential_entry" add constraint "PK_7bc73da3b8be7591696e14809d5" PRIMARY KEY using index "PK_7bc73da3b8be7591696e14809d5";

alter table "public"."dynamic_credential_resolver" add constraint "PK_b76cfb088dcdaf5275e9980bb64" PRIMARY KEY using index "PK_b76cfb088dcdaf5275e9980bb64";

alter table "public"."event_destinations" add constraint "event_destinations_pkey" PRIMARY KEY using index "event_destinations_pkey";

alter table "public"."execution_annotation_tags" add constraint "PK_979ec03d31294cca484be65d11f" PRIMARY KEY using index "PK_979ec03d31294cca484be65d11f";

alter table "public"."execution_annotations" add constraint "PK_7afcf93ffa20c4252869a7c6a23" PRIMARY KEY using index "PK_7afcf93ffa20c4252869a7c6a23";

alter table "public"."execution_data" add constraint "execution_data_pkey" PRIMARY KEY using index "execution_data_pkey";

alter table "public"."execution_entity" add constraint "pk_e3e63bbf986767844bbe1166d4e" PRIMARY KEY using index "pk_e3e63bbf986767844bbe1166d4e";

alter table "public"."execution_metadata" add constraint "PK_17a0b6284f8d626aae88e1c16e4" PRIMARY KEY using index "PK_17a0b6284f8d626aae88e1c16e4";

alter table "public"."folder" add constraint "PK_6278a41a706740c94c02e288df8" PRIMARY KEY using index "PK_6278a41a706740c94c02e288df8";

alter table "public"."folder_tag" add constraint "PK_27e4e00852f6b06a925a4d83a3e" PRIMARY KEY using index "PK_27e4e00852f6b06a925a4d83a3e";

alter table "public"."fragrance_blends" add constraint "fragrance_blends_pkey" PRIMARY KEY using index "fragrance_blends_pkey";

alter table "public"."fragrance_oils" add constraint "fragrance_oils_pkey" PRIMARY KEY using index "fragrance_oils_pkey";

alter table "public"."fragrance_reviews" add constraint "fragrance_reviews_pkey" PRIMARY KEY using index "fragrance_reviews_pkey";

alter table "public"."insights_by_period" add constraint "PK_b606942249b90cc39b0265f0575" PRIMARY KEY using index "PK_b606942249b90cc39b0265f0575";

alter table "public"."insights_metadata" add constraint "PK_f448a94c35218b6208ce20cf5a1" PRIMARY KEY using index "PK_f448a94c35218b6208ce20cf5a1";

alter table "public"."insights_raw" add constraint "PK_ec15125755151e3a7e00e00014f" PRIMARY KEY using index "PK_ec15125755151e3a7e00e00014f";

alter table "public"."installed_nodes" add constraint "PK_8ebd28194e4f792f96b5933423fc439df97d9689" PRIMARY KEY using index "PK_8ebd28194e4f792f96b5933423fc439df97d9689";

alter table "public"."installed_packages" add constraint "PK_08cc9197c39b028c1e9beca225940576fd1a5804" PRIMARY KEY using index "PK_08cc9197c39b028c1e9beca225940576fd1a5804";

alter table "public"."invalid_auth_token" add constraint "PK_5779069b7235b256d91f7af1a15" PRIMARY KEY using index "PK_5779069b7235b256d91f7af1a15";

alter table "public"."lead" add constraint "PK_98419043dd704f54-9830ab78f0" PRIMARY KEY using index "PK_98419043dd704f54-9830ab78f0";

alter table "public"."liked_navidrome_tracks" add constraint "liked_navidrome_tracks_pkey" PRIMARY KEY using index "liked_navidrome_tracks_pkey";

alter table "public"."liked_songs" add constraint "liked_songs_pkey" PRIMARY KEY using index "liked_songs_pkey";

alter table "public"."likes" add constraint "likes_pkey" PRIMARY KEY using index "likes_pkey";

alter table "public"."listening_history" add constraint "listening_history_pkey" PRIMARY KEY using index "listening_history_pkey";

alter table "public"."messages" add constraint "messages_pkey" PRIMARY KEY using index "messages_pkey";

alter table "public"."migrations" add constraint "PK_8c82d7f526340ab734260ea46be" PRIMARY KEY using index "PK_8c82d7f526340ab734260ea46be";

alter table "public"."music_requests" add constraint "music_requests_pkey" PRIMARY KEY using index "music_requests_pkey";

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."oauth_access_tokens" add constraint "PK_dcd71f96a5d5f4bf79e67d322bf" PRIMARY KEY using index "PK_dcd71f96a5d5f4bf79e67d322bf";

alter table "public"."oauth_authorization_codes" add constraint "PK_fb91ab932cfbd694061501cc20f" PRIMARY KEY using index "PK_fb91ab932cfbd694061501cc20f";

alter table "public"."oauth_clients" add constraint "PK_c4759172d3431bae6f04e678e0d" PRIMARY KEY using index "PK_c4759172d3431bae6f04e678e0d";

alter table "public"."oauth_refresh_tokens" add constraint "PK_74abaed0b30711b6532598b0392" PRIMARY KEY using index "PK_74abaed0b30711b6532598b0392";

alter table "public"."oauth_user_consents" add constraint "PK_85b9ada746802c8993103470f05" PRIMARY KEY using index "PK_85b9ada746802c8993103470f05";

alter table "public"."ollama_documents" add constraint "ollama_documents_pkey" PRIMARY KEY using index "ollama_documents_pkey";

alter table "public"."pending_logins" add constraint "pending_logins_pkey" PRIMARY KEY using index "pending_logins_pkey";

alter table "public"."playlist_tracks" add constraint "playlist_tracks_pkey" PRIMARY KEY using index "playlist_tracks_pkey";

alter table "public"."playlists" add constraint "playlists_pkey" PRIMARY KEY using index "playlists_pkey";

alter table "public"."prices" add constraint "prices_pkey" PRIMARY KEY using index "prices_pkey";

alter table "public"."processed_data" add constraint "PK_ca04b9d8dc72de268fe07a65773" PRIMARY KEY using index "PK_ca04b9d8dc72de268fe07a65773";

alter table "public"."products" add constraint "products_pkey" PRIMARY KEY using index "products_pkey";

alter table "public"."project" add constraint "PK_4d68b1358bb5b766d3e78f32f57" PRIMARY KEY using index "PK_4d68b1358bb5b766d3e78f32f57";

alter table "public"."project_relation" add constraint "PK_1caaa312a5d7184a003be0f0cb6" PRIMARY KEY using index "PK_1caaa312a5d7184a003be0f0cb6";

alter table "public"."role" add constraint "PK_35c9b140caaf6da09cfabb0d675" PRIMARY KEY using index "PK_35c9b140caaf6da09cfabb0d675";

alter table "public"."role_scope" add constraint "PK_role_scope" PRIMARY KEY using index "PK_role_scope";

alter table "public"."scope" add constraint "PK_bfc45df0481abd7f355d6187da1" PRIMARY KEY using index "PK_bfc45df0481abd7f355d6187da1";

alter table "public"."settings" add constraint "PK_dc0fe14e6d9943f268e7b119f69ab8bd" PRIMARY KEY using index "PK_dc0fe14e6d9943f268e7b119f69ab8bd";

alter table "public"."shared_credentials" add constraint "PK_8ef3a59796a228913f251779cff" PRIMARY KEY using index "PK_8ef3a59796a228913f251779cff";

alter table "public"."shared_workflow" add constraint "PK_5ba87620386b847201c9531c58f" PRIMARY KEY using index "PK_5ba87620386b847201c9531c58f";

alter table "public"."songs" add constraint "songs_pkey" PRIMARY KEY using index "songs_pkey";

alter table "public"."spotify_recommendations" add constraint "spotify_recommendations_pkey" PRIMARY KEY using index "spotify_recommendations_pkey";

alter table "public"."subscriptions" add constraint "subscriptions_pkey" PRIMARY KEY using index "subscriptions_pkey";

alter table "public"."tag_entity" add constraint "tag_entity_pkey" PRIMARY KEY using index "tag_entity_pkey";

alter table "public"."test_case_execution" add constraint "PK_90c121f77a78a6580e94b794bce" PRIMARY KEY using index "PK_90c121f77a78a6580e94b794bce";

alter table "public"."test_run" add constraint "PK_011c050f566e9db509a0fadb9b9" PRIMARY KEY using index "PK_011c050f566e9db509a0fadb9b9";

alter table "public"."tool" add constraint "PK_3bf5b1016a384916073184f99b7" PRIMARY KEY using index "PK_3bf5b1016a384916073184f99b7";

alter table "public"."track_artists" add constraint "track_artists_pkey" PRIMARY KEY using index "track_artists_pkey";

alter table "public"."tracks" add constraint "tracks_pkey" PRIMARY KEY using index "tracks_pkey";

alter table "public"."upsert_history" add constraint "PK_37327b22b6e246319bd5eeb0e88" PRIMARY KEY using index "PK_37327b22b6e246319bd5eeb0e88";

alter table "public"."user" add constraint "PK_ea8f538c94b6e352418254ed6474a81f" PRIMARY KEY using index "PK_ea8f538c94b6e352418254ed6474a81f";

alter table "public"."user_api_keys" add constraint "PK_978fa5caa3468f463dac9d92e69" PRIMARY KEY using index "PK_978fa5caa3468f463dac9d92e69";

alter table "public"."user_settings" add constraint "user_settings_pkey" PRIMARY KEY using index "user_settings_pkey";

alter table "public"."user_spotify_tokens" add constraint "user_spotify_tokens_pkey" PRIMARY KEY using index "user_spotify_tokens_pkey";

alter table "public"."users" add constraint "users_pkey" PRIMARY KEY using index "users_pkey";

alter table "public"."variable" add constraint "PK_98419043dd704f54-9830ab78f8" PRIMARY KEY using index "PK_98419043dd704f54-9830ab78f8";

alter table "public"."variables" add constraint "variables_pkey" PRIMARY KEY using index "variables_pkey";

alter table "public"."webhook_entity" add constraint "PK_b21ace2e13596ccd87dc9bf4ea6" PRIMARY KEY using index "PK_b21ace2e13596ccd87dc9bf4ea6";

alter table "public"."workflow_dependency" add constraint "PK_52325e34cd7a2f0f67b0f3cad65" PRIMARY KEY using index "PK_52325e34cd7a2f0f67b0f3cad65";

alter table "public"."workflow_entity" add constraint "workflow_entity_pkey" PRIMARY KEY using index "workflow_entity_pkey";

alter table "public"."workflow_history" add constraint "PK_b6572dd6173e4cd06fe79937b58" PRIMARY KEY using index "PK_b6572dd6173e4cd06fe79937b58";

alter table "public"."workflow_publish_history" add constraint "PK_c788f7caf88e91e365c97d6d04a" PRIMARY KEY using index "PK_c788f7caf88e91e365c97d6d04a";

alter table "public"."workflow_statistics" add constraint "workflow_statistics_pkey" PRIMARY KEY using index "workflow_statistics_pkey";

alter table "public"."workflows_tags" add constraint "pk_workflows_tags" PRIMARY KEY using index "pk_workflows_tags";

alter table "stripe"."_managed_webhooks" add constraint "managed_webhooks_pkey" PRIMARY KEY using index "managed_webhooks_pkey";

alter table "stripe"."_migrations" add constraint "_migrations_pkey" PRIMARY KEY using index "_migrations_pkey";

alter table "stripe"."_sync_obj_runs" add constraint "_sync_obj_run_pkey" PRIMARY KEY using index "_sync_obj_run_pkey";

alter table "stripe"."_sync_runs" add constraint "_sync_run_pkey" PRIMARY KEY using index "_sync_run_pkey";

alter table "stripe"."accounts" add constraint "accounts_pkey" PRIMARY KEY using index "accounts_pkey";

alter table "stripe"."active_entitlements" add constraint "active_entitlements_pkey" PRIMARY KEY using index "active_entitlements_pkey";

alter table "stripe"."charges" add constraint "charges_pkey" PRIMARY KEY using index "charges_pkey";

alter table "stripe"."checkout_session_line_items" add constraint "checkout_session_line_items_pkey" PRIMARY KEY using index "checkout_session_line_items_pkey";

alter table "stripe"."checkout_sessions" add constraint "checkout_sessions_pkey" PRIMARY KEY using index "checkout_sessions_pkey";

alter table "stripe"."coupons" add constraint "coupons_pkey" PRIMARY KEY using index "coupons_pkey";

alter table "stripe"."credit_notes" add constraint "credit_notes_pkey" PRIMARY KEY using index "credit_notes_pkey";

alter table "stripe"."customers" add constraint "customers_pkey" PRIMARY KEY using index "customers_pkey";

alter table "stripe"."disputes" add constraint "disputes_pkey" PRIMARY KEY using index "disputes_pkey";

alter table "stripe"."early_fraud_warnings" add constraint "early_fraud_warnings_pkey" PRIMARY KEY using index "early_fraud_warnings_pkey";

alter table "stripe"."events" add constraint "events_pkey" PRIMARY KEY using index "events_pkey";

alter table "stripe"."exchange_rates_from_usd" add constraint "exchange_rates_from_usd_pkey" PRIMARY KEY using index "exchange_rates_from_usd_pkey";

alter table "stripe"."features" add constraint "features_pkey" PRIMARY KEY using index "features_pkey";

alter table "stripe"."invoices" add constraint "invoices_pkey" PRIMARY KEY using index "invoices_pkey";

alter table "stripe"."payment_intents" add constraint "payment_intents_pkey" PRIMARY KEY using index "payment_intents_pkey";

alter table "stripe"."payment_methods" add constraint "payment_methods_pkey" PRIMARY KEY using index "payment_methods_pkey";

alter table "stripe"."payouts" add constraint "payouts_pkey" PRIMARY KEY using index "payouts_pkey";

alter table "stripe"."plans" add constraint "plans_pkey" PRIMARY KEY using index "plans_pkey";

alter table "stripe"."prices" add constraint "prices_pkey" PRIMARY KEY using index "prices_pkey";

alter table "stripe"."products" add constraint "products_pkey" PRIMARY KEY using index "products_pkey";

alter table "stripe"."refunds" add constraint "refunds_pkey" PRIMARY KEY using index "refunds_pkey";

alter table "stripe"."reviews" add constraint "reviews_pkey" PRIMARY KEY using index "reviews_pkey";

alter table "stripe"."setup_intents" add constraint "setup_intents_pkey" PRIMARY KEY using index "setup_intents_pkey";

alter table "stripe"."subscription_item_change_events_v2_beta" add constraint "subscription_item_change_events_v2_beta_pkey" PRIMARY KEY using index "subscription_item_change_events_v2_beta_pkey";

alter table "stripe"."subscription_items" add constraint "subscription_items_pkey" PRIMARY KEY using index "subscription_items_pkey";

alter table "stripe"."subscription_schedules" add constraint "subscription_schedules_pkey" PRIMARY KEY using index "subscription_schedules_pkey";

alter table "stripe"."subscriptions" add constraint "subscriptions_pkey" PRIMARY KEY using index "subscriptions_pkey";

alter table "stripe"."tax_ids" add constraint "tax_ids_pkey" PRIMARY KEY using index "tax_ids_pkey";

alter table "n8n"."apikey" add constraint "fk_apikey_workspaceId" FOREIGN KEY ("workspaceId") REFERENCES n8n.workspace(id) not valid;

alter table "n8n"."apikey" validate constraint "fk_apikey_workspaceId";

alter table "n8n"."assistant" add constraint "fk_assistant_workspaceId" FOREIGN KEY ("workspaceId") REFERENCES n8n.workspace(id) not valid;

alter table "n8n"."assistant" validate constraint "fk_assistant_workspaceId";

alter table "n8n"."auth_identity" add constraint "auth_identity_userId_fkey" FOREIGN KEY ("userId") REFERENCES n8n."user"(id) not valid;

alter table "n8n"."auth_identity" validate constraint "auth_identity_userId_fkey";

alter table "n8n"."binary_data" add constraint "CHK_binary_data_sourceType" CHECK ((("sourceType")::text = ANY ((ARRAY['execution'::character varying, 'chat_message_attachment'::character varying])::text[]))) not valid;

alter table "n8n"."binary_data" validate constraint "CHK_binary_data_sourceType";

alter table "n8n"."chat_flow" add constraint "fk_chat_flow_workspaceId" FOREIGN KEY ("workspaceId") REFERENCES n8n.workspace(id) not valid;

alter table "n8n"."chat_flow" validate constraint "fk_chat_flow_workspaceId";

alter table "n8n"."chat_hub_agents" add constraint "FK_441ba2caba11e077ce3fbfa2cd8" FOREIGN KEY ("ownerId") REFERENCES n8n."user"(id) ON DELETE CASCADE not valid;

alter table "n8n"."chat_hub_agents" validate constraint "FK_441ba2caba11e077ce3fbfa2cd8";

alter table "n8n"."chat_hub_agents" add constraint "FK_9c61ad497dcbae499c96a6a78ba" FOREIGN KEY ("credentialId") REFERENCES n8n.credentials_entity(id) ON DELETE SET NULL not valid;

alter table "n8n"."chat_hub_agents" validate constraint "FK_9c61ad497dcbae499c96a6a78ba";

alter table "n8n"."chat_hub_messages" add constraint "FK_1f4998c8a7dec9e00a9ab15550e" FOREIGN KEY ("revisionOfMessageId") REFERENCES n8n.chat_hub_messages(id) ON DELETE CASCADE not valid;

alter table "n8n"."chat_hub_messages" validate constraint "FK_1f4998c8a7dec9e00a9ab15550e";

alter table "n8n"."chat_hub_messages" add constraint "FK_25c9736e7f769f3a005eef4b372" FOREIGN KEY ("retryOfMessageId") REFERENCES n8n.chat_hub_messages(id) ON DELETE CASCADE not valid;

alter table "n8n"."chat_hub_messages" validate constraint "FK_25c9736e7f769f3a005eef4b372";

alter table "n8n"."chat_hub_messages" add constraint "FK_6afb260449dd7a9b85355d4e0c9" FOREIGN KEY ("executionId") REFERENCES n8n.execution_entity(id) ON DELETE SET NULL not valid;

alter table "n8n"."chat_hub_messages" validate constraint "FK_6afb260449dd7a9b85355d4e0c9";

alter table "n8n"."chat_hub_messages" add constraint "FK_acf8926098f063cdbbad8497fd1" FOREIGN KEY ("workflowId") REFERENCES n8n.workflow_entity(id) ON DELETE SET NULL not valid;

alter table "n8n"."chat_hub_messages" validate constraint "FK_acf8926098f063cdbbad8497fd1";

alter table "n8n"."chat_hub_messages" add constraint "FK_e22538eb50a71a17954cd7e076c" FOREIGN KEY ("sessionId") REFERENCES n8n.chat_hub_sessions(id) ON DELETE CASCADE not valid;

alter table "n8n"."chat_hub_messages" validate constraint "FK_e22538eb50a71a17954cd7e076c";

alter table "n8n"."chat_hub_messages" add constraint "FK_e5d1fa722c5a8d38ac204746662" FOREIGN KEY ("previousMessageId") REFERENCES n8n.chat_hub_messages(id) ON DELETE CASCADE not valid;

alter table "n8n"."chat_hub_messages" validate constraint "FK_e5d1fa722c5a8d38ac204746662";

alter table "n8n"."chat_hub_sessions" add constraint "FK_7bc13b4c7e6afbfaf9be326c189" FOREIGN KEY ("credentialId") REFERENCES n8n.credentials_entity(id) ON DELETE SET NULL not valid;

alter table "n8n"."chat_hub_sessions" validate constraint "FK_7bc13b4c7e6afbfaf9be326c189";

alter table "n8n"."chat_hub_sessions" add constraint "FK_9f9293d9f552496c40e0d1a8f80" FOREIGN KEY ("workflowId") REFERENCES n8n.workflow_entity(id) ON DELETE SET NULL not valid;

alter table "n8n"."chat_hub_sessions" validate constraint "FK_9f9293d9f552496c40e0d1a8f80";

alter table "n8n"."chat_hub_sessions" add constraint "FK_e9ecf8ede7d989fcd18790fe36a" FOREIGN KEY ("ownerId") REFERENCES n8n."user"(id) ON DELETE CASCADE not valid;

alter table "n8n"."chat_hub_sessions" validate constraint "FK_e9ecf8ede7d989fcd18790fe36a";

alter table "n8n"."chat_message_feedback" add constraint "UQ_6352078b5a294f2d22179ea7956" UNIQUE using index "UQ_6352078b5a294f2d22179ea7956";

alter table "n8n"."credential" add constraint "fk_credential_workspaceId" FOREIGN KEY ("workspaceId") REFERENCES n8n.workspace(id) not valid;

alter table "n8n"."credential" validate constraint "fk_credential_workspaceId";

alter table "n8n"."custom_template" add constraint "fk_custom_template_workspaceId" FOREIGN KEY ("workspaceId") REFERENCES n8n.workspace(id) not valid;

alter table "n8n"."custom_template" validate constraint "fk_custom_template_workspaceId";

alter table "n8n"."data_table" add constraint "FK_c2a794257dee48af7c9abf681de" FOREIGN KEY ("projectId") REFERENCES n8n.project(id) ON DELETE CASCADE not valid;

alter table "n8n"."data_table" validate constraint "FK_c2a794257dee48af7c9abf681de";

alter table "n8n"."data_table" add constraint "UQ_b23096ef747281ac944d28e8b0d" UNIQUE using index "UQ_b23096ef747281ac944d28e8b0d";

alter table "n8n"."data_table_column" add constraint "FK_930b6e8faaf88294cef23484160" FOREIGN KEY ("dataTableId") REFERENCES n8n.data_table(id) ON DELETE CASCADE not valid;

alter table "n8n"."data_table_column" validate constraint "FK_930b6e8faaf88294cef23484160";

alter table "n8n"."data_table_column" add constraint "UQ_8082ec4890f892f0bc77473a123" UNIQUE using index "UQ_8082ec4890f892f0bc77473a123";

alter table "n8n"."dataset" add constraint "fk_dataset_workspaceId" FOREIGN KEY ("workspaceId") REFERENCES n8n.workspace(id) not valid;

alter table "n8n"."dataset" validate constraint "fk_dataset_workspaceId";

alter table "n8n"."document_store" add constraint "fk_document_store_workspaceId" FOREIGN KEY ("workspaceId") REFERENCES n8n.workspace(id) not valid;

alter table "n8n"."document_store" validate constraint "fk_document_store_workspaceId";

alter table "n8n"."evaluation" add constraint "fk_evaluation_workspaceId" FOREIGN KEY ("workspaceId") REFERENCES n8n.workspace(id) not valid;

alter table "n8n"."evaluation" validate constraint "fk_evaluation_workspaceId";

alter table "n8n"."evaluator" add constraint "fk_evaluator_workspaceId" FOREIGN KEY ("workspaceId") REFERENCES n8n.workspace(id) not valid;

alter table "n8n"."evaluator" validate constraint "fk_evaluator_workspaceId";

alter table "n8n"."execution_annotation_tags" add constraint "FK_a3697779b366e131b2bbdae2976" FOREIGN KEY ("tagId") REFERENCES n8n.annotation_tag_entity(id) ON DELETE CASCADE not valid;

alter table "n8n"."execution_annotation_tags" validate constraint "FK_a3697779b366e131b2bbdae2976";

alter table "n8n"."execution_annotation_tags" add constraint "FK_c1519757391996eb06064f0e7c8" FOREIGN KEY ("annotationId") REFERENCES n8n.execution_annotations(id) ON DELETE CASCADE not valid;

alter table "n8n"."execution_annotation_tags" validate constraint "FK_c1519757391996eb06064f0e7c8";

alter table "n8n"."execution_annotations" add constraint "FK_97f863fa83c4786f19565084960" FOREIGN KEY ("executionId") REFERENCES n8n.execution_entity(id) ON DELETE CASCADE not valid;

alter table "n8n"."execution_annotations" validate constraint "FK_97f863fa83c4786f19565084960";

alter table "n8n"."execution_data" add constraint "execution_data_fk" FOREIGN KEY ("executionId") REFERENCES n8n.execution_entity(id) ON DELETE CASCADE not valid;

alter table "n8n"."execution_data" validate constraint "execution_data_fk";

alter table "n8n"."execution_entity" add constraint "fk_execution_entity_workflow_id" FOREIGN KEY ("workflowId") REFERENCES n8n.workflow_entity(id) ON DELETE CASCADE not valid;

alter table "n8n"."execution_entity" validate constraint "fk_execution_entity_workflow_id";

alter table "n8n"."execution_metadata" add constraint "FK_31d0b4c93fb85ced26f6005cda3" FOREIGN KEY ("executionId") REFERENCES n8n.execution_entity(id) ON DELETE CASCADE not valid;

alter table "n8n"."execution_metadata" validate constraint "FK_31d0b4c93fb85ced26f6005cda3";

alter table "n8n"."folder" add constraint "FK_804ea52f6729e3940498bd54d78" FOREIGN KEY ("parentFolderId") REFERENCES n8n.folder(id) ON DELETE CASCADE not valid;

alter table "n8n"."folder" validate constraint "FK_804ea52f6729e3940498bd54d78";

alter table "n8n"."folder" add constraint "FK_a8260b0b36939c6247f385b8221" FOREIGN KEY ("projectId") REFERENCES n8n.project(id) ON DELETE CASCADE not valid;

alter table "n8n"."folder" validate constraint "FK_a8260b0b36939c6247f385b8221";

alter table "n8n"."folder_tag" add constraint "FK_94a60854e06f2897b2e0d39edba" FOREIGN KEY ("folderId") REFERENCES n8n.folder(id) ON DELETE CASCADE not valid;

alter table "n8n"."folder_tag" validate constraint "FK_94a60854e06f2897b2e0d39edba";

alter table "n8n"."folder_tag" add constraint "FK_dc88164176283de80af47621746" FOREIGN KEY ("tagId") REFERENCES n8n.tag_entity(id) ON DELETE CASCADE not valid;

alter table "n8n"."folder_tag" validate constraint "FK_dc88164176283de80af47621746";

alter table "n8n"."insights_by_period" add constraint "FK_6414cfed98daabbfdd61a1cfbc0" FOREIGN KEY ("metaId") REFERENCES n8n.insights_metadata("metaId") ON DELETE CASCADE not valid;

alter table "n8n"."insights_by_period" validate constraint "FK_6414cfed98daabbfdd61a1cfbc0";

alter table "n8n"."insights_metadata" add constraint "FK_1d8ab99d5861c9388d2dc1cf733" FOREIGN KEY ("workflowId") REFERENCES n8n.workflow_entity(id) ON DELETE SET NULL not valid;

alter table "n8n"."insights_metadata" validate constraint "FK_1d8ab99d5861c9388d2dc1cf733";

alter table "n8n"."insights_metadata" add constraint "FK_2375a1eda085adb16b24615b69c" FOREIGN KEY ("projectId") REFERENCES n8n.project(id) ON DELETE SET NULL not valid;

alter table "n8n"."insights_metadata" validate constraint "FK_2375a1eda085adb16b24615b69c";

alter table "n8n"."insights_raw" add constraint "FK_6e2e33741adef2a7c5d66befa4e" FOREIGN KEY ("metaId") REFERENCES n8n.insights_metadata("metaId") ON DELETE CASCADE not valid;

alter table "n8n"."insights_raw" validate constraint "FK_6e2e33741adef2a7c5d66befa4e";

alter table "n8n"."installed_nodes" add constraint "FK_73f857fc5dce682cef8a99c11dbddbc969618951" FOREIGN KEY (package) REFERENCES n8n.installed_packages("packageName") ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "n8n"."installed_nodes" validate constraint "FK_73f857fc5dce682cef8a99c11dbddbc969618951";

alter table "n8n"."n8n_workflows_tags" add constraint "FK_n8n_31140eb41f019805b40d0087449" FOREIGN KEY ("workflowId") REFERENCES n8n.n8n_workflow_entity(id) ON DELETE CASCADE not valid;

alter table "n8n"."n8n_workflows_tags" validate constraint "FK_n8n_31140eb41f019805b40d0087449";

alter table "n8n"."n8n_workflows_tags" add constraint "FK_n8n_5e29bfe9e22c5d6567f509d4a46" FOREIGN KEY ("tagId") REFERENCES n8n.n8n_tag_entity(id) ON DELETE CASCADE not valid;

alter table "n8n"."n8n_workflows_tags" validate constraint "FK_n8n_5e29bfe9e22c5d6567f509d4a46";

alter table "n8n"."oauth_access_tokens" add constraint "FK_7234a36d8e49a1fa85095328845" FOREIGN KEY ("userId") REFERENCES n8n."user"(id) ON DELETE CASCADE not valid;

alter table "n8n"."oauth_access_tokens" validate constraint "FK_7234a36d8e49a1fa85095328845";

alter table "n8n"."oauth_access_tokens" add constraint "FK_78b26968132b7e5e45b75876481" FOREIGN KEY ("clientId") REFERENCES n8n.oauth_clients(id) ON DELETE CASCADE not valid;

alter table "n8n"."oauth_access_tokens" validate constraint "FK_78b26968132b7e5e45b75876481";

alter table "n8n"."oauth_authorization_codes" add constraint "FK_64d965bd072ea24fb6da55468cd" FOREIGN KEY ("clientId") REFERENCES n8n.oauth_clients(id) ON DELETE CASCADE not valid;

alter table "n8n"."oauth_authorization_codes" validate constraint "FK_64d965bd072ea24fb6da55468cd";

alter table "n8n"."oauth_authorization_codes" add constraint "FK_aa8d3560484944c19bdf79ffa16" FOREIGN KEY ("userId") REFERENCES n8n."user"(id) ON DELETE CASCADE not valid;

alter table "n8n"."oauth_authorization_codes" validate constraint "FK_aa8d3560484944c19bdf79ffa16";

alter table "n8n"."oauth_refresh_tokens" add constraint "FK_a699f3ed9fd0c1b19bc2608ac53" FOREIGN KEY ("userId") REFERENCES n8n."user"(id) ON DELETE CASCADE not valid;

alter table "n8n"."oauth_refresh_tokens" validate constraint "FK_a699f3ed9fd0c1b19bc2608ac53";

alter table "n8n"."oauth_refresh_tokens" add constraint "FK_b388696ce4d8be7ffbe8d3e4b69" FOREIGN KEY ("clientId") REFERENCES n8n.oauth_clients(id) ON DELETE CASCADE not valid;

alter table "n8n"."oauth_refresh_tokens" validate constraint "FK_b388696ce4d8be7ffbe8d3e4b69";

alter table "n8n"."oauth_user_consents" add constraint "FK_21e6c3c2d78a097478fae6aaefa" FOREIGN KEY ("userId") REFERENCES n8n."user"(id) ON DELETE CASCADE not valid;

alter table "n8n"."oauth_user_consents" validate constraint "FK_21e6c3c2d78a097478fae6aaefa";

alter table "n8n"."oauth_user_consents" add constraint "FK_a651acea2f6c97f8c4514935486" FOREIGN KEY ("clientId") REFERENCES n8n.oauth_clients(id) ON DELETE CASCADE not valid;

alter table "n8n"."oauth_user_consents" validate constraint "FK_a651acea2f6c97f8c4514935486";

alter table "n8n"."oauth_user_consents" add constraint "UQ_083721d99ce8db4033e2958ebb4" UNIQUE using index "UQ_083721d99ce8db4033e2958ebb4";

alter table "n8n"."processed_data" add constraint "FK_06a69a7032c97a763c2c7599464" FOREIGN KEY ("workflowId") REFERENCES n8n.workflow_entity(id) ON DELETE CASCADE not valid;

alter table "n8n"."processed_data" validate constraint "FK_06a69a7032c97a763c2c7599464";

alter table "n8n"."project_relation" add constraint "FK_5f0643f6717905a05164090dde7" FOREIGN KEY ("userId") REFERENCES n8n."user"(id) ON DELETE CASCADE not valid;

alter table "n8n"."project_relation" validate constraint "FK_5f0643f6717905a05164090dde7";

alter table "n8n"."project_relation" add constraint "FK_61448d56d61802b5dfde5cdb002" FOREIGN KEY ("projectId") REFERENCES n8n.project(id) ON DELETE CASCADE not valid;

alter table "n8n"."project_relation" validate constraint "FK_61448d56d61802b5dfde5cdb002";

alter table "n8n"."project_relation" add constraint "FK_c6b99592dc96b0d836d7a21db91" FOREIGN KEY (role) REFERENCES n8n.role(slug) not valid;

alter table "n8n"."project_relation" validate constraint "FK_c6b99592dc96b0d836d7a21db91";

alter table "n8n"."role_scope" add constraint "FK_role" FOREIGN KEY ("roleSlug") REFERENCES n8n.role(slug) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "n8n"."role_scope" validate constraint "FK_role";

alter table "n8n"."role_scope" add constraint "FK_scope" FOREIGN KEY ("scopeSlug") REFERENCES n8n.scope(slug) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "n8n"."role_scope" validate constraint "FK_scope";

alter table "n8n"."shared_credentials" add constraint "FK_416f66fc846c7c442970c094ccf" FOREIGN KEY ("credentialsId") REFERENCES n8n.credentials_entity(id) ON DELETE CASCADE not valid;

alter table "n8n"."shared_credentials" validate constraint "FK_416f66fc846c7c442970c094ccf";

alter table "n8n"."shared_credentials" add constraint "FK_812c2852270da1247756e77f5a4" FOREIGN KEY ("projectId") REFERENCES n8n.project(id) ON DELETE CASCADE not valid;

alter table "n8n"."shared_credentials" validate constraint "FK_812c2852270da1247756e77f5a4";

alter table "n8n"."shared_workflow" add constraint "FK_a45ea5f27bcfdc21af9b4188560" FOREIGN KEY ("projectId") REFERENCES n8n.project(id) ON DELETE CASCADE not valid;

alter table "n8n"."shared_workflow" validate constraint "FK_a45ea5f27bcfdc21af9b4188560";

alter table "n8n"."shared_workflow" add constraint "FK_daa206a04983d47d0a9c34649ce" FOREIGN KEY ("workflowId") REFERENCES n8n.workflow_entity(id) ON DELETE CASCADE not valid;

alter table "n8n"."shared_workflow" validate constraint "FK_daa206a04983d47d0a9c34649ce";

alter table "n8n"."test_case_execution" add constraint "FK_8e4b4774db42f1e6dda3452b2af" FOREIGN KEY ("testRunId") REFERENCES n8n.test_run(id) ON DELETE CASCADE not valid;

alter table "n8n"."test_case_execution" validate constraint "FK_8e4b4774db42f1e6dda3452b2af";

alter table "n8n"."test_case_execution" add constraint "FK_e48965fac35d0f5b9e7f51d8c44" FOREIGN KEY ("executionId") REFERENCES n8n.execution_entity(id) ON DELETE SET NULL not valid;

alter table "n8n"."test_case_execution" validate constraint "FK_e48965fac35d0f5b9e7f51d8c44";

alter table "n8n"."test_run" add constraint "FK_d6870d3b6e4c185d33926f423c8" FOREIGN KEY ("workflowId") REFERENCES n8n.workflow_entity(id) ON DELETE CASCADE not valid;

alter table "n8n"."test_run" validate constraint "FK_d6870d3b6e4c185d33926f423c8";

alter table "n8n"."tool" add constraint "fk_tool_workspaceId" FOREIGN KEY ("workspaceId") REFERENCES n8n.workspace(id) not valid;

alter table "n8n"."tool" validate constraint "fk_tool_workspaceId";

alter table "n8n"."user" add constraint "FK_eaea92ee7bfb9c1b6cd01505d56" FOREIGN KEY ("roleSlug") REFERENCES n8n.role(slug) not valid;

alter table "n8n"."user" validate constraint "FK_eaea92ee7bfb9c1b6cd01505d56";

alter table "n8n"."user" add constraint "UQ_e12875dfb3b1d92d7d7c5377e2" UNIQUE using index "UQ_e12875dfb3b1d92d7d7c5377e2";

alter table "n8n"."user" add constraint "fk_user_activeWorkspaceId" FOREIGN KEY ("activeWorkspaceId") REFERENCES n8n.workspace(id) not valid;

alter table "n8n"."user" validate constraint "fk_user_activeWorkspaceId";

alter table "n8n"."user_api_keys" add constraint "FK_e131705cbbc8fb589889b02d457" FOREIGN KEY ("userId") REFERENCES n8n."user"(id) ON DELETE CASCADE not valid;

alter table "n8n"."user_api_keys" validate constraint "FK_e131705cbbc8fb589889b02d457";

alter table "n8n"."variable" add constraint "fk_variable_workspaceId" FOREIGN KEY ("workspaceId") REFERENCES n8n.workspace(id) not valid;

alter table "n8n"."variable" validate constraint "fk_variable_workspaceId";

alter table "n8n"."variables" add constraint "FK_42f6c766f9f9d2edcc15bdd6e9b" FOREIGN KEY ("projectId") REFERENCES n8n.project(id) ON DELETE CASCADE not valid;

alter table "n8n"."variables" validate constraint "FK_42f6c766f9f9d2edcc15bdd6e9b";

alter table "n8n"."webhook_entity" add constraint "fk_webhook_entity_workflow_id" FOREIGN KEY ("workflowId") REFERENCES n8n.workflow_entity(id) ON DELETE CASCADE not valid;

alter table "n8n"."webhook_entity" validate constraint "fk_webhook_entity_workflow_id";

alter table "n8n"."workflow_dependency" add constraint "FK_a4ff2d9b9628ea988fa9e7d0bf8" FOREIGN KEY ("workflowId") REFERENCES n8n.workflow_entity(id) ON DELETE CASCADE not valid;

alter table "n8n"."workflow_dependency" validate constraint "FK_a4ff2d9b9628ea988fa9e7d0bf8";

alter table "n8n"."workflow_entity" add constraint "FK_08d6c67b7f722b0039d9d5ed620" FOREIGN KEY ("activeVersionId") REFERENCES n8n.workflow_history("versionId") ON DELETE RESTRICT not valid;

alter table "n8n"."workflow_entity" validate constraint "FK_08d6c67b7f722b0039d9d5ed620";

alter table "n8n"."workflow_entity" add constraint "fk_workflow_parent_folder" FOREIGN KEY ("parentFolderId") REFERENCES n8n.folder(id) ON DELETE CASCADE not valid;

alter table "n8n"."workflow_entity" validate constraint "fk_workflow_parent_folder";

alter table "n8n"."workflow_history" add constraint "FK_1e31657f5fe46816c34be7c1b4b" FOREIGN KEY ("workflowId") REFERENCES n8n.workflow_entity(id) ON DELETE CASCADE not valid;

alter table "n8n"."workflow_history" validate constraint "FK_1e31657f5fe46816c34be7c1b4b";

alter table "n8n"."workflow_publish_history" add constraint "CHK_workflow_publish_history_event" CHECK (((event)::text = ANY ((ARRAY['activated'::character varying, 'deactivated'::character varying])::text[]))) not valid;

alter table "n8n"."workflow_publish_history" validate constraint "CHK_workflow_publish_history_event";

alter table "n8n"."workflow_publish_history" add constraint "FK_6eab5bd9eedabe9c54bd879fc40" FOREIGN KEY ("userId") REFERENCES n8n."user"(id) ON DELETE SET NULL not valid;

alter table "n8n"."workflow_publish_history" validate constraint "FK_6eab5bd9eedabe9c54bd879fc40";

alter table "n8n"."workflow_publish_history" add constraint "FK_b4cfbc7556d07f36ca177f5e473" FOREIGN KEY ("versionId") REFERENCES n8n.workflow_history("versionId") ON DELETE CASCADE not valid;

alter table "n8n"."workflow_publish_history" validate constraint "FK_b4cfbc7556d07f36ca177f5e473";

alter table "n8n"."workflow_publish_history" add constraint "FK_c01316f8c2d7101ec4fa9809267" FOREIGN KEY ("workflowId") REFERENCES n8n.workflow_entity(id) ON DELETE CASCADE not valid;

alter table "n8n"."workflow_publish_history" validate constraint "FK_c01316f8c2d7101ec4fa9809267";

alter table "n8n"."workflow_statistics" add constraint "fk_workflow_statistics_workflow_id" FOREIGN KEY ("workflowId") REFERENCES n8n.workflow_entity(id) ON DELETE CASCADE not valid;

alter table "n8n"."workflow_statistics" validate constraint "fk_workflow_statistics_workflow_id";

alter table "n8n"."workflows_tags" add constraint "fk_workflows_tags_tag_id" FOREIGN KEY ("tagId") REFERENCES n8n.tag_entity(id) ON DELETE CASCADE not valid;

alter table "n8n"."workflows_tags" validate constraint "fk_workflows_tags_tag_id";

alter table "n8n"."workflows_tags" add constraint "fk_workflows_tags_workflow_id" FOREIGN KEY ("workflowId") REFERENCES n8n.workflow_entity(id) ON DELETE CASCADE not valid;

alter table "n8n"."workflows_tags" validate constraint "fk_workflows_tags_workflow_id";

alter table "n8n"."workspace" add constraint "fk_workspace_organizationId" FOREIGN KEY ("organizationId") REFERENCES n8n.organization(id) not valid;

alter table "n8n"."workspace" validate constraint "fk_workspace_organizationId";

alter table "n8n"."workspace_shared" add constraint "fk_workspace_shared_workspaceId" FOREIGN KEY ("workspaceId") REFERENCES n8n.workspace(id) not valid;

alter table "n8n"."workspace_shared" validate constraint "fk_workspace_shared_workspaceId";

alter table "n8n"."workspace_users" add constraint "fk_workspace_users_workspaceId" FOREIGN KEY ("workspaceId") REFERENCES n8n.workspace(id) not valid;

alter table "n8n"."workspace_users" validate constraint "fk_workspace_users_workspaceId";

alter table "public"."albums" add constraint "albums_primary_artist_id_fkey" FOREIGN KEY (primary_artist_id) REFERENCES public.artists(id) ON DELETE CASCADE not valid;

alter table "public"."albums" validate constraint "albums_primary_artist_id_fkey";

alter table "public"."analytics" add constraint "analytics_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."analytics" validate constraint "analytics_user_id_fkey";

alter table "public"."auth_identity" add constraint "auth_identity_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."user"(id) not valid;

alter table "public"."auth_identity" validate constraint "auth_identity_userId_fkey";

alter table "public"."binary_data" add constraint "CHK_binary_data_sourceType" CHECK ((("sourceType")::text = ANY ((ARRAY['execution'::character varying, 'chat_message_attachment'::character varying])::text[]))) not valid;

alter table "public"."binary_data" validate constraint "CHK_binary_data_sourceType";

alter table "public"."chat_hub_agents" add constraint "FK_441ba2caba11e077ce3fbfa2cd8" FOREIGN KEY ("ownerId") REFERENCES public."user"(id) ON DELETE CASCADE not valid;

alter table "public"."chat_hub_agents" validate constraint "FK_441ba2caba11e077ce3fbfa2cd8";

alter table "public"."chat_hub_agents" add constraint "FK_9c61ad497dcbae499c96a6a78ba" FOREIGN KEY ("credentialId") REFERENCES public.credentials_entity(id) ON DELETE SET NULL not valid;

alter table "public"."chat_hub_agents" validate constraint "FK_9c61ad497dcbae499c96a6a78ba";

alter table "public"."chat_hub_messages" add constraint "FK_1f4998c8a7dec9e00a9ab15550e" FOREIGN KEY ("revisionOfMessageId") REFERENCES public.chat_hub_messages(id) ON DELETE CASCADE not valid;

alter table "public"."chat_hub_messages" validate constraint "FK_1f4998c8a7dec9e00a9ab15550e";

alter table "public"."chat_hub_messages" add constraint "FK_25c9736e7f769f3a005eef4b372" FOREIGN KEY ("retryOfMessageId") REFERENCES public.chat_hub_messages(id) ON DELETE CASCADE not valid;

alter table "public"."chat_hub_messages" validate constraint "FK_25c9736e7f769f3a005eef4b372";

alter table "public"."chat_hub_messages" add constraint "FK_6afb260449dd7a9b85355d4e0c9" FOREIGN KEY ("executionId") REFERENCES public.execution_entity(id) ON DELETE SET NULL not valid;

alter table "public"."chat_hub_messages" validate constraint "FK_6afb260449dd7a9b85355d4e0c9";

alter table "public"."chat_hub_messages" add constraint "FK_acf8926098f063cdbbad8497fd1" FOREIGN KEY ("workflowId") REFERENCES public.workflow_entity(id) ON DELETE SET NULL not valid;

alter table "public"."chat_hub_messages" validate constraint "FK_acf8926098f063cdbbad8497fd1";

alter table "public"."chat_hub_messages" add constraint "FK_chat_hub_messages_agentId" FOREIGN KEY ("agentId") REFERENCES public.chat_hub_agents(id) ON DELETE SET NULL not valid;

alter table "public"."chat_hub_messages" validate constraint "FK_chat_hub_messages_agentId";

alter table "public"."chat_hub_messages" add constraint "FK_e22538eb50a71a17954cd7e076c" FOREIGN KEY ("sessionId") REFERENCES public.chat_hub_sessions(id) ON DELETE CASCADE not valid;

alter table "public"."chat_hub_messages" validate constraint "FK_e22538eb50a71a17954cd7e076c";

alter table "public"."chat_hub_messages" add constraint "FK_e5d1fa722c5a8d38ac204746662" FOREIGN KEY ("previousMessageId") REFERENCES public.chat_hub_messages(id) ON DELETE CASCADE not valid;

alter table "public"."chat_hub_messages" validate constraint "FK_e5d1fa722c5a8d38ac204746662";

alter table "public"."chat_hub_sessions" add constraint "FK_7bc13b4c7e6afbfaf9be326c189" FOREIGN KEY ("credentialId") REFERENCES public.credentials_entity(id) ON DELETE SET NULL not valid;

alter table "public"."chat_hub_sessions" validate constraint "FK_7bc13b4c7e6afbfaf9be326c189";

alter table "public"."chat_hub_sessions" add constraint "FK_9f9293d9f552496c40e0d1a8f80" FOREIGN KEY ("workflowId") REFERENCES public.workflow_entity(id) ON DELETE SET NULL not valid;

alter table "public"."chat_hub_sessions" validate constraint "FK_9f9293d9f552496c40e0d1a8f80";

alter table "public"."chat_hub_sessions" add constraint "FK_chat_hub_sessions_agentId" FOREIGN KEY ("agentId") REFERENCES public.chat_hub_agents(id) ON DELETE SET NULL not valid;

alter table "public"."chat_hub_sessions" validate constraint "FK_chat_hub_sessions_agentId";

alter table "public"."chat_hub_sessions" add constraint "FK_e9ecf8ede7d989fcd18790fe36a" FOREIGN KEY ("ownerId") REFERENCES public."user"(id) ON DELETE CASCADE not valid;

alter table "public"."chat_hub_sessions" validate constraint "FK_e9ecf8ede7d989fcd18790fe36a";

alter table "public"."chat_message_feedback" add constraint "UQ_6352078b5a294f2d22179ea7956" UNIQUE using index "UQ_6352078b5a294f2d22179ea7956";

alter table "public"."conversations" add constraint "conversations_agent_id_fkey" FOREIGN KEY (agent_id) REFERENCES public.ai_agents(id) ON DELETE CASCADE not valid;

alter table "public"."conversations" validate constraint "conversations_agent_id_fkey";

alter table "public"."conversations" add constraint "conversations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."conversations" validate constraint "conversations_user_id_fkey";

alter table "public"."credentials_entity" add constraint "credentials_entity_resolverId_foreign" FOREIGN KEY ("resolverId") REFERENCES public.dynamic_credential_resolver(id) ON DELETE SET NULL not valid;

alter table "public"."credentials_entity" validate constraint "credentials_entity_resolverId_foreign";

alter table "public"."customers" add constraint "customers_id_fkey" FOREIGN KEY (id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."customers" validate constraint "customers_id_fkey";

alter table "public"."data_table" add constraint "FK_c2a794257dee48af7c9abf681de" FOREIGN KEY ("projectId") REFERENCES public.project(id) ON DELETE CASCADE not valid;

alter table "public"."data_table" validate constraint "FK_c2a794257dee48af7c9abf681de";

alter table "public"."data_table" add constraint "UQ_b23096ef747281ac944d28e8b0d" UNIQUE using index "UQ_b23096ef747281ac944d28e8b0d";

alter table "public"."data_table_column" add constraint "FK_930b6e8faaf88294cef23484160" FOREIGN KEY ("dataTableId") REFERENCES public.data_table(id) ON DELETE CASCADE not valid;

alter table "public"."data_table_column" validate constraint "FK_930b6e8faaf88294cef23484160";

alter table "public"."data_table_column" add constraint "UQ_8082ec4890f892f0bc77473a123" UNIQUE using index "UQ_8082ec4890f892f0bc77473a123";

alter table "public"."dynamic_credential_entry" add constraint "FK_d57808fe08b77464f6a88a25494" FOREIGN KEY (resolver_id) REFERENCES public.dynamic_credential_resolver(id) ON DELETE CASCADE not valid;

alter table "public"."dynamic_credential_entry" validate constraint "FK_d57808fe08b77464f6a88a25494";

alter table "public"."dynamic_credential_entry" add constraint "FK_e97db563e505ae5f57ca33ef221" FOREIGN KEY (credential_id) REFERENCES public.credentials_entity(id) ON DELETE CASCADE not valid;

alter table "public"."dynamic_credential_entry" validate constraint "FK_e97db563e505ae5f57ca33ef221";

alter table "public"."execution_annotation_tags" add constraint "FK_a3697779b366e131b2bbdae2976" FOREIGN KEY ("tagId") REFERENCES public.annotation_tag_entity(id) ON DELETE CASCADE not valid;

alter table "public"."execution_annotation_tags" validate constraint "FK_a3697779b366e131b2bbdae2976";

alter table "public"."execution_annotation_tags" add constraint "FK_c1519757391996eb06064f0e7c8" FOREIGN KEY ("annotationId") REFERENCES public.execution_annotations(id) ON DELETE CASCADE not valid;

alter table "public"."execution_annotation_tags" validate constraint "FK_c1519757391996eb06064f0e7c8";

alter table "public"."execution_annotations" add constraint "FK_97f863fa83c4786f19565084960" FOREIGN KEY ("executionId") REFERENCES public.execution_entity(id) ON DELETE CASCADE not valid;

alter table "public"."execution_annotations" validate constraint "FK_97f863fa83c4786f19565084960";

alter table "public"."execution_data" add constraint "execution_data_fk" FOREIGN KEY ("executionId") REFERENCES public.execution_entity(id) ON DELETE CASCADE not valid;

alter table "public"."execution_data" validate constraint "execution_data_fk";

alter table "public"."execution_entity" add constraint "execution_entity_storedAt_check" CHECK ((("storedAt")::text = ANY ((ARRAY['db'::character varying, 'fs'::character varying, 's3'::character varying])::text[]))) not valid;

alter table "public"."execution_entity" validate constraint "execution_entity_storedAt_check";

alter table "public"."execution_entity" add constraint "fk_execution_entity_workflow_id" FOREIGN KEY ("workflowId") REFERENCES public.workflow_entity(id) ON DELETE CASCADE not valid;

alter table "public"."execution_entity" validate constraint "fk_execution_entity_workflow_id";

alter table "public"."execution_metadata" add constraint "FK_31d0b4c93fb85ced26f6005cda3" FOREIGN KEY ("executionId") REFERENCES public.execution_entity(id) ON DELETE CASCADE not valid;

alter table "public"."execution_metadata" validate constraint "FK_31d0b4c93fb85ced26f6005cda3";

alter table "public"."folder" add constraint "FK_804ea52f6729e3940498bd54d78" FOREIGN KEY ("parentFolderId") REFERENCES public.folder(id) ON DELETE CASCADE not valid;

alter table "public"."folder" validate constraint "FK_804ea52f6729e3940498bd54d78";

alter table "public"."folder" add constraint "FK_a8260b0b36939c6247f385b8221" FOREIGN KEY ("projectId") REFERENCES public.project(id) ON DELETE CASCADE not valid;

alter table "public"."folder" validate constraint "FK_a8260b0b36939c6247f385b8221";

alter table "public"."folder_tag" add constraint "FK_94a60854e06f2897b2e0d39edba" FOREIGN KEY ("folderId") REFERENCES public.folder(id) ON DELETE CASCADE not valid;

alter table "public"."folder_tag" validate constraint "FK_94a60854e06f2897b2e0d39edba";

alter table "public"."folder_tag" add constraint "FK_dc88164176283de80af47621746" FOREIGN KEY ("tagId") REFERENCES public.tag_entity(id) ON DELETE CASCADE not valid;

alter table "public"."folder_tag" validate constraint "FK_dc88164176283de80af47621746";

alter table "public"."fragrance_blends" add constraint "fragrance_blends_fragrance_oil_id_fkey" FOREIGN KEY (fragrance_oil_id) REFERENCES public.fragrance_oils(id) ON DELETE CASCADE not valid;

alter table "public"."fragrance_blends" validate constraint "fragrance_blends_fragrance_oil_id_fkey";

alter table "public"."fragrance_oils" add constraint "fragrance_oils_url_key" UNIQUE using index "fragrance_oils_url_key";

alter table "public"."fragrance_reviews" add constraint "fragrance_reviews_fragrance_oil_id_fkey" FOREIGN KEY (fragrance_oil_id) REFERENCES public.fragrance_oils(id) ON DELETE CASCADE not valid;

alter table "public"."fragrance_reviews" validate constraint "fragrance_reviews_fragrance_oil_id_fkey";

alter table "public"."fragrance_reviews" add constraint "fragrance_reviews_rating_check" CHECK (((rating >= 1) AND (rating <= 5))) not valid;

alter table "public"."fragrance_reviews" validate constraint "fragrance_reviews_rating_check";

alter table "public"."insights_by_period" add constraint "FK_6414cfed98daabbfdd61a1cfbc0" FOREIGN KEY ("metaId") REFERENCES public.insights_metadata("metaId") ON DELETE CASCADE not valid;

alter table "public"."insights_by_period" validate constraint "FK_6414cfed98daabbfdd61a1cfbc0";

alter table "public"."insights_metadata" add constraint "FK_1d8ab99d5861c9388d2dc1cf733" FOREIGN KEY ("workflowId") REFERENCES public.workflow_entity(id) ON DELETE SET NULL not valid;

alter table "public"."insights_metadata" validate constraint "FK_1d8ab99d5861c9388d2dc1cf733";

alter table "public"."insights_metadata" add constraint "FK_2375a1eda085adb16b24615b69c" FOREIGN KEY ("projectId") REFERENCES public.project(id) ON DELETE SET NULL not valid;

alter table "public"."insights_metadata" validate constraint "FK_2375a1eda085adb16b24615b69c";

alter table "public"."insights_raw" add constraint "FK_6e2e33741adef2a7c5d66befa4e" FOREIGN KEY ("metaId") REFERENCES public.insights_metadata("metaId") ON DELETE CASCADE not valid;

alter table "public"."insights_raw" validate constraint "FK_6e2e33741adef2a7c5d66befa4e";

alter table "public"."installed_nodes" add constraint "FK_73f857fc5dce682cef8a99c11dbddbc969618951" FOREIGN KEY (package) REFERENCES public.installed_packages("packageName") ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."installed_nodes" validate constraint "FK_73f857fc5dce682cef8a99c11dbddbc969618951";

alter table "public"."liked_navidrome_tracks" add constraint "liked_navidrome_tracks_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."liked_navidrome_tracks" validate constraint "liked_navidrome_tracks_user_id_fkey";

alter table "public"."liked_songs" add constraint "liked_songs_song_id_fkey" FOREIGN KEY (song_id) REFERENCES public.songs(id) ON DELETE CASCADE not valid;

alter table "public"."liked_songs" validate constraint "liked_songs_song_id_fkey";

alter table "public"."liked_songs" add constraint "liked_songs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."liked_songs" validate constraint "liked_songs_user_id_fkey";

alter table "public"."likes" add constraint "likes_playlist_id_fkey" FOREIGN KEY (playlist_id) REFERENCES public.playlists(id) ON DELETE CASCADE not valid;

alter table "public"."likes" validate constraint "likes_playlist_id_fkey";

alter table "public"."likes" add constraint "likes_target_check" CHECK ((((playlist_id IS NOT NULL) AND (track_id IS NULL)) OR ((playlist_id IS NULL) AND (track_id IS NOT NULL)))) not valid;

alter table "public"."likes" validate constraint "likes_target_check";

alter table "public"."likes" add constraint "likes_track_id_fkey" FOREIGN KEY (track_id) REFERENCES public.tracks(id) ON DELETE CASCADE not valid;

alter table "public"."likes" validate constraint "likes_track_id_fkey";

alter table "public"."likes" add constraint "likes_unique_playlist" UNIQUE using index "likes_unique_playlist";

alter table "public"."likes" add constraint "likes_unique_track" UNIQUE using index "likes_unique_track";

alter table "public"."likes" add constraint "likes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."likes" validate constraint "likes_user_id_fkey";

alter table "public"."listening_history" add constraint "listening_history_track_id_fkey" FOREIGN KEY (track_id) REFERENCES public.tracks(id) ON DELETE CASCADE not valid;

alter table "public"."listening_history" validate constraint "listening_history_track_id_fkey";

alter table "public"."listening_history" add constraint "listening_history_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."listening_history" validate constraint "listening_history_user_id_fkey";

alter table "public"."messages" add constraint "messages_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE not valid;

alter table "public"."messages" validate constraint "messages_conversation_id_fkey";

alter table "public"."messages" add constraint "messages_sender_type_check" CHECK ((sender_type = ANY (ARRAY['user'::text, 'agent'::text]))) not valid;

alter table "public"."messages" validate constraint "messages_sender_type_check";

alter table "public"."music_requests" add constraint "music_requests_status_check" CHECK ((status = ANY (ARRAY['requested'::text, 'available'::text]))) not valid;

alter table "public"."music_requests" validate constraint "music_requests_status_check";

alter table "public"."music_requests" add constraint "music_requests_type_check" CHECK ((type = ANY (ARRAY['artist'::text, 'album'::text]))) not valid;

alter table "public"."music_requests" validate constraint "music_requests_type_check";

alter table "public"."music_requests" add constraint "music_requests_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."music_requests" validate constraint "music_requests_user_id_fkey";

alter table "public"."notifications" add constraint "notifications_type_check" CHECK ((type = ANY (ARRAY['info'::text, 'success'::text, 'warning'::text, 'error'::text]))) not valid;

alter table "public"."notifications" validate constraint "notifications_type_check";

alter table "public"."notifications" add constraint "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_user_id_fkey";

alter table "public"."oauth_access_tokens" add constraint "FK_7234a36d8e49a1fa85095328845" FOREIGN KEY ("userId") REFERENCES public."user"(id) ON DELETE CASCADE not valid;

alter table "public"."oauth_access_tokens" validate constraint "FK_7234a36d8e49a1fa85095328845";

alter table "public"."oauth_access_tokens" add constraint "FK_78b26968132b7e5e45b75876481" FOREIGN KEY ("clientId") REFERENCES public.oauth_clients(id) ON DELETE CASCADE not valid;

alter table "public"."oauth_access_tokens" validate constraint "FK_78b26968132b7e5e45b75876481";

alter table "public"."oauth_authorization_codes" add constraint "FK_64d965bd072ea24fb6da55468cd" FOREIGN KEY ("clientId") REFERENCES public.oauth_clients(id) ON DELETE CASCADE not valid;

alter table "public"."oauth_authorization_codes" validate constraint "FK_64d965bd072ea24fb6da55468cd";

alter table "public"."oauth_authorization_codes" add constraint "FK_aa8d3560484944c19bdf79ffa16" FOREIGN KEY ("userId") REFERENCES public."user"(id) ON DELETE CASCADE not valid;

alter table "public"."oauth_authorization_codes" validate constraint "FK_aa8d3560484944c19bdf79ffa16";

alter table "public"."oauth_refresh_tokens" add constraint "FK_a699f3ed9fd0c1b19bc2608ac53" FOREIGN KEY ("userId") REFERENCES public."user"(id) ON DELETE CASCADE not valid;

alter table "public"."oauth_refresh_tokens" validate constraint "FK_a699f3ed9fd0c1b19bc2608ac53";

alter table "public"."oauth_refresh_tokens" add constraint "FK_b388696ce4d8be7ffbe8d3e4b69" FOREIGN KEY ("clientId") REFERENCES public.oauth_clients(id) ON DELETE CASCADE not valid;

alter table "public"."oauth_refresh_tokens" validate constraint "FK_b388696ce4d8be7ffbe8d3e4b69";

alter table "public"."oauth_user_consents" add constraint "FK_21e6c3c2d78a097478fae6aaefa" FOREIGN KEY ("userId") REFERENCES public."user"(id) ON DELETE CASCADE not valid;

alter table "public"."oauth_user_consents" validate constraint "FK_21e6c3c2d78a097478fae6aaefa";

alter table "public"."oauth_user_consents" add constraint "FK_a651acea2f6c97f8c4514935486" FOREIGN KEY ("clientId") REFERENCES public.oauth_clients(id) ON DELETE CASCADE not valid;

alter table "public"."oauth_user_consents" validate constraint "FK_a651acea2f6c97f8c4514935486";

alter table "public"."oauth_user_consents" add constraint "UQ_083721d99ce8db4033e2958ebb4" UNIQUE using index "UQ_083721d99ce8db4033e2958ebb4";

alter table "public"."pending_logins" add constraint "pending_logins_short_code_key" UNIQUE using index "pending_logins_short_code_key";

alter table "public"."pending_logins" add constraint "pending_logins_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'consumed'::text, 'expired'::text]))) not valid;

alter table "public"."pending_logins" validate constraint "pending_logins_status_check";

alter table "public"."pending_logins" add constraint "pending_logins_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."pending_logins" validate constraint "pending_logins_user_id_fkey";

alter table "public"."playlist_tracks" add constraint "playlist_tracks_playlist_id_fkey" FOREIGN KEY (playlist_id) REFERENCES public.playlists(id) ON DELETE CASCADE not valid;

alter table "public"."playlist_tracks" validate constraint "playlist_tracks_playlist_id_fkey";

alter table "public"."playlist_tracks" add constraint "playlist_tracks_track_id_fkey" FOREIGN KEY (track_id) REFERENCES public.tracks(id) ON DELETE CASCADE not valid;

alter table "public"."playlist_tracks" validate constraint "playlist_tracks_track_id_fkey";

alter table "public"."playlists" add constraint "playlists_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."playlists" validate constraint "playlists_owner_id_fkey";

alter table "public"."prices" add constraint "prices_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE not valid;

alter table "public"."prices" validate constraint "prices_product_id_fkey";

alter table "public"."processed_data" add constraint "FK_06a69a7032c97a763c2c7599464" FOREIGN KEY ("workflowId") REFERENCES public.workflow_entity(id) ON DELETE CASCADE not valid;

alter table "public"."processed_data" validate constraint "FK_06a69a7032c97a763c2c7599464";

alter table "public"."profiles" add constraint "email_format" CHECK ((email ~* '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'::text)) not valid;

alter table "public"."profiles" validate constraint "email_format";

alter table "public"."profiles" add constraint "profiles_email_key" UNIQUE using index "profiles_email_key";

alter table "public"."profiles" add constraint "profiles_username_key" UNIQUE using index "profiles_username_key";

alter table "public"."profiles" add constraint "username_length" CHECK ((char_length(username) >= 3)) not valid;

alter table "public"."profiles" validate constraint "username_length";

alter table "public"."project" add constraint "projects_creatorId_foreign" FOREIGN KEY ("creatorId") REFERENCES public."user"(id) ON DELETE SET NULL not valid;

alter table "public"."project" validate constraint "projects_creatorId_foreign";

alter table "public"."project_relation" add constraint "FK_5f0643f6717905a05164090dde7" FOREIGN KEY ("userId") REFERENCES public."user"(id) ON DELETE CASCADE not valid;

alter table "public"."project_relation" validate constraint "FK_5f0643f6717905a05164090dde7";

alter table "public"."project_relation" add constraint "FK_61448d56d61802b5dfde5cdb002" FOREIGN KEY ("projectId") REFERENCES public.project(id) ON DELETE CASCADE not valid;

alter table "public"."project_relation" validate constraint "FK_61448d56d61802b5dfde5cdb002";

alter table "public"."project_relation" add constraint "FK_c6b99592dc96b0d836d7a21db91" FOREIGN KEY (role) REFERENCES public.role(slug) not valid;

alter table "public"."project_relation" validate constraint "FK_c6b99592dc96b0d836d7a21db91";

alter table "public"."role_scope" add constraint "FK_role" FOREIGN KEY ("roleSlug") REFERENCES public.role(slug) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."role_scope" validate constraint "FK_role";

alter table "public"."role_scope" add constraint "FK_scope" FOREIGN KEY ("scopeSlug") REFERENCES public.scope(slug) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."role_scope" validate constraint "FK_scope";

alter table "public"."shared_credentials" add constraint "FK_416f66fc846c7c442970c094ccf" FOREIGN KEY ("credentialsId") REFERENCES public.credentials_entity(id) ON DELETE CASCADE not valid;

alter table "public"."shared_credentials" validate constraint "FK_416f66fc846c7c442970c094ccf";

alter table "public"."shared_credentials" add constraint "FK_812c2852270da1247756e77f5a4" FOREIGN KEY ("projectId") REFERENCES public.project(id) ON DELETE CASCADE not valid;

alter table "public"."shared_credentials" validate constraint "FK_812c2852270da1247756e77f5a4";

alter table "public"."shared_workflow" add constraint "FK_a45ea5f27bcfdc21af9b4188560" FOREIGN KEY ("projectId") REFERENCES public.project(id) ON DELETE CASCADE not valid;

alter table "public"."shared_workflow" validate constraint "FK_a45ea5f27bcfdc21af9b4188560";

alter table "public"."shared_workflow" add constraint "FK_daa206a04983d47d0a9c34649ce" FOREIGN KEY ("workflowId") REFERENCES public.workflow_entity(id) ON DELETE CASCADE not valid;

alter table "public"."shared_workflow" validate constraint "FK_daa206a04983d47d0a9c34649ce";

alter table "public"."songs" add constraint "songs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."songs" validate constraint "songs_user_id_fkey";

alter table "public"."subscriptions" add constraint "subscriptions_price_id_fkey" FOREIGN KEY (price_id) REFERENCES public.prices(id) ON DELETE SET NULL not valid;

alter table "public"."subscriptions" validate constraint "subscriptions_price_id_fkey";

alter table "public"."subscriptions" add constraint "subscriptions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."subscriptions" validate constraint "subscriptions_user_id_fkey";

alter table "public"."test_case_execution" add constraint "FK_8e4b4774db42f1e6dda3452b2af" FOREIGN KEY ("testRunId") REFERENCES public.test_run(id) ON DELETE CASCADE not valid;

alter table "public"."test_case_execution" validate constraint "FK_8e4b4774db42f1e6dda3452b2af";

alter table "public"."test_case_execution" add constraint "FK_e48965fac35d0f5b9e7f51d8c44" FOREIGN KEY ("executionId") REFERENCES public.execution_entity(id) ON DELETE SET NULL not valid;

alter table "public"."test_case_execution" validate constraint "FK_e48965fac35d0f5b9e7f51d8c44";

alter table "public"."test_run" add constraint "FK_d6870d3b6e4c185d33926f423c8" FOREIGN KEY ("workflowId") REFERENCES public.workflow_entity(id) ON DELETE CASCADE not valid;

alter table "public"."test_run" validate constraint "FK_d6870d3b6e4c185d33926f423c8";

alter table "public"."track_artists" add constraint "track_artists_artist_id_fkey" FOREIGN KEY (artist_id) REFERENCES public.artists(id) ON DELETE CASCADE not valid;

alter table "public"."track_artists" validate constraint "track_artists_artist_id_fkey";

alter table "public"."track_artists" add constraint "track_artists_track_id_fkey" FOREIGN KEY (track_id) REFERENCES public.tracks(id) ON DELETE CASCADE not valid;

alter table "public"."track_artists" validate constraint "track_artists_track_id_fkey";

alter table "public"."tracks" add constraint "tracks_album_id_fkey" FOREIGN KEY (album_id) REFERENCES public.albums(id) ON DELETE SET NULL not valid;

alter table "public"."tracks" validate constraint "tracks_album_id_fkey";

alter table "public"."user" add constraint "FK_eaea92ee7bfb9c1b6cd01505d56" FOREIGN KEY ("roleSlug") REFERENCES public.role(slug) not valid;

alter table "public"."user" validate constraint "FK_eaea92ee7bfb9c1b6cd01505d56";

alter table "public"."user" add constraint "UQ_e12875dfb3b1d92d7d7c5377e2" UNIQUE using index "UQ_e12875dfb3b1d92d7d7c5377e2";

alter table "public"."user_api_keys" add constraint "FK_e131705cbbc8fb589889b02d457" FOREIGN KEY ("userId") REFERENCES public."user"(id) ON DELETE CASCADE not valid;

alter table "public"."user_api_keys" validate constraint "FK_e131705cbbc8fb589889b02d457";

alter table "public"."user_settings" add constraint "user_settings_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."user_settings" validate constraint "user_settings_user_id_fkey";

alter table "public"."user_spotify_tokens" add constraint "user_spotify_tokens_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_spotify_tokens" validate constraint "user_spotify_tokens_user_id_fkey";

alter table "public"."users" add constraint "users_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."users" validate constraint "users_id_fkey";

alter table "public"."users" add constraint "users_role_check" CHECK ((role = ANY (ARRAY['admin'::text, 'beta'::text, 'user'::text]))) not valid;

alter table "public"."users" validate constraint "users_role_check";

alter table "public"."variables" add constraint "FK_42f6c766f9f9d2edcc15bdd6e9b" FOREIGN KEY ("projectId") REFERENCES public.project(id) ON DELETE CASCADE not valid;

alter table "public"."variables" validate constraint "FK_42f6c766f9f9d2edcc15bdd6e9b";

alter table "public"."webhook_entity" add constraint "fk_webhook_entity_workflow_id" FOREIGN KEY ("workflowId") REFERENCES public.workflow_entity(id) ON DELETE CASCADE not valid;

alter table "public"."webhook_entity" validate constraint "fk_webhook_entity_workflow_id";

alter table "public"."workflow_dependency" add constraint "FK_a4ff2d9b9628ea988fa9e7d0bf8" FOREIGN KEY ("workflowId") REFERENCES public.workflow_entity(id) ON DELETE CASCADE not valid;

alter table "public"."workflow_dependency" validate constraint "FK_a4ff2d9b9628ea988fa9e7d0bf8";

alter table "public"."workflow_entity" add constraint "FK_08d6c67b7f722b0039d9d5ed620" FOREIGN KEY ("activeVersionId") REFERENCES public.workflow_history("versionId") ON DELETE RESTRICT not valid;

alter table "public"."workflow_entity" validate constraint "FK_08d6c67b7f722b0039d9d5ed620";

alter table "public"."workflow_entity" add constraint "fk_workflow_parent_folder" FOREIGN KEY ("parentFolderId") REFERENCES public.folder(id) ON DELETE CASCADE not valid;

alter table "public"."workflow_entity" validate constraint "fk_workflow_parent_folder";

alter table "public"."workflow_history" add constraint "FK_1e31657f5fe46816c34be7c1b4b" FOREIGN KEY ("workflowId") REFERENCES public.workflow_entity(id) ON DELETE CASCADE not valid;

alter table "public"."workflow_history" validate constraint "FK_1e31657f5fe46816c34be7c1b4b";

alter table "public"."workflow_publish_history" add constraint "CHK_workflow_publish_history_event" CHECK (((event)::text = ANY ((ARRAY['activated'::character varying, 'deactivated'::character varying])::text[]))) not valid;

alter table "public"."workflow_publish_history" validate constraint "CHK_workflow_publish_history_event";

alter table "public"."workflow_publish_history" add constraint "FK_6eab5bd9eedabe9c54bd879fc40" FOREIGN KEY ("userId") REFERENCES public."user"(id) ON DELETE SET NULL not valid;

alter table "public"."workflow_publish_history" validate constraint "FK_6eab5bd9eedabe9c54bd879fc40";

alter table "public"."workflow_publish_history" add constraint "FK_b4cfbc7556d07f36ca177f5e473" FOREIGN KEY ("versionId") REFERENCES public.workflow_history("versionId") ON DELETE CASCADE not valid;

alter table "public"."workflow_publish_history" validate constraint "FK_b4cfbc7556d07f36ca177f5e473";

alter table "public"."workflow_publish_history" add constraint "FK_c01316f8c2d7101ec4fa9809267" FOREIGN KEY ("workflowId") REFERENCES public.workflow_entity(id) ON DELETE CASCADE not valid;

alter table "public"."workflow_publish_history" validate constraint "FK_c01316f8c2d7101ec4fa9809267";

alter table "public"."workflows_tags" add constraint "fk_workflows_tags_tag_id" FOREIGN KEY ("tagId") REFERENCES public.tag_entity(id) ON DELETE CASCADE not valid;

alter table "public"."workflows_tags" validate constraint "fk_workflows_tags_tag_id";

alter table "public"."workflows_tags" add constraint "fk_workflows_tags_workflow_id" FOREIGN KEY ("workflowId") REFERENCES public.workflow_entity(id) ON DELETE CASCADE not valid;

alter table "public"."workflows_tags" validate constraint "fk_workflows_tags_workflow_id";

alter table "stripe"."_managed_webhooks" add constraint "fk_managed_webhooks_account" FOREIGN KEY (account_id) REFERENCES stripe.accounts(id) not valid;

alter table "stripe"."_managed_webhooks" validate constraint "fk_managed_webhooks_account";

alter table "stripe"."_managed_webhooks" add constraint "managed_webhooks_url_account_unique" UNIQUE using index "managed_webhooks_url_account_unique";

alter table "stripe"."_migrations" add constraint "_migrations_name_key" UNIQUE using index "_migrations_name_key";

alter table "stripe"."_sync_obj_runs" add constraint "_sync_obj_run_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'running'::text, 'complete'::text, 'error'::text]))) not valid;

alter table "stripe"."_sync_obj_runs" validate constraint "_sync_obj_run_status_check";

alter table "stripe"."_sync_obj_runs" add constraint "fk_sync_obj_runs_parent" FOREIGN KEY (_account_id, run_started_at) REFERENCES stripe._sync_runs(_account_id, started_at) not valid;

alter table "stripe"."_sync_obj_runs" validate constraint "fk_sync_obj_runs_parent";

alter table "stripe"."_sync_runs" add constraint "fk_sync_run_account" FOREIGN KEY (_account_id) REFERENCES stripe.accounts(id) not valid;

alter table "stripe"."_sync_runs" validate constraint "fk_sync_run_account";

alter table "stripe"."_sync_runs" add constraint "one_active_run_per_account" EXCLUDE USING btree (_account_id WITH =) WHERE ((closed_at IS NULL));

alter table "stripe"."active_entitlements" add constraint "fk_active_entitlements_account" FOREIGN KEY (_account_id) REFERENCES stripe.accounts(id) not valid;

alter table "stripe"."active_entitlements" validate constraint "fk_active_entitlements_account";

alter table "stripe"."charges" add constraint "fk_charges_account" FOREIGN KEY (_account_id) REFERENCES stripe.accounts(id) not valid;

alter table "stripe"."charges" validate constraint "fk_charges_account";

alter table "stripe"."checkout_session_line_items" add constraint "fk_checkout_session_line_items_account" FOREIGN KEY (_account_id) REFERENCES stripe.accounts(id) not valid;

alter table "stripe"."checkout_session_line_items" validate constraint "fk_checkout_session_line_items_account";

alter table "stripe"."checkout_sessions" add constraint "fk_checkout_sessions_account" FOREIGN KEY (_account_id) REFERENCES stripe.accounts(id) not valid;

alter table "stripe"."checkout_sessions" validate constraint "fk_checkout_sessions_account";

alter table "stripe"."credit_notes" add constraint "fk_credit_notes_account" FOREIGN KEY (_account_id) REFERENCES stripe.accounts(id) not valid;

alter table "stripe"."credit_notes" validate constraint "fk_credit_notes_account";

alter table "stripe"."customers" add constraint "fk_customers_account" FOREIGN KEY (_account_id) REFERENCES stripe.accounts(id) not valid;

alter table "stripe"."customers" validate constraint "fk_customers_account";

alter table "stripe"."disputes" add constraint "fk_disputes_account" FOREIGN KEY (_account_id) REFERENCES stripe.accounts(id) not valid;

alter table "stripe"."disputes" validate constraint "fk_disputes_account";

alter table "stripe"."early_fraud_warnings" add constraint "fk_early_fraud_warnings_account" FOREIGN KEY (_account_id) REFERENCES stripe.accounts(id) not valid;

alter table "stripe"."early_fraud_warnings" validate constraint "fk_early_fraud_warnings_account";

alter table "stripe"."exchange_rates_from_usd" add constraint "fk_exchange_rates_from_usd_account" FOREIGN KEY (_account_id) REFERENCES stripe.accounts(id) not valid;

alter table "stripe"."exchange_rates_from_usd" validate constraint "fk_exchange_rates_from_usd_account";

alter table "stripe"."features" add constraint "fk_features_account" FOREIGN KEY (_account_id) REFERENCES stripe.accounts(id) not valid;

alter table "stripe"."features" validate constraint "fk_features_account";

alter table "stripe"."invoices" add constraint "fk_invoices_account" FOREIGN KEY (_account_id) REFERENCES stripe.accounts(id) not valid;

alter table "stripe"."invoices" validate constraint "fk_invoices_account";

alter table "stripe"."payment_intents" add constraint "fk_payment_intents_account" FOREIGN KEY (_account_id) REFERENCES stripe.accounts(id) not valid;

alter table "stripe"."payment_intents" validate constraint "fk_payment_intents_account";

alter table "stripe"."payment_methods" add constraint "fk_payment_methods_account" FOREIGN KEY (_account_id) REFERENCES stripe.accounts(id) not valid;

alter table "stripe"."payment_methods" validate constraint "fk_payment_methods_account";

alter table "stripe"."plans" add constraint "fk_plans_account" FOREIGN KEY (_account_id) REFERENCES stripe.accounts(id) not valid;

alter table "stripe"."plans" validate constraint "fk_plans_account";

alter table "stripe"."prices" add constraint "fk_prices_account" FOREIGN KEY (_account_id) REFERENCES stripe.accounts(id) not valid;

alter table "stripe"."prices" validate constraint "fk_prices_account";

alter table "stripe"."products" add constraint "fk_products_account" FOREIGN KEY (_account_id) REFERENCES stripe.accounts(id) not valid;

alter table "stripe"."products" validate constraint "fk_products_account";

alter table "stripe"."refunds" add constraint "fk_refunds_account" FOREIGN KEY (_account_id) REFERENCES stripe.accounts(id) not valid;

alter table "stripe"."refunds" validate constraint "fk_refunds_account";

alter table "stripe"."reviews" add constraint "fk_reviews_account" FOREIGN KEY (_account_id) REFERENCES stripe.accounts(id) not valid;

alter table "stripe"."reviews" validate constraint "fk_reviews_account";

alter table "stripe"."setup_intents" add constraint "fk_setup_intents_account" FOREIGN KEY (_account_id) REFERENCES stripe.accounts(id) not valid;

alter table "stripe"."setup_intents" validate constraint "fk_setup_intents_account";

alter table "stripe"."subscription_item_change_events_v2_beta" add constraint "fk_subscription_item_change_events_v2_beta_account" FOREIGN KEY (_account_id) REFERENCES stripe.accounts(id) not valid;

alter table "stripe"."subscription_item_change_events_v2_beta" validate constraint "fk_subscription_item_change_events_v2_beta_account";

alter table "stripe"."subscription_items" add constraint "fk_subscription_items_account" FOREIGN KEY (_account_id) REFERENCES stripe.accounts(id) not valid;

alter table "stripe"."subscription_items" validate constraint "fk_subscription_items_account";

alter table "stripe"."subscription_schedules" add constraint "fk_subscription_schedules_account" FOREIGN KEY (_account_id) REFERENCES stripe.accounts(id) not valid;

alter table "stripe"."subscription_schedules" validate constraint "fk_subscription_schedules_account";

alter table "stripe"."subscriptions" add constraint "fk_subscriptions_account" FOREIGN KEY (_account_id) REFERENCES stripe.accounts(id) not valid;

alter table "stripe"."subscriptions" validate constraint "fk_subscriptions_account";

alter table "stripe"."tax_ids" add constraint "fk_tax_ids_account" FOREIGN KEY (_account_id) REFERENCES stripe.accounts(id) not valid;

alter table "stripe"."tax_ids" validate constraint "fk_tax_ids_account";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION n8n.increment_workflow_version()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
			BEGIN
				IF NEW."versionCounter" IS NOT DISTINCT FROM OLD."versionCounter" THEN
					NEW."versionCounter" = OLD."versionCounter" + 1;
				END IF;
				RETURN NEW;
			END;
			$function$
;

CREATE OR REPLACE FUNCTION public.check_current_bucket_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- your trigger logic here
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_notification(user_id uuid, title text, message text, type text DEFAULT 'info'::text, action_url text DEFAULT NULL::text, metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  notification_id uuid;
begin
  insert into public.notifications (user_id, title, message, type, action_url, metadata)
  values (user_id, title, message, type, action_url, metadata)
  returning id into notification_id;
  
  return notification_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.create_user_bucket()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  bucket_name text;
BEGIN
  -- Generate a bucket name based on the user's ID
  -- Format: user_<user_id>
  bucket_name := 'user_' || replace(NEW.id::text, '-', '_');
  
  -- Check if the bucket already exists
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = bucket_name) THEN
    -- Create the storage bucket for the user
    INSERT INTO storage.buckets (id, name, owner, public)
    VALUES (bucket_name, bucket_name, NEW.id, false);
    
    -- Log the creation (optional)
    RAISE NOTICE 'Created new bucket % for user %', bucket_name, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.user_settings (user_id)
  values (new.id);
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_profile_updated()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.hybrid_search(query_text text, query_embedding extensions.vector, match_count integer DEFAULT 10)
 RETURNS TABLE(id text, title text, content text, metadata jsonb, similarity double precision, rank double precision)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- function logic here
END;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_workflow_version()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
			BEGIN
				IF NEW."versionCounter" IS NOT DISTINCT FROM OLD."versionCounter" THEN
					NEW."versionCounter" = OLD."versionCounter" + 1;
				END IF;
				RETURN NEW;
			END;
			$function$
;

CREATE OR REPLACE FUNCTION public.log_user_action(user_id uuid, action text, details jsonb DEFAULT '{}'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  record_id uuid;
begin
  insert into public.analytics (user_id, event_type, event_data)
  values (user_id, action, details)
  returning id into record_id;
  
  return record_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.match_documents(query_embedding extensions.vector, match_count integer DEFAULT 10, filter jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(id text, title text, content text, metadata jsonb, similarity double precision)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.title,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM public.documents
  WHERE documents.metadata @> filter
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.match_ollama_documents(query_embedding extensions.vector, match_count integer DEFAULT 10, filter jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(id text, title text, content text, metadata jsonb, similarity double precision)
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    ollama_documents.id,
    ollama_documents.title,
    ollama_documents.content,
    ollama_documents.metadata,
    1 - (ollama_documents.embedding <=> query_embedding) AS similarity
  FROM public.ollama_documents
  WHERE ollama_documents.metadata @> filter
  ORDER BY ollama_documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_profiles_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ begin new.updated_at = now(); return new; end; $function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ begin new.updated_at = now(); return new; end; $function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at_metadata()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.update_spotify_recommendations_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.uuid_generate_v4()
 RETURNS uuid
 LANGUAGE sql
 STABLE
AS $function$SELECT extensions.uuid_generate_v4()$function$
;

create or replace view "stripe"."sync_runs" as  SELECT r._account_id AS account_id,
    r.started_at,
    r.closed_at,
    r.triggered_by,
    r.max_concurrent,
    COALESCE(sum(o.processed_count), (0)::bigint) AS total_processed,
    count(o.*) AS total_objects,
    count(*) FILTER (WHERE (o.status = 'complete'::text)) AS complete_count,
    count(*) FILTER (WHERE (o.status = 'error'::text)) AS error_count,
    count(*) FILTER (WHERE (o.status = 'running'::text)) AS running_count,
    count(*) FILTER (WHERE (o.status = 'pending'::text)) AS pending_count,
    string_agg(o.error_message, '; '::text) FILTER (WHERE (o.error_message IS NOT NULL)) AS error_message,
        CASE
            WHEN ((r.closed_at IS NULL) AND (count(*) FILTER (WHERE (o.status = 'running'::text)) > 0)) THEN 'running'::text
            WHEN ((r.closed_at IS NULL) AND ((count(o.*) = 0) OR (count(o.*) = count(*) FILTER (WHERE (o.status = 'pending'::text))))) THEN 'pending'::text
            WHEN (r.closed_at IS NULL) THEN 'running'::text
            WHEN (count(*) FILTER (WHERE (o.status = 'error'::text)) > 0) THEN 'error'::text
            ELSE 'complete'::text
        END AS status
   FROM (stripe._sync_runs r
     LEFT JOIN stripe._sync_obj_runs o ON (((o._account_id = r._account_id) AND (o.run_started_at = r.started_at))))
  GROUP BY r._account_id, r.started_at, r.closed_at, r.triggered_by, r.max_concurrent;


grant delete on table "public"."ai_agents" to "anon";

grant insert on table "public"."ai_agents" to "anon";

grant references on table "public"."ai_agents" to "anon";

grant select on table "public"."ai_agents" to "anon";

grant trigger on table "public"."ai_agents" to "anon";

grant truncate on table "public"."ai_agents" to "anon";

grant update on table "public"."ai_agents" to "anon";

grant delete on table "public"."ai_agents" to "authenticated";

grant insert on table "public"."ai_agents" to "authenticated";

grant references on table "public"."ai_agents" to "authenticated";

grant select on table "public"."ai_agents" to "authenticated";

grant trigger on table "public"."ai_agents" to "authenticated";

grant truncate on table "public"."ai_agents" to "authenticated";

grant update on table "public"."ai_agents" to "authenticated";

grant delete on table "public"."ai_agents" to "service_role";

grant insert on table "public"."ai_agents" to "service_role";

grant references on table "public"."ai_agents" to "service_role";

grant select on table "public"."ai_agents" to "service_role";

grant trigger on table "public"."ai_agents" to "service_role";

grant truncate on table "public"."ai_agents" to "service_role";

grant update on table "public"."ai_agents" to "service_role";

grant delete on table "public"."albums" to "anon";

grant insert on table "public"."albums" to "anon";

grant references on table "public"."albums" to "anon";

grant select on table "public"."albums" to "anon";

grant trigger on table "public"."albums" to "anon";

grant truncate on table "public"."albums" to "anon";

grant update on table "public"."albums" to "anon";

grant delete on table "public"."albums" to "authenticated";

grant insert on table "public"."albums" to "authenticated";

grant references on table "public"."albums" to "authenticated";

grant select on table "public"."albums" to "authenticated";

grant trigger on table "public"."albums" to "authenticated";

grant truncate on table "public"."albums" to "authenticated";

grant update on table "public"."albums" to "authenticated";

grant delete on table "public"."albums" to "service_role";

grant insert on table "public"."albums" to "service_role";

grant references on table "public"."albums" to "service_role";

grant select on table "public"."albums" to "service_role";

grant trigger on table "public"."albums" to "service_role";

grant truncate on table "public"."albums" to "service_role";

grant update on table "public"."albums" to "service_role";

grant delete on table "public"."analytics" to "anon";

grant insert on table "public"."analytics" to "anon";

grant references on table "public"."analytics" to "anon";

grant select on table "public"."analytics" to "anon";

grant trigger on table "public"."analytics" to "anon";

grant truncate on table "public"."analytics" to "anon";

grant update on table "public"."analytics" to "anon";

grant delete on table "public"."analytics" to "authenticated";

grant insert on table "public"."analytics" to "authenticated";

grant references on table "public"."analytics" to "authenticated";

grant select on table "public"."analytics" to "authenticated";

grant trigger on table "public"."analytics" to "authenticated";

grant truncate on table "public"."analytics" to "authenticated";

grant update on table "public"."analytics" to "authenticated";

grant delete on table "public"."analytics" to "service_role";

grant insert on table "public"."analytics" to "service_role";

grant references on table "public"."analytics" to "service_role";

grant select on table "public"."analytics" to "service_role";

grant trigger on table "public"."analytics" to "service_role";

grant truncate on table "public"."analytics" to "service_role";

grant update on table "public"."analytics" to "service_role";

grant delete on table "public"."annotation_tag_entity" to "anon";

grant insert on table "public"."annotation_tag_entity" to "anon";

grant references on table "public"."annotation_tag_entity" to "anon";

grant select on table "public"."annotation_tag_entity" to "anon";

grant trigger on table "public"."annotation_tag_entity" to "anon";

grant truncate on table "public"."annotation_tag_entity" to "anon";

grant update on table "public"."annotation_tag_entity" to "anon";

grant delete on table "public"."annotation_tag_entity" to "authenticated";

grant insert on table "public"."annotation_tag_entity" to "authenticated";

grant references on table "public"."annotation_tag_entity" to "authenticated";

grant select on table "public"."annotation_tag_entity" to "authenticated";

grant trigger on table "public"."annotation_tag_entity" to "authenticated";

grant truncate on table "public"."annotation_tag_entity" to "authenticated";

grant update on table "public"."annotation_tag_entity" to "authenticated";

grant delete on table "public"."annotation_tag_entity" to "service_role";

grant insert on table "public"."annotation_tag_entity" to "service_role";

grant references on table "public"."annotation_tag_entity" to "service_role";

grant select on table "public"."annotation_tag_entity" to "service_role";

grant trigger on table "public"."annotation_tag_entity" to "service_role";

grant truncate on table "public"."annotation_tag_entity" to "service_role";

grant update on table "public"."annotation_tag_entity" to "service_role";

grant delete on table "public"."apikey" to "anon";

grant insert on table "public"."apikey" to "anon";

grant references on table "public"."apikey" to "anon";

grant select on table "public"."apikey" to "anon";

grant trigger on table "public"."apikey" to "anon";

grant truncate on table "public"."apikey" to "anon";

grant update on table "public"."apikey" to "anon";

grant delete on table "public"."apikey" to "authenticated";

grant insert on table "public"."apikey" to "authenticated";

grant references on table "public"."apikey" to "authenticated";

grant select on table "public"."apikey" to "authenticated";

grant trigger on table "public"."apikey" to "authenticated";

grant truncate on table "public"."apikey" to "authenticated";

grant update on table "public"."apikey" to "authenticated";

grant delete on table "public"."apikey" to "service_role";

grant insert on table "public"."apikey" to "service_role";

grant references on table "public"."apikey" to "service_role";

grant select on table "public"."apikey" to "service_role";

grant trigger on table "public"."apikey" to "service_role";

grant truncate on table "public"."apikey" to "service_role";

grant update on table "public"."apikey" to "service_role";

grant delete on table "public"."artists" to "anon";

grant insert on table "public"."artists" to "anon";

grant references on table "public"."artists" to "anon";

grant select on table "public"."artists" to "anon";

grant trigger on table "public"."artists" to "anon";

grant truncate on table "public"."artists" to "anon";

grant update on table "public"."artists" to "anon";

grant delete on table "public"."artists" to "authenticated";

grant insert on table "public"."artists" to "authenticated";

grant references on table "public"."artists" to "authenticated";

grant select on table "public"."artists" to "authenticated";

grant trigger on table "public"."artists" to "authenticated";

grant truncate on table "public"."artists" to "authenticated";

grant update on table "public"."artists" to "authenticated";

grant delete on table "public"."artists" to "service_role";

grant insert on table "public"."artists" to "service_role";

grant references on table "public"."artists" to "service_role";

grant select on table "public"."artists" to "service_role";

grant trigger on table "public"."artists" to "service_role";

grant truncate on table "public"."artists" to "service_role";

grant update on table "public"."artists" to "service_role";

grant delete on table "public"."assistant" to "anon";

grant insert on table "public"."assistant" to "anon";

grant references on table "public"."assistant" to "anon";

grant select on table "public"."assistant" to "anon";

grant trigger on table "public"."assistant" to "anon";

grant truncate on table "public"."assistant" to "anon";

grant update on table "public"."assistant" to "anon";

grant delete on table "public"."assistant" to "authenticated";

grant insert on table "public"."assistant" to "authenticated";

grant references on table "public"."assistant" to "authenticated";

grant select on table "public"."assistant" to "authenticated";

grant trigger on table "public"."assistant" to "authenticated";

grant truncate on table "public"."assistant" to "authenticated";

grant update on table "public"."assistant" to "authenticated";

grant delete on table "public"."assistant" to "service_role";

grant insert on table "public"."assistant" to "service_role";

grant references on table "public"."assistant" to "service_role";

grant select on table "public"."assistant" to "service_role";

grant trigger on table "public"."assistant" to "service_role";

grant truncate on table "public"."assistant" to "service_role";

grant update on table "public"."assistant" to "service_role";

grant delete on table "public"."auth_identity" to "anon";

grant insert on table "public"."auth_identity" to "anon";

grant references on table "public"."auth_identity" to "anon";

grant select on table "public"."auth_identity" to "anon";

grant trigger on table "public"."auth_identity" to "anon";

grant truncate on table "public"."auth_identity" to "anon";

grant update on table "public"."auth_identity" to "anon";

grant delete on table "public"."auth_identity" to "authenticated";

grant insert on table "public"."auth_identity" to "authenticated";

grant references on table "public"."auth_identity" to "authenticated";

grant select on table "public"."auth_identity" to "authenticated";

grant trigger on table "public"."auth_identity" to "authenticated";

grant truncate on table "public"."auth_identity" to "authenticated";

grant update on table "public"."auth_identity" to "authenticated";

grant delete on table "public"."auth_identity" to "service_role";

grant insert on table "public"."auth_identity" to "service_role";

grant references on table "public"."auth_identity" to "service_role";

grant select on table "public"."auth_identity" to "service_role";

grant trigger on table "public"."auth_identity" to "service_role";

grant truncate on table "public"."auth_identity" to "service_role";

grant update on table "public"."auth_identity" to "service_role";

grant delete on table "public"."auth_provider_sync_history" to "anon";

grant insert on table "public"."auth_provider_sync_history" to "anon";

grant references on table "public"."auth_provider_sync_history" to "anon";

grant select on table "public"."auth_provider_sync_history" to "anon";

grant trigger on table "public"."auth_provider_sync_history" to "anon";

grant truncate on table "public"."auth_provider_sync_history" to "anon";

grant update on table "public"."auth_provider_sync_history" to "anon";

grant delete on table "public"."auth_provider_sync_history" to "authenticated";

grant insert on table "public"."auth_provider_sync_history" to "authenticated";

grant references on table "public"."auth_provider_sync_history" to "authenticated";

grant select on table "public"."auth_provider_sync_history" to "authenticated";

grant trigger on table "public"."auth_provider_sync_history" to "authenticated";

grant truncate on table "public"."auth_provider_sync_history" to "authenticated";

grant update on table "public"."auth_provider_sync_history" to "authenticated";

grant delete on table "public"."auth_provider_sync_history" to "service_role";

grant insert on table "public"."auth_provider_sync_history" to "service_role";

grant references on table "public"."auth_provider_sync_history" to "service_role";

grant select on table "public"."auth_provider_sync_history" to "service_role";

grant trigger on table "public"."auth_provider_sync_history" to "service_role";

grant truncate on table "public"."auth_provider_sync_history" to "service_role";

grant update on table "public"."auth_provider_sync_history" to "service_role";

grant delete on table "public"."binary_data" to "anon";

grant insert on table "public"."binary_data" to "anon";

grant references on table "public"."binary_data" to "anon";

grant select on table "public"."binary_data" to "anon";

grant trigger on table "public"."binary_data" to "anon";

grant truncate on table "public"."binary_data" to "anon";

grant update on table "public"."binary_data" to "anon";

grant delete on table "public"."binary_data" to "authenticated";

grant insert on table "public"."binary_data" to "authenticated";

grant references on table "public"."binary_data" to "authenticated";

grant select on table "public"."binary_data" to "authenticated";

grant trigger on table "public"."binary_data" to "authenticated";

grant truncate on table "public"."binary_data" to "authenticated";

grant update on table "public"."binary_data" to "authenticated";

grant delete on table "public"."binary_data" to "service_role";

grant insert on table "public"."binary_data" to "service_role";

grant references on table "public"."binary_data" to "service_role";

grant select on table "public"."binary_data" to "service_role";

grant trigger on table "public"."binary_data" to "service_role";

grant truncate on table "public"."binary_data" to "service_role";

grant update on table "public"."binary_data" to "service_role";

grant delete on table "public"."chat_flow" to "anon";

grant insert on table "public"."chat_flow" to "anon";

grant references on table "public"."chat_flow" to "anon";

grant select on table "public"."chat_flow" to "anon";

grant trigger on table "public"."chat_flow" to "anon";

grant truncate on table "public"."chat_flow" to "anon";

grant update on table "public"."chat_flow" to "anon";

grant delete on table "public"."chat_flow" to "authenticated";

grant insert on table "public"."chat_flow" to "authenticated";

grant references on table "public"."chat_flow" to "authenticated";

grant select on table "public"."chat_flow" to "authenticated";

grant trigger on table "public"."chat_flow" to "authenticated";

grant truncate on table "public"."chat_flow" to "authenticated";

grant update on table "public"."chat_flow" to "authenticated";

grant delete on table "public"."chat_flow" to "service_role";

grant insert on table "public"."chat_flow" to "service_role";

grant references on table "public"."chat_flow" to "service_role";

grant select on table "public"."chat_flow" to "service_role";

grant trigger on table "public"."chat_flow" to "service_role";

grant truncate on table "public"."chat_flow" to "service_role";

grant update on table "public"."chat_flow" to "service_role";

grant delete on table "public"."chat_hub_agents" to "anon";

grant insert on table "public"."chat_hub_agents" to "anon";

grant references on table "public"."chat_hub_agents" to "anon";

grant select on table "public"."chat_hub_agents" to "anon";

grant trigger on table "public"."chat_hub_agents" to "anon";

grant truncate on table "public"."chat_hub_agents" to "anon";

grant update on table "public"."chat_hub_agents" to "anon";

grant delete on table "public"."chat_hub_agents" to "authenticated";

grant insert on table "public"."chat_hub_agents" to "authenticated";

grant references on table "public"."chat_hub_agents" to "authenticated";

grant select on table "public"."chat_hub_agents" to "authenticated";

grant trigger on table "public"."chat_hub_agents" to "authenticated";

grant truncate on table "public"."chat_hub_agents" to "authenticated";

grant update on table "public"."chat_hub_agents" to "authenticated";

grant delete on table "public"."chat_hub_agents" to "service_role";

grant insert on table "public"."chat_hub_agents" to "service_role";

grant references on table "public"."chat_hub_agents" to "service_role";

grant select on table "public"."chat_hub_agents" to "service_role";

grant trigger on table "public"."chat_hub_agents" to "service_role";

grant truncate on table "public"."chat_hub_agents" to "service_role";

grant update on table "public"."chat_hub_agents" to "service_role";

grant delete on table "public"."chat_hub_messages" to "anon";

grant insert on table "public"."chat_hub_messages" to "anon";

grant references on table "public"."chat_hub_messages" to "anon";

grant select on table "public"."chat_hub_messages" to "anon";

grant trigger on table "public"."chat_hub_messages" to "anon";

grant truncate on table "public"."chat_hub_messages" to "anon";

grant update on table "public"."chat_hub_messages" to "anon";

grant delete on table "public"."chat_hub_messages" to "authenticated";

grant insert on table "public"."chat_hub_messages" to "authenticated";

grant references on table "public"."chat_hub_messages" to "authenticated";

grant select on table "public"."chat_hub_messages" to "authenticated";

grant trigger on table "public"."chat_hub_messages" to "authenticated";

grant truncate on table "public"."chat_hub_messages" to "authenticated";

grant update on table "public"."chat_hub_messages" to "authenticated";

grant delete on table "public"."chat_hub_messages" to "service_role";

grant insert on table "public"."chat_hub_messages" to "service_role";

grant references on table "public"."chat_hub_messages" to "service_role";

grant select on table "public"."chat_hub_messages" to "service_role";

grant trigger on table "public"."chat_hub_messages" to "service_role";

grant truncate on table "public"."chat_hub_messages" to "service_role";

grant update on table "public"."chat_hub_messages" to "service_role";

grant delete on table "public"."chat_hub_sessions" to "anon";

grant insert on table "public"."chat_hub_sessions" to "anon";

grant references on table "public"."chat_hub_sessions" to "anon";

grant select on table "public"."chat_hub_sessions" to "anon";

grant trigger on table "public"."chat_hub_sessions" to "anon";

grant truncate on table "public"."chat_hub_sessions" to "anon";

grant update on table "public"."chat_hub_sessions" to "anon";

grant delete on table "public"."chat_hub_sessions" to "authenticated";

grant insert on table "public"."chat_hub_sessions" to "authenticated";

grant references on table "public"."chat_hub_sessions" to "authenticated";

grant select on table "public"."chat_hub_sessions" to "authenticated";

grant trigger on table "public"."chat_hub_sessions" to "authenticated";

grant truncate on table "public"."chat_hub_sessions" to "authenticated";

grant update on table "public"."chat_hub_sessions" to "authenticated";

grant delete on table "public"."chat_hub_sessions" to "service_role";

grant insert on table "public"."chat_hub_sessions" to "service_role";

grant references on table "public"."chat_hub_sessions" to "service_role";

grant select on table "public"."chat_hub_sessions" to "service_role";

grant trigger on table "public"."chat_hub_sessions" to "service_role";

grant truncate on table "public"."chat_hub_sessions" to "service_role";

grant update on table "public"."chat_hub_sessions" to "service_role";

grant delete on table "public"."chat_message" to "anon";

grant insert on table "public"."chat_message" to "anon";

grant references on table "public"."chat_message" to "anon";

grant select on table "public"."chat_message" to "anon";

grant trigger on table "public"."chat_message" to "anon";

grant truncate on table "public"."chat_message" to "anon";

grant update on table "public"."chat_message" to "anon";

grant delete on table "public"."chat_message" to "authenticated";

grant insert on table "public"."chat_message" to "authenticated";

grant references on table "public"."chat_message" to "authenticated";

grant select on table "public"."chat_message" to "authenticated";

grant trigger on table "public"."chat_message" to "authenticated";

grant truncate on table "public"."chat_message" to "authenticated";

grant update on table "public"."chat_message" to "authenticated";

grant delete on table "public"."chat_message" to "service_role";

grant insert on table "public"."chat_message" to "service_role";

grant references on table "public"."chat_message" to "service_role";

grant select on table "public"."chat_message" to "service_role";

grant trigger on table "public"."chat_message" to "service_role";

grant truncate on table "public"."chat_message" to "service_role";

grant update on table "public"."chat_message" to "service_role";

grant delete on table "public"."chat_message_feedback" to "anon";

grant insert on table "public"."chat_message_feedback" to "anon";

grant references on table "public"."chat_message_feedback" to "anon";

grant select on table "public"."chat_message_feedback" to "anon";

grant trigger on table "public"."chat_message_feedback" to "anon";

grant truncate on table "public"."chat_message_feedback" to "anon";

grant update on table "public"."chat_message_feedback" to "anon";

grant delete on table "public"."chat_message_feedback" to "authenticated";

grant insert on table "public"."chat_message_feedback" to "authenticated";

grant references on table "public"."chat_message_feedback" to "authenticated";

grant select on table "public"."chat_message_feedback" to "authenticated";

grant trigger on table "public"."chat_message_feedback" to "authenticated";

grant truncate on table "public"."chat_message_feedback" to "authenticated";

grant update on table "public"."chat_message_feedback" to "authenticated";

grant delete on table "public"."chat_message_feedback" to "service_role";

grant insert on table "public"."chat_message_feedback" to "service_role";

grant references on table "public"."chat_message_feedback" to "service_role";

grant select on table "public"."chat_message_feedback" to "service_role";

grant trigger on table "public"."chat_message_feedback" to "service_role";

grant truncate on table "public"."chat_message_feedback" to "service_role";

grant update on table "public"."chat_message_feedback" to "service_role";

grant delete on table "public"."conversations" to "anon";

grant insert on table "public"."conversations" to "anon";

grant references on table "public"."conversations" to "anon";

grant select on table "public"."conversations" to "anon";

grant trigger on table "public"."conversations" to "anon";

grant truncate on table "public"."conversations" to "anon";

grant update on table "public"."conversations" to "anon";

grant delete on table "public"."conversations" to "authenticated";

grant insert on table "public"."conversations" to "authenticated";

grant references on table "public"."conversations" to "authenticated";

grant select on table "public"."conversations" to "authenticated";

grant trigger on table "public"."conversations" to "authenticated";

grant truncate on table "public"."conversations" to "authenticated";

grant update on table "public"."conversations" to "authenticated";

grant delete on table "public"."conversations" to "service_role";

grant insert on table "public"."conversations" to "service_role";

grant references on table "public"."conversations" to "service_role";

grant select on table "public"."conversations" to "service_role";

grant trigger on table "public"."conversations" to "service_role";

grant truncate on table "public"."conversations" to "service_role";

grant update on table "public"."conversations" to "service_role";

grant delete on table "public"."credential" to "anon";

grant insert on table "public"."credential" to "anon";

grant references on table "public"."credential" to "anon";

grant select on table "public"."credential" to "anon";

grant trigger on table "public"."credential" to "anon";

grant truncate on table "public"."credential" to "anon";

grant update on table "public"."credential" to "anon";

grant delete on table "public"."credential" to "authenticated";

grant insert on table "public"."credential" to "authenticated";

grant references on table "public"."credential" to "authenticated";

grant select on table "public"."credential" to "authenticated";

grant trigger on table "public"."credential" to "authenticated";

grant truncate on table "public"."credential" to "authenticated";

grant update on table "public"."credential" to "authenticated";

grant delete on table "public"."credential" to "service_role";

grant insert on table "public"."credential" to "service_role";

grant references on table "public"."credential" to "service_role";

grant select on table "public"."credential" to "service_role";

grant trigger on table "public"."credential" to "service_role";

grant truncate on table "public"."credential" to "service_role";

grant update on table "public"."credential" to "service_role";

grant delete on table "public"."credentials_entity" to "anon";

grant insert on table "public"."credentials_entity" to "anon";

grant references on table "public"."credentials_entity" to "anon";

grant select on table "public"."credentials_entity" to "anon";

grant trigger on table "public"."credentials_entity" to "anon";

grant truncate on table "public"."credentials_entity" to "anon";

grant update on table "public"."credentials_entity" to "anon";

grant delete on table "public"."credentials_entity" to "authenticated";

grant insert on table "public"."credentials_entity" to "authenticated";

grant references on table "public"."credentials_entity" to "authenticated";

grant select on table "public"."credentials_entity" to "authenticated";

grant trigger on table "public"."credentials_entity" to "authenticated";

grant truncate on table "public"."credentials_entity" to "authenticated";

grant update on table "public"."credentials_entity" to "authenticated";

grant delete on table "public"."credentials_entity" to "service_role";

grant insert on table "public"."credentials_entity" to "service_role";

grant references on table "public"."credentials_entity" to "service_role";

grant select on table "public"."credentials_entity" to "service_role";

grant trigger on table "public"."credentials_entity" to "service_role";

grant truncate on table "public"."credentials_entity" to "service_role";

grant update on table "public"."credentials_entity" to "service_role";

grant delete on table "public"."custom_template" to "anon";

grant insert on table "public"."custom_template" to "anon";

grant references on table "public"."custom_template" to "anon";

grant select on table "public"."custom_template" to "anon";

grant trigger on table "public"."custom_template" to "anon";

grant truncate on table "public"."custom_template" to "anon";

grant update on table "public"."custom_template" to "anon";

grant delete on table "public"."custom_template" to "authenticated";

grant insert on table "public"."custom_template" to "authenticated";

grant references on table "public"."custom_template" to "authenticated";

grant select on table "public"."custom_template" to "authenticated";

grant trigger on table "public"."custom_template" to "authenticated";

grant truncate on table "public"."custom_template" to "authenticated";

grant update on table "public"."custom_template" to "authenticated";

grant delete on table "public"."custom_template" to "service_role";

grant insert on table "public"."custom_template" to "service_role";

grant references on table "public"."custom_template" to "service_role";

grant select on table "public"."custom_template" to "service_role";

grant trigger on table "public"."custom_template" to "service_role";

grant truncate on table "public"."custom_template" to "service_role";

grant update on table "public"."custom_template" to "service_role";

grant delete on table "public"."customers" to "anon";

grant insert on table "public"."customers" to "anon";

grant references on table "public"."customers" to "anon";

grant select on table "public"."customers" to "anon";

grant trigger on table "public"."customers" to "anon";

grant truncate on table "public"."customers" to "anon";

grant update on table "public"."customers" to "anon";

grant delete on table "public"."customers" to "authenticated";

grant insert on table "public"."customers" to "authenticated";

grant references on table "public"."customers" to "authenticated";

grant select on table "public"."customers" to "authenticated";

grant trigger on table "public"."customers" to "authenticated";

grant truncate on table "public"."customers" to "authenticated";

grant update on table "public"."customers" to "authenticated";

grant delete on table "public"."customers" to "service_role";

grant insert on table "public"."customers" to "service_role";

grant references on table "public"."customers" to "service_role";

grant select on table "public"."customers" to "service_role";

grant trigger on table "public"."customers" to "service_role";

grant truncate on table "public"."customers" to "service_role";

grant update on table "public"."customers" to "service_role";

grant delete on table "public"."data_table" to "anon";

grant insert on table "public"."data_table" to "anon";

grant references on table "public"."data_table" to "anon";

grant select on table "public"."data_table" to "anon";

grant trigger on table "public"."data_table" to "anon";

grant truncate on table "public"."data_table" to "anon";

grant update on table "public"."data_table" to "anon";

grant delete on table "public"."data_table" to "authenticated";

grant insert on table "public"."data_table" to "authenticated";

grant references on table "public"."data_table" to "authenticated";

grant select on table "public"."data_table" to "authenticated";

grant trigger on table "public"."data_table" to "authenticated";

grant truncate on table "public"."data_table" to "authenticated";

grant update on table "public"."data_table" to "authenticated";

grant delete on table "public"."data_table" to "service_role";

grant insert on table "public"."data_table" to "service_role";

grant references on table "public"."data_table" to "service_role";

grant select on table "public"."data_table" to "service_role";

grant trigger on table "public"."data_table" to "service_role";

grant truncate on table "public"."data_table" to "service_role";

grant update on table "public"."data_table" to "service_role";

grant delete on table "public"."data_table_column" to "anon";

grant insert on table "public"."data_table_column" to "anon";

grant references on table "public"."data_table_column" to "anon";

grant select on table "public"."data_table_column" to "anon";

grant trigger on table "public"."data_table_column" to "anon";

grant truncate on table "public"."data_table_column" to "anon";

grant update on table "public"."data_table_column" to "anon";

grant delete on table "public"."data_table_column" to "authenticated";

grant insert on table "public"."data_table_column" to "authenticated";

grant references on table "public"."data_table_column" to "authenticated";

grant select on table "public"."data_table_column" to "authenticated";

grant trigger on table "public"."data_table_column" to "authenticated";

grant truncate on table "public"."data_table_column" to "authenticated";

grant update on table "public"."data_table_column" to "authenticated";

grant delete on table "public"."data_table_column" to "service_role";

grant insert on table "public"."data_table_column" to "service_role";

grant references on table "public"."data_table_column" to "service_role";

grant select on table "public"."data_table_column" to "service_role";

grant trigger on table "public"."data_table_column" to "service_role";

grant truncate on table "public"."data_table_column" to "service_role";

grant update on table "public"."data_table_column" to "service_role";

grant delete on table "public"."document_store" to "anon";

grant insert on table "public"."document_store" to "anon";

grant references on table "public"."document_store" to "anon";

grant select on table "public"."document_store" to "anon";

grant trigger on table "public"."document_store" to "anon";

grant truncate on table "public"."document_store" to "anon";

grant update on table "public"."document_store" to "anon";

grant delete on table "public"."document_store" to "authenticated";

grant insert on table "public"."document_store" to "authenticated";

grant references on table "public"."document_store" to "authenticated";

grant select on table "public"."document_store" to "authenticated";

grant trigger on table "public"."document_store" to "authenticated";

grant truncate on table "public"."document_store" to "authenticated";

grant update on table "public"."document_store" to "authenticated";

grant delete on table "public"."document_store" to "service_role";

grant insert on table "public"."document_store" to "service_role";

grant references on table "public"."document_store" to "service_role";

grant select on table "public"."document_store" to "service_role";

grant trigger on table "public"."document_store" to "service_role";

grant truncate on table "public"."document_store" to "service_role";

grant update on table "public"."document_store" to "service_role";

grant delete on table "public"."document_store_file_chunk" to "anon";

grant insert on table "public"."document_store_file_chunk" to "anon";

grant references on table "public"."document_store_file_chunk" to "anon";

grant select on table "public"."document_store_file_chunk" to "anon";

grant trigger on table "public"."document_store_file_chunk" to "anon";

grant truncate on table "public"."document_store_file_chunk" to "anon";

grant update on table "public"."document_store_file_chunk" to "anon";

grant delete on table "public"."document_store_file_chunk" to "authenticated";

grant insert on table "public"."document_store_file_chunk" to "authenticated";

grant references on table "public"."document_store_file_chunk" to "authenticated";

grant select on table "public"."document_store_file_chunk" to "authenticated";

grant trigger on table "public"."document_store_file_chunk" to "authenticated";

grant truncate on table "public"."document_store_file_chunk" to "authenticated";

grant update on table "public"."document_store_file_chunk" to "authenticated";

grant delete on table "public"."document_store_file_chunk" to "service_role";

grant insert on table "public"."document_store_file_chunk" to "service_role";

grant references on table "public"."document_store_file_chunk" to "service_role";

grant select on table "public"."document_store_file_chunk" to "service_role";

grant trigger on table "public"."document_store_file_chunk" to "service_role";

grant truncate on table "public"."document_store_file_chunk" to "service_role";

grant update on table "public"."document_store_file_chunk" to "service_role";

grant delete on table "public"."documents" to "anon";

grant insert on table "public"."documents" to "anon";

grant references on table "public"."documents" to "anon";

grant select on table "public"."documents" to "anon";

grant trigger on table "public"."documents" to "anon";

grant truncate on table "public"."documents" to "anon";

grant update on table "public"."documents" to "anon";

grant delete on table "public"."documents" to "authenticated";

grant insert on table "public"."documents" to "authenticated";

grant references on table "public"."documents" to "authenticated";

grant select on table "public"."documents" to "authenticated";

grant trigger on table "public"."documents" to "authenticated";

grant truncate on table "public"."documents" to "authenticated";

grant update on table "public"."documents" to "authenticated";

grant delete on table "public"."documents" to "service_role";

grant insert on table "public"."documents" to "service_role";

grant references on table "public"."documents" to "service_role";

grant select on table "public"."documents" to "service_role";

grant trigger on table "public"."documents" to "service_role";

grant truncate on table "public"."documents" to "service_role";

grant update on table "public"."documents" to "service_role";

grant delete on table "public"."dynamic_credential_entry" to "anon";

grant insert on table "public"."dynamic_credential_entry" to "anon";

grant references on table "public"."dynamic_credential_entry" to "anon";

grant select on table "public"."dynamic_credential_entry" to "anon";

grant trigger on table "public"."dynamic_credential_entry" to "anon";

grant truncate on table "public"."dynamic_credential_entry" to "anon";

grant update on table "public"."dynamic_credential_entry" to "anon";

grant delete on table "public"."dynamic_credential_entry" to "authenticated";

grant insert on table "public"."dynamic_credential_entry" to "authenticated";

grant references on table "public"."dynamic_credential_entry" to "authenticated";

grant select on table "public"."dynamic_credential_entry" to "authenticated";

grant trigger on table "public"."dynamic_credential_entry" to "authenticated";

grant truncate on table "public"."dynamic_credential_entry" to "authenticated";

grant update on table "public"."dynamic_credential_entry" to "authenticated";

grant delete on table "public"."dynamic_credential_entry" to "service_role";

grant insert on table "public"."dynamic_credential_entry" to "service_role";

grant references on table "public"."dynamic_credential_entry" to "service_role";

grant select on table "public"."dynamic_credential_entry" to "service_role";

grant trigger on table "public"."dynamic_credential_entry" to "service_role";

grant truncate on table "public"."dynamic_credential_entry" to "service_role";

grant update on table "public"."dynamic_credential_entry" to "service_role";

grant delete on table "public"."dynamic_credential_resolver" to "anon";

grant insert on table "public"."dynamic_credential_resolver" to "anon";

grant references on table "public"."dynamic_credential_resolver" to "anon";

grant select on table "public"."dynamic_credential_resolver" to "anon";

grant trigger on table "public"."dynamic_credential_resolver" to "anon";

grant truncate on table "public"."dynamic_credential_resolver" to "anon";

grant update on table "public"."dynamic_credential_resolver" to "anon";

grant delete on table "public"."dynamic_credential_resolver" to "authenticated";

grant insert on table "public"."dynamic_credential_resolver" to "authenticated";

grant references on table "public"."dynamic_credential_resolver" to "authenticated";

grant select on table "public"."dynamic_credential_resolver" to "authenticated";

grant trigger on table "public"."dynamic_credential_resolver" to "authenticated";

grant truncate on table "public"."dynamic_credential_resolver" to "authenticated";

grant update on table "public"."dynamic_credential_resolver" to "authenticated";

grant delete on table "public"."dynamic_credential_resolver" to "service_role";

grant insert on table "public"."dynamic_credential_resolver" to "service_role";

grant references on table "public"."dynamic_credential_resolver" to "service_role";

grant select on table "public"."dynamic_credential_resolver" to "service_role";

grant trigger on table "public"."dynamic_credential_resolver" to "service_role";

grant truncate on table "public"."dynamic_credential_resolver" to "service_role";

grant update on table "public"."dynamic_credential_resolver" to "service_role";

grant delete on table "public"."event_destinations" to "anon";

grant insert on table "public"."event_destinations" to "anon";

grant references on table "public"."event_destinations" to "anon";

grant select on table "public"."event_destinations" to "anon";

grant trigger on table "public"."event_destinations" to "anon";

grant truncate on table "public"."event_destinations" to "anon";

grant update on table "public"."event_destinations" to "anon";

grant delete on table "public"."event_destinations" to "authenticated";

grant insert on table "public"."event_destinations" to "authenticated";

grant references on table "public"."event_destinations" to "authenticated";

grant select on table "public"."event_destinations" to "authenticated";

grant trigger on table "public"."event_destinations" to "authenticated";

grant truncate on table "public"."event_destinations" to "authenticated";

grant update on table "public"."event_destinations" to "authenticated";

grant delete on table "public"."event_destinations" to "service_role";

grant insert on table "public"."event_destinations" to "service_role";

grant references on table "public"."event_destinations" to "service_role";

grant select on table "public"."event_destinations" to "service_role";

grant trigger on table "public"."event_destinations" to "service_role";

grant truncate on table "public"."event_destinations" to "service_role";

grant update on table "public"."event_destinations" to "service_role";

grant delete on table "public"."execution_annotation_tags" to "anon";

grant insert on table "public"."execution_annotation_tags" to "anon";

grant references on table "public"."execution_annotation_tags" to "anon";

grant select on table "public"."execution_annotation_tags" to "anon";

grant trigger on table "public"."execution_annotation_tags" to "anon";

grant truncate on table "public"."execution_annotation_tags" to "anon";

grant update on table "public"."execution_annotation_tags" to "anon";

grant delete on table "public"."execution_annotation_tags" to "authenticated";

grant insert on table "public"."execution_annotation_tags" to "authenticated";

grant references on table "public"."execution_annotation_tags" to "authenticated";

grant select on table "public"."execution_annotation_tags" to "authenticated";

grant trigger on table "public"."execution_annotation_tags" to "authenticated";

grant truncate on table "public"."execution_annotation_tags" to "authenticated";

grant update on table "public"."execution_annotation_tags" to "authenticated";

grant delete on table "public"."execution_annotation_tags" to "service_role";

grant insert on table "public"."execution_annotation_tags" to "service_role";

grant references on table "public"."execution_annotation_tags" to "service_role";

grant select on table "public"."execution_annotation_tags" to "service_role";

grant trigger on table "public"."execution_annotation_tags" to "service_role";

grant truncate on table "public"."execution_annotation_tags" to "service_role";

grant update on table "public"."execution_annotation_tags" to "service_role";

grant delete on table "public"."execution_annotations" to "anon";

grant insert on table "public"."execution_annotations" to "anon";

grant references on table "public"."execution_annotations" to "anon";

grant select on table "public"."execution_annotations" to "anon";

grant trigger on table "public"."execution_annotations" to "anon";

grant truncate on table "public"."execution_annotations" to "anon";

grant update on table "public"."execution_annotations" to "anon";

grant delete on table "public"."execution_annotations" to "authenticated";

grant insert on table "public"."execution_annotations" to "authenticated";

grant references on table "public"."execution_annotations" to "authenticated";

grant select on table "public"."execution_annotations" to "authenticated";

grant trigger on table "public"."execution_annotations" to "authenticated";

grant truncate on table "public"."execution_annotations" to "authenticated";

grant update on table "public"."execution_annotations" to "authenticated";

grant delete on table "public"."execution_annotations" to "service_role";

grant insert on table "public"."execution_annotations" to "service_role";

grant references on table "public"."execution_annotations" to "service_role";

grant select on table "public"."execution_annotations" to "service_role";

grant trigger on table "public"."execution_annotations" to "service_role";

grant truncate on table "public"."execution_annotations" to "service_role";

grant update on table "public"."execution_annotations" to "service_role";

grant delete on table "public"."execution_data" to "anon";

grant insert on table "public"."execution_data" to "anon";

grant references on table "public"."execution_data" to "anon";

grant select on table "public"."execution_data" to "anon";

grant trigger on table "public"."execution_data" to "anon";

grant truncate on table "public"."execution_data" to "anon";

grant update on table "public"."execution_data" to "anon";

grant delete on table "public"."execution_data" to "authenticated";

grant insert on table "public"."execution_data" to "authenticated";

grant references on table "public"."execution_data" to "authenticated";

grant select on table "public"."execution_data" to "authenticated";

grant trigger on table "public"."execution_data" to "authenticated";

grant truncate on table "public"."execution_data" to "authenticated";

grant update on table "public"."execution_data" to "authenticated";

grant delete on table "public"."execution_data" to "service_role";

grant insert on table "public"."execution_data" to "service_role";

grant references on table "public"."execution_data" to "service_role";

grant select on table "public"."execution_data" to "service_role";

grant trigger on table "public"."execution_data" to "service_role";

grant truncate on table "public"."execution_data" to "service_role";

grant update on table "public"."execution_data" to "service_role";

grant delete on table "public"."execution_entity" to "anon";

grant insert on table "public"."execution_entity" to "anon";

grant references on table "public"."execution_entity" to "anon";

grant select on table "public"."execution_entity" to "anon";

grant trigger on table "public"."execution_entity" to "anon";

grant truncate on table "public"."execution_entity" to "anon";

grant update on table "public"."execution_entity" to "anon";

grant delete on table "public"."execution_entity" to "authenticated";

grant insert on table "public"."execution_entity" to "authenticated";

grant references on table "public"."execution_entity" to "authenticated";

grant select on table "public"."execution_entity" to "authenticated";

grant trigger on table "public"."execution_entity" to "authenticated";

grant truncate on table "public"."execution_entity" to "authenticated";

grant update on table "public"."execution_entity" to "authenticated";

grant delete on table "public"."execution_entity" to "service_role";

grant insert on table "public"."execution_entity" to "service_role";

grant references on table "public"."execution_entity" to "service_role";

grant select on table "public"."execution_entity" to "service_role";

grant trigger on table "public"."execution_entity" to "service_role";

grant truncate on table "public"."execution_entity" to "service_role";

grant update on table "public"."execution_entity" to "service_role";

grant delete on table "public"."execution_metadata" to "anon";

grant insert on table "public"."execution_metadata" to "anon";

grant references on table "public"."execution_metadata" to "anon";

grant select on table "public"."execution_metadata" to "anon";

grant trigger on table "public"."execution_metadata" to "anon";

grant truncate on table "public"."execution_metadata" to "anon";

grant update on table "public"."execution_metadata" to "anon";

grant delete on table "public"."execution_metadata" to "authenticated";

grant insert on table "public"."execution_metadata" to "authenticated";

grant references on table "public"."execution_metadata" to "authenticated";

grant select on table "public"."execution_metadata" to "authenticated";

grant trigger on table "public"."execution_metadata" to "authenticated";

grant truncate on table "public"."execution_metadata" to "authenticated";

grant update on table "public"."execution_metadata" to "authenticated";

grant delete on table "public"."execution_metadata" to "service_role";

grant insert on table "public"."execution_metadata" to "service_role";

grant references on table "public"."execution_metadata" to "service_role";

grant select on table "public"."execution_metadata" to "service_role";

grant trigger on table "public"."execution_metadata" to "service_role";

grant truncate on table "public"."execution_metadata" to "service_role";

grant update on table "public"."execution_metadata" to "service_role";

grant delete on table "public"."folder" to "anon";

grant insert on table "public"."folder" to "anon";

grant references on table "public"."folder" to "anon";

grant select on table "public"."folder" to "anon";

grant trigger on table "public"."folder" to "anon";

grant truncate on table "public"."folder" to "anon";

grant update on table "public"."folder" to "anon";

grant delete on table "public"."folder" to "authenticated";

grant insert on table "public"."folder" to "authenticated";

grant references on table "public"."folder" to "authenticated";

grant select on table "public"."folder" to "authenticated";

grant trigger on table "public"."folder" to "authenticated";

grant truncate on table "public"."folder" to "authenticated";

grant update on table "public"."folder" to "authenticated";

grant delete on table "public"."folder" to "service_role";

grant insert on table "public"."folder" to "service_role";

grant references on table "public"."folder" to "service_role";

grant select on table "public"."folder" to "service_role";

grant trigger on table "public"."folder" to "service_role";

grant truncate on table "public"."folder" to "service_role";

grant update on table "public"."folder" to "service_role";

grant delete on table "public"."folder_tag" to "anon";

grant insert on table "public"."folder_tag" to "anon";

grant references on table "public"."folder_tag" to "anon";

grant select on table "public"."folder_tag" to "anon";

grant trigger on table "public"."folder_tag" to "anon";

grant truncate on table "public"."folder_tag" to "anon";

grant update on table "public"."folder_tag" to "anon";

grant delete on table "public"."folder_tag" to "authenticated";

grant insert on table "public"."folder_tag" to "authenticated";

grant references on table "public"."folder_tag" to "authenticated";

grant select on table "public"."folder_tag" to "authenticated";

grant trigger on table "public"."folder_tag" to "authenticated";

grant truncate on table "public"."folder_tag" to "authenticated";

grant update on table "public"."folder_tag" to "authenticated";

grant delete on table "public"."folder_tag" to "service_role";

grant insert on table "public"."folder_tag" to "service_role";

grant references on table "public"."folder_tag" to "service_role";

grant select on table "public"."folder_tag" to "service_role";

grant trigger on table "public"."folder_tag" to "service_role";

grant truncate on table "public"."folder_tag" to "service_role";

grant update on table "public"."folder_tag" to "service_role";

grant delete on table "public"."fragrance_blends" to "anon";

grant insert on table "public"."fragrance_blends" to "anon";

grant references on table "public"."fragrance_blends" to "anon";

grant select on table "public"."fragrance_blends" to "anon";

grant trigger on table "public"."fragrance_blends" to "anon";

grant truncate on table "public"."fragrance_blends" to "anon";

grant update on table "public"."fragrance_blends" to "anon";

grant delete on table "public"."fragrance_blends" to "authenticated";

grant insert on table "public"."fragrance_blends" to "authenticated";

grant references on table "public"."fragrance_blends" to "authenticated";

grant select on table "public"."fragrance_blends" to "authenticated";

grant trigger on table "public"."fragrance_blends" to "authenticated";

grant truncate on table "public"."fragrance_blends" to "authenticated";

grant update on table "public"."fragrance_blends" to "authenticated";

grant delete on table "public"."fragrance_blends" to "service_role";

grant insert on table "public"."fragrance_blends" to "service_role";

grant references on table "public"."fragrance_blends" to "service_role";

grant select on table "public"."fragrance_blends" to "service_role";

grant trigger on table "public"."fragrance_blends" to "service_role";

grant truncate on table "public"."fragrance_blends" to "service_role";

grant update on table "public"."fragrance_blends" to "service_role";

grant delete on table "public"."fragrance_oils" to "anon";

grant insert on table "public"."fragrance_oils" to "anon";

grant references on table "public"."fragrance_oils" to "anon";

grant select on table "public"."fragrance_oils" to "anon";

grant trigger on table "public"."fragrance_oils" to "anon";

grant truncate on table "public"."fragrance_oils" to "anon";

grant update on table "public"."fragrance_oils" to "anon";

grant delete on table "public"."fragrance_oils" to "authenticated";

grant insert on table "public"."fragrance_oils" to "authenticated";

grant references on table "public"."fragrance_oils" to "authenticated";

grant select on table "public"."fragrance_oils" to "authenticated";

grant trigger on table "public"."fragrance_oils" to "authenticated";

grant truncate on table "public"."fragrance_oils" to "authenticated";

grant update on table "public"."fragrance_oils" to "authenticated";

grant delete on table "public"."fragrance_oils" to "service_role";

grant insert on table "public"."fragrance_oils" to "service_role";

grant references on table "public"."fragrance_oils" to "service_role";

grant select on table "public"."fragrance_oils" to "service_role";

grant trigger on table "public"."fragrance_oils" to "service_role";

grant truncate on table "public"."fragrance_oils" to "service_role";

grant update on table "public"."fragrance_oils" to "service_role";

grant delete on table "public"."fragrance_reviews" to "anon";

grant insert on table "public"."fragrance_reviews" to "anon";

grant references on table "public"."fragrance_reviews" to "anon";

grant select on table "public"."fragrance_reviews" to "anon";

grant trigger on table "public"."fragrance_reviews" to "anon";

grant truncate on table "public"."fragrance_reviews" to "anon";

grant update on table "public"."fragrance_reviews" to "anon";

grant delete on table "public"."fragrance_reviews" to "authenticated";

grant insert on table "public"."fragrance_reviews" to "authenticated";

grant references on table "public"."fragrance_reviews" to "authenticated";

grant select on table "public"."fragrance_reviews" to "authenticated";

grant trigger on table "public"."fragrance_reviews" to "authenticated";

grant truncate on table "public"."fragrance_reviews" to "authenticated";

grant update on table "public"."fragrance_reviews" to "authenticated";

grant delete on table "public"."fragrance_reviews" to "service_role";

grant insert on table "public"."fragrance_reviews" to "service_role";

grant references on table "public"."fragrance_reviews" to "service_role";

grant select on table "public"."fragrance_reviews" to "service_role";

grant trigger on table "public"."fragrance_reviews" to "service_role";

grant truncate on table "public"."fragrance_reviews" to "service_role";

grant update on table "public"."fragrance_reviews" to "service_role";

grant delete on table "public"."insights_by_period" to "anon";

grant insert on table "public"."insights_by_period" to "anon";

grant references on table "public"."insights_by_period" to "anon";

grant select on table "public"."insights_by_period" to "anon";

grant trigger on table "public"."insights_by_period" to "anon";

grant truncate on table "public"."insights_by_period" to "anon";

grant update on table "public"."insights_by_period" to "anon";

grant delete on table "public"."insights_by_period" to "authenticated";

grant insert on table "public"."insights_by_period" to "authenticated";

grant references on table "public"."insights_by_period" to "authenticated";

grant select on table "public"."insights_by_period" to "authenticated";

grant trigger on table "public"."insights_by_period" to "authenticated";

grant truncate on table "public"."insights_by_period" to "authenticated";

grant update on table "public"."insights_by_period" to "authenticated";

grant delete on table "public"."insights_by_period" to "service_role";

grant insert on table "public"."insights_by_period" to "service_role";

grant references on table "public"."insights_by_period" to "service_role";

grant select on table "public"."insights_by_period" to "service_role";

grant trigger on table "public"."insights_by_period" to "service_role";

grant truncate on table "public"."insights_by_period" to "service_role";

grant update on table "public"."insights_by_period" to "service_role";

grant delete on table "public"."insights_metadata" to "anon";

grant insert on table "public"."insights_metadata" to "anon";

grant references on table "public"."insights_metadata" to "anon";

grant select on table "public"."insights_metadata" to "anon";

grant trigger on table "public"."insights_metadata" to "anon";

grant truncate on table "public"."insights_metadata" to "anon";

grant update on table "public"."insights_metadata" to "anon";

grant delete on table "public"."insights_metadata" to "authenticated";

grant insert on table "public"."insights_metadata" to "authenticated";

grant references on table "public"."insights_metadata" to "authenticated";

grant select on table "public"."insights_metadata" to "authenticated";

grant trigger on table "public"."insights_metadata" to "authenticated";

grant truncate on table "public"."insights_metadata" to "authenticated";

grant update on table "public"."insights_metadata" to "authenticated";

grant delete on table "public"."insights_metadata" to "service_role";

grant insert on table "public"."insights_metadata" to "service_role";

grant references on table "public"."insights_metadata" to "service_role";

grant select on table "public"."insights_metadata" to "service_role";

grant trigger on table "public"."insights_metadata" to "service_role";

grant truncate on table "public"."insights_metadata" to "service_role";

grant update on table "public"."insights_metadata" to "service_role";

grant delete on table "public"."insights_raw" to "anon";

grant insert on table "public"."insights_raw" to "anon";

grant references on table "public"."insights_raw" to "anon";

grant select on table "public"."insights_raw" to "anon";

grant trigger on table "public"."insights_raw" to "anon";

grant truncate on table "public"."insights_raw" to "anon";

grant update on table "public"."insights_raw" to "anon";

grant delete on table "public"."insights_raw" to "authenticated";

grant insert on table "public"."insights_raw" to "authenticated";

grant references on table "public"."insights_raw" to "authenticated";

grant select on table "public"."insights_raw" to "authenticated";

grant trigger on table "public"."insights_raw" to "authenticated";

grant truncate on table "public"."insights_raw" to "authenticated";

grant update on table "public"."insights_raw" to "authenticated";

grant delete on table "public"."insights_raw" to "service_role";

grant insert on table "public"."insights_raw" to "service_role";

grant references on table "public"."insights_raw" to "service_role";

grant select on table "public"."insights_raw" to "service_role";

grant trigger on table "public"."insights_raw" to "service_role";

grant truncate on table "public"."insights_raw" to "service_role";

grant update on table "public"."insights_raw" to "service_role";

grant delete on table "public"."installed_nodes" to "anon";

grant insert on table "public"."installed_nodes" to "anon";

grant references on table "public"."installed_nodes" to "anon";

grant select on table "public"."installed_nodes" to "anon";

grant trigger on table "public"."installed_nodes" to "anon";

grant truncate on table "public"."installed_nodes" to "anon";

grant update on table "public"."installed_nodes" to "anon";

grant delete on table "public"."installed_nodes" to "authenticated";

grant insert on table "public"."installed_nodes" to "authenticated";

grant references on table "public"."installed_nodes" to "authenticated";

grant select on table "public"."installed_nodes" to "authenticated";

grant trigger on table "public"."installed_nodes" to "authenticated";

grant truncate on table "public"."installed_nodes" to "authenticated";

grant update on table "public"."installed_nodes" to "authenticated";

grant delete on table "public"."installed_nodes" to "service_role";

grant insert on table "public"."installed_nodes" to "service_role";

grant references on table "public"."installed_nodes" to "service_role";

grant select on table "public"."installed_nodes" to "service_role";

grant trigger on table "public"."installed_nodes" to "service_role";

grant truncate on table "public"."installed_nodes" to "service_role";

grant update on table "public"."installed_nodes" to "service_role";

grant delete on table "public"."installed_packages" to "anon";

grant insert on table "public"."installed_packages" to "anon";

grant references on table "public"."installed_packages" to "anon";

grant select on table "public"."installed_packages" to "anon";

grant trigger on table "public"."installed_packages" to "anon";

grant truncate on table "public"."installed_packages" to "anon";

grant update on table "public"."installed_packages" to "anon";

grant delete on table "public"."installed_packages" to "authenticated";

grant insert on table "public"."installed_packages" to "authenticated";

grant references on table "public"."installed_packages" to "authenticated";

grant select on table "public"."installed_packages" to "authenticated";

grant trigger on table "public"."installed_packages" to "authenticated";

grant truncate on table "public"."installed_packages" to "authenticated";

grant update on table "public"."installed_packages" to "authenticated";

grant delete on table "public"."installed_packages" to "service_role";

grant insert on table "public"."installed_packages" to "service_role";

grant references on table "public"."installed_packages" to "service_role";

grant select on table "public"."installed_packages" to "service_role";

grant trigger on table "public"."installed_packages" to "service_role";

grant truncate on table "public"."installed_packages" to "service_role";

grant update on table "public"."installed_packages" to "service_role";

grant delete on table "public"."invalid_auth_token" to "anon";

grant insert on table "public"."invalid_auth_token" to "anon";

grant references on table "public"."invalid_auth_token" to "anon";

grant select on table "public"."invalid_auth_token" to "anon";

grant trigger on table "public"."invalid_auth_token" to "anon";

grant truncate on table "public"."invalid_auth_token" to "anon";

grant update on table "public"."invalid_auth_token" to "anon";

grant delete on table "public"."invalid_auth_token" to "authenticated";

grant insert on table "public"."invalid_auth_token" to "authenticated";

grant references on table "public"."invalid_auth_token" to "authenticated";

grant select on table "public"."invalid_auth_token" to "authenticated";

grant trigger on table "public"."invalid_auth_token" to "authenticated";

grant truncate on table "public"."invalid_auth_token" to "authenticated";

grant update on table "public"."invalid_auth_token" to "authenticated";

grant delete on table "public"."invalid_auth_token" to "service_role";

grant insert on table "public"."invalid_auth_token" to "service_role";

grant references on table "public"."invalid_auth_token" to "service_role";

grant select on table "public"."invalid_auth_token" to "service_role";

grant trigger on table "public"."invalid_auth_token" to "service_role";

grant truncate on table "public"."invalid_auth_token" to "service_role";

grant update on table "public"."invalid_auth_token" to "service_role";

grant delete on table "public"."lead" to "anon";

grant insert on table "public"."lead" to "anon";

grant references on table "public"."lead" to "anon";

grant select on table "public"."lead" to "anon";

grant trigger on table "public"."lead" to "anon";

grant truncate on table "public"."lead" to "anon";

grant update on table "public"."lead" to "anon";

grant delete on table "public"."lead" to "authenticated";

grant insert on table "public"."lead" to "authenticated";

grant references on table "public"."lead" to "authenticated";

grant select on table "public"."lead" to "authenticated";

grant trigger on table "public"."lead" to "authenticated";

grant truncate on table "public"."lead" to "authenticated";

grant update on table "public"."lead" to "authenticated";

grant delete on table "public"."lead" to "service_role";

grant insert on table "public"."lead" to "service_role";

grant references on table "public"."lead" to "service_role";

grant select on table "public"."lead" to "service_role";

grant trigger on table "public"."lead" to "service_role";

grant truncate on table "public"."lead" to "service_role";

grant update on table "public"."lead" to "service_role";

grant delete on table "public"."liked_navidrome_tracks" to "anon";

grant insert on table "public"."liked_navidrome_tracks" to "anon";

grant references on table "public"."liked_navidrome_tracks" to "anon";

grant select on table "public"."liked_navidrome_tracks" to "anon";

grant trigger on table "public"."liked_navidrome_tracks" to "anon";

grant truncate on table "public"."liked_navidrome_tracks" to "anon";

grant update on table "public"."liked_navidrome_tracks" to "anon";

grant delete on table "public"."liked_navidrome_tracks" to "authenticated";

grant insert on table "public"."liked_navidrome_tracks" to "authenticated";

grant references on table "public"."liked_navidrome_tracks" to "authenticated";

grant select on table "public"."liked_navidrome_tracks" to "authenticated";

grant trigger on table "public"."liked_navidrome_tracks" to "authenticated";

grant truncate on table "public"."liked_navidrome_tracks" to "authenticated";

grant update on table "public"."liked_navidrome_tracks" to "authenticated";

grant delete on table "public"."liked_navidrome_tracks" to "service_role";

grant insert on table "public"."liked_navidrome_tracks" to "service_role";

grant references on table "public"."liked_navidrome_tracks" to "service_role";

grant select on table "public"."liked_navidrome_tracks" to "service_role";

grant trigger on table "public"."liked_navidrome_tracks" to "service_role";

grant truncate on table "public"."liked_navidrome_tracks" to "service_role";

grant update on table "public"."liked_navidrome_tracks" to "service_role";

grant delete on table "public"."liked_songs" to "anon";

grant insert on table "public"."liked_songs" to "anon";

grant references on table "public"."liked_songs" to "anon";

grant select on table "public"."liked_songs" to "anon";

grant trigger on table "public"."liked_songs" to "anon";

grant truncate on table "public"."liked_songs" to "anon";

grant update on table "public"."liked_songs" to "anon";

grant delete on table "public"."liked_songs" to "authenticated";

grant insert on table "public"."liked_songs" to "authenticated";

grant references on table "public"."liked_songs" to "authenticated";

grant select on table "public"."liked_songs" to "authenticated";

grant trigger on table "public"."liked_songs" to "authenticated";

grant truncate on table "public"."liked_songs" to "authenticated";

grant update on table "public"."liked_songs" to "authenticated";

grant delete on table "public"."liked_songs" to "service_role";

grant insert on table "public"."liked_songs" to "service_role";

grant references on table "public"."liked_songs" to "service_role";

grant select on table "public"."liked_songs" to "service_role";

grant trigger on table "public"."liked_songs" to "service_role";

grant truncate on table "public"."liked_songs" to "service_role";

grant update on table "public"."liked_songs" to "service_role";

grant delete on table "public"."likes" to "anon";

grant insert on table "public"."likes" to "anon";

grant references on table "public"."likes" to "anon";

grant select on table "public"."likes" to "anon";

grant trigger on table "public"."likes" to "anon";

grant truncate on table "public"."likes" to "anon";

grant update on table "public"."likes" to "anon";

grant delete on table "public"."likes" to "authenticated";

grant insert on table "public"."likes" to "authenticated";

grant references on table "public"."likes" to "authenticated";

grant select on table "public"."likes" to "authenticated";

grant trigger on table "public"."likes" to "authenticated";

grant truncate on table "public"."likes" to "authenticated";

grant update on table "public"."likes" to "authenticated";

grant delete on table "public"."likes" to "service_role";

grant insert on table "public"."likes" to "service_role";

grant references on table "public"."likes" to "service_role";

grant select on table "public"."likes" to "service_role";

grant trigger on table "public"."likes" to "service_role";

grant truncate on table "public"."likes" to "service_role";

grant update on table "public"."likes" to "service_role";

grant delete on table "public"."listening_history" to "anon";

grant insert on table "public"."listening_history" to "anon";

grant references on table "public"."listening_history" to "anon";

grant select on table "public"."listening_history" to "anon";

grant trigger on table "public"."listening_history" to "anon";

grant truncate on table "public"."listening_history" to "anon";

grant update on table "public"."listening_history" to "anon";

grant delete on table "public"."listening_history" to "authenticated";

grant insert on table "public"."listening_history" to "authenticated";

grant references on table "public"."listening_history" to "authenticated";

grant select on table "public"."listening_history" to "authenticated";

grant trigger on table "public"."listening_history" to "authenticated";

grant truncate on table "public"."listening_history" to "authenticated";

grant update on table "public"."listening_history" to "authenticated";

grant delete on table "public"."listening_history" to "service_role";

grant insert on table "public"."listening_history" to "service_role";

grant references on table "public"."listening_history" to "service_role";

grant select on table "public"."listening_history" to "service_role";

grant trigger on table "public"."listening_history" to "service_role";

grant truncate on table "public"."listening_history" to "service_role";

grant update on table "public"."listening_history" to "service_role";

grant delete on table "public"."messages" to "anon";

grant insert on table "public"."messages" to "anon";

grant references on table "public"."messages" to "anon";

grant select on table "public"."messages" to "anon";

grant trigger on table "public"."messages" to "anon";

grant truncate on table "public"."messages" to "anon";

grant update on table "public"."messages" to "anon";

grant delete on table "public"."messages" to "authenticated";

grant insert on table "public"."messages" to "authenticated";

grant references on table "public"."messages" to "authenticated";

grant select on table "public"."messages" to "authenticated";

grant trigger on table "public"."messages" to "authenticated";

grant truncate on table "public"."messages" to "authenticated";

grant update on table "public"."messages" to "authenticated";

grant delete on table "public"."messages" to "service_role";

grant insert on table "public"."messages" to "service_role";

grant references on table "public"."messages" to "service_role";

grant select on table "public"."messages" to "service_role";

grant trigger on table "public"."messages" to "service_role";

grant truncate on table "public"."messages" to "service_role";

grant update on table "public"."messages" to "service_role";

grant delete on table "public"."migrations" to "anon";

grant insert on table "public"."migrations" to "anon";

grant references on table "public"."migrations" to "anon";

grant select on table "public"."migrations" to "anon";

grant trigger on table "public"."migrations" to "anon";

grant truncate on table "public"."migrations" to "anon";

grant update on table "public"."migrations" to "anon";

grant delete on table "public"."migrations" to "authenticated";

grant insert on table "public"."migrations" to "authenticated";

grant references on table "public"."migrations" to "authenticated";

grant select on table "public"."migrations" to "authenticated";

grant trigger on table "public"."migrations" to "authenticated";

grant truncate on table "public"."migrations" to "authenticated";

grant update on table "public"."migrations" to "authenticated";

grant delete on table "public"."migrations" to "service_role";

grant insert on table "public"."migrations" to "service_role";

grant references on table "public"."migrations" to "service_role";

grant select on table "public"."migrations" to "service_role";

grant trigger on table "public"."migrations" to "service_role";

grant truncate on table "public"."migrations" to "service_role";

grant update on table "public"."migrations" to "service_role";

grant delete on table "public"."music_requests" to "anon";

grant insert on table "public"."music_requests" to "anon";

grant references on table "public"."music_requests" to "anon";

grant select on table "public"."music_requests" to "anon";

grant trigger on table "public"."music_requests" to "anon";

grant truncate on table "public"."music_requests" to "anon";

grant update on table "public"."music_requests" to "anon";

grant delete on table "public"."music_requests" to "authenticated";

grant insert on table "public"."music_requests" to "authenticated";

grant references on table "public"."music_requests" to "authenticated";

grant select on table "public"."music_requests" to "authenticated";

grant trigger on table "public"."music_requests" to "authenticated";

grant truncate on table "public"."music_requests" to "authenticated";

grant update on table "public"."music_requests" to "authenticated";

grant delete on table "public"."music_requests" to "service_role";

grant insert on table "public"."music_requests" to "service_role";

grant references on table "public"."music_requests" to "service_role";

grant select on table "public"."music_requests" to "service_role";

grant trigger on table "public"."music_requests" to "service_role";

grant truncate on table "public"."music_requests" to "service_role";

grant update on table "public"."music_requests" to "service_role";

grant delete on table "public"."notifications" to "anon";

grant insert on table "public"."notifications" to "anon";

grant references on table "public"."notifications" to "anon";

grant select on table "public"."notifications" to "anon";

grant trigger on table "public"."notifications" to "anon";

grant truncate on table "public"."notifications" to "anon";

grant update on table "public"."notifications" to "anon";

grant delete on table "public"."notifications" to "authenticated";

grant insert on table "public"."notifications" to "authenticated";

grant references on table "public"."notifications" to "authenticated";

grant select on table "public"."notifications" to "authenticated";

grant trigger on table "public"."notifications" to "authenticated";

grant truncate on table "public"."notifications" to "authenticated";

grant update on table "public"."notifications" to "authenticated";

grant delete on table "public"."notifications" to "service_role";

grant insert on table "public"."notifications" to "service_role";

grant references on table "public"."notifications" to "service_role";

grant select on table "public"."notifications" to "service_role";

grant trigger on table "public"."notifications" to "service_role";

grant truncate on table "public"."notifications" to "service_role";

grant update on table "public"."notifications" to "service_role";

grant delete on table "public"."oauth_access_tokens" to "anon";

grant insert on table "public"."oauth_access_tokens" to "anon";

grant references on table "public"."oauth_access_tokens" to "anon";

grant select on table "public"."oauth_access_tokens" to "anon";

grant trigger on table "public"."oauth_access_tokens" to "anon";

grant truncate on table "public"."oauth_access_tokens" to "anon";

grant update on table "public"."oauth_access_tokens" to "anon";

grant delete on table "public"."oauth_access_tokens" to "authenticated";

grant insert on table "public"."oauth_access_tokens" to "authenticated";

grant references on table "public"."oauth_access_tokens" to "authenticated";

grant select on table "public"."oauth_access_tokens" to "authenticated";

grant trigger on table "public"."oauth_access_tokens" to "authenticated";

grant truncate on table "public"."oauth_access_tokens" to "authenticated";

grant update on table "public"."oauth_access_tokens" to "authenticated";

grant delete on table "public"."oauth_access_tokens" to "service_role";

grant insert on table "public"."oauth_access_tokens" to "service_role";

grant references on table "public"."oauth_access_tokens" to "service_role";

grant select on table "public"."oauth_access_tokens" to "service_role";

grant trigger on table "public"."oauth_access_tokens" to "service_role";

grant truncate on table "public"."oauth_access_tokens" to "service_role";

grant update on table "public"."oauth_access_tokens" to "service_role";

grant delete on table "public"."oauth_authorization_codes" to "anon";

grant insert on table "public"."oauth_authorization_codes" to "anon";

grant references on table "public"."oauth_authorization_codes" to "anon";

grant select on table "public"."oauth_authorization_codes" to "anon";

grant trigger on table "public"."oauth_authorization_codes" to "anon";

grant truncate on table "public"."oauth_authorization_codes" to "anon";

grant update on table "public"."oauth_authorization_codes" to "anon";

grant delete on table "public"."oauth_authorization_codes" to "authenticated";

grant insert on table "public"."oauth_authorization_codes" to "authenticated";

grant references on table "public"."oauth_authorization_codes" to "authenticated";

grant select on table "public"."oauth_authorization_codes" to "authenticated";

grant trigger on table "public"."oauth_authorization_codes" to "authenticated";

grant truncate on table "public"."oauth_authorization_codes" to "authenticated";

grant update on table "public"."oauth_authorization_codes" to "authenticated";

grant delete on table "public"."oauth_authorization_codes" to "service_role";

grant insert on table "public"."oauth_authorization_codes" to "service_role";

grant references on table "public"."oauth_authorization_codes" to "service_role";

grant select on table "public"."oauth_authorization_codes" to "service_role";

grant trigger on table "public"."oauth_authorization_codes" to "service_role";

grant truncate on table "public"."oauth_authorization_codes" to "service_role";

grant update on table "public"."oauth_authorization_codes" to "service_role";

grant delete on table "public"."oauth_clients" to "anon";

grant insert on table "public"."oauth_clients" to "anon";

grant references on table "public"."oauth_clients" to "anon";

grant select on table "public"."oauth_clients" to "anon";

grant trigger on table "public"."oauth_clients" to "anon";

grant truncate on table "public"."oauth_clients" to "anon";

grant update on table "public"."oauth_clients" to "anon";

grant delete on table "public"."oauth_clients" to "authenticated";

grant insert on table "public"."oauth_clients" to "authenticated";

grant references on table "public"."oauth_clients" to "authenticated";

grant select on table "public"."oauth_clients" to "authenticated";

grant trigger on table "public"."oauth_clients" to "authenticated";

grant truncate on table "public"."oauth_clients" to "authenticated";

grant update on table "public"."oauth_clients" to "authenticated";

grant delete on table "public"."oauth_clients" to "service_role";

grant insert on table "public"."oauth_clients" to "service_role";

grant references on table "public"."oauth_clients" to "service_role";

grant select on table "public"."oauth_clients" to "service_role";

grant trigger on table "public"."oauth_clients" to "service_role";

grant truncate on table "public"."oauth_clients" to "service_role";

grant update on table "public"."oauth_clients" to "service_role";

grant delete on table "public"."oauth_refresh_tokens" to "anon";

grant insert on table "public"."oauth_refresh_tokens" to "anon";

grant references on table "public"."oauth_refresh_tokens" to "anon";

grant select on table "public"."oauth_refresh_tokens" to "anon";

grant trigger on table "public"."oauth_refresh_tokens" to "anon";

grant truncate on table "public"."oauth_refresh_tokens" to "anon";

grant update on table "public"."oauth_refresh_tokens" to "anon";

grant delete on table "public"."oauth_refresh_tokens" to "authenticated";

grant insert on table "public"."oauth_refresh_tokens" to "authenticated";

grant references on table "public"."oauth_refresh_tokens" to "authenticated";

grant select on table "public"."oauth_refresh_tokens" to "authenticated";

grant trigger on table "public"."oauth_refresh_tokens" to "authenticated";

grant truncate on table "public"."oauth_refresh_tokens" to "authenticated";

grant update on table "public"."oauth_refresh_tokens" to "authenticated";

grant delete on table "public"."oauth_refresh_tokens" to "service_role";

grant insert on table "public"."oauth_refresh_tokens" to "service_role";

grant references on table "public"."oauth_refresh_tokens" to "service_role";

grant select on table "public"."oauth_refresh_tokens" to "service_role";

grant trigger on table "public"."oauth_refresh_tokens" to "service_role";

grant truncate on table "public"."oauth_refresh_tokens" to "service_role";

grant update on table "public"."oauth_refresh_tokens" to "service_role";

grant delete on table "public"."oauth_user_consents" to "anon";

grant insert on table "public"."oauth_user_consents" to "anon";

grant references on table "public"."oauth_user_consents" to "anon";

grant select on table "public"."oauth_user_consents" to "anon";

grant trigger on table "public"."oauth_user_consents" to "anon";

grant truncate on table "public"."oauth_user_consents" to "anon";

grant update on table "public"."oauth_user_consents" to "anon";

grant delete on table "public"."oauth_user_consents" to "authenticated";

grant insert on table "public"."oauth_user_consents" to "authenticated";

grant references on table "public"."oauth_user_consents" to "authenticated";

grant select on table "public"."oauth_user_consents" to "authenticated";

grant trigger on table "public"."oauth_user_consents" to "authenticated";

grant truncate on table "public"."oauth_user_consents" to "authenticated";

grant update on table "public"."oauth_user_consents" to "authenticated";

grant delete on table "public"."oauth_user_consents" to "service_role";

grant insert on table "public"."oauth_user_consents" to "service_role";

grant references on table "public"."oauth_user_consents" to "service_role";

grant select on table "public"."oauth_user_consents" to "service_role";

grant trigger on table "public"."oauth_user_consents" to "service_role";

grant truncate on table "public"."oauth_user_consents" to "service_role";

grant update on table "public"."oauth_user_consents" to "service_role";

grant delete on table "public"."ollama_documents" to "anon";

grant insert on table "public"."ollama_documents" to "anon";

grant references on table "public"."ollama_documents" to "anon";

grant select on table "public"."ollama_documents" to "anon";

grant trigger on table "public"."ollama_documents" to "anon";

grant truncate on table "public"."ollama_documents" to "anon";

grant update on table "public"."ollama_documents" to "anon";

grant delete on table "public"."ollama_documents" to "authenticated";

grant insert on table "public"."ollama_documents" to "authenticated";

grant references on table "public"."ollama_documents" to "authenticated";

grant select on table "public"."ollama_documents" to "authenticated";

grant trigger on table "public"."ollama_documents" to "authenticated";

grant truncate on table "public"."ollama_documents" to "authenticated";

grant update on table "public"."ollama_documents" to "authenticated";

grant delete on table "public"."ollama_documents" to "service_role";

grant insert on table "public"."ollama_documents" to "service_role";

grant references on table "public"."ollama_documents" to "service_role";

grant select on table "public"."ollama_documents" to "service_role";

grant trigger on table "public"."ollama_documents" to "service_role";

grant truncate on table "public"."ollama_documents" to "service_role";

grant update on table "public"."ollama_documents" to "service_role";

grant delete on table "public"."pending_logins" to "anon";

grant insert on table "public"."pending_logins" to "anon";

grant references on table "public"."pending_logins" to "anon";

grant select on table "public"."pending_logins" to "anon";

grant trigger on table "public"."pending_logins" to "anon";

grant truncate on table "public"."pending_logins" to "anon";

grant update on table "public"."pending_logins" to "anon";

grant delete on table "public"."pending_logins" to "authenticated";

grant insert on table "public"."pending_logins" to "authenticated";

grant references on table "public"."pending_logins" to "authenticated";

grant select on table "public"."pending_logins" to "authenticated";

grant trigger on table "public"."pending_logins" to "authenticated";

grant truncate on table "public"."pending_logins" to "authenticated";

grant update on table "public"."pending_logins" to "authenticated";

grant delete on table "public"."pending_logins" to "service_role";

grant insert on table "public"."pending_logins" to "service_role";

grant references on table "public"."pending_logins" to "service_role";

grant select on table "public"."pending_logins" to "service_role";

grant trigger on table "public"."pending_logins" to "service_role";

grant truncate on table "public"."pending_logins" to "service_role";

grant update on table "public"."pending_logins" to "service_role";

grant delete on table "public"."playlist_tracks" to "anon";

grant insert on table "public"."playlist_tracks" to "anon";

grant references on table "public"."playlist_tracks" to "anon";

grant select on table "public"."playlist_tracks" to "anon";

grant trigger on table "public"."playlist_tracks" to "anon";

grant truncate on table "public"."playlist_tracks" to "anon";

grant update on table "public"."playlist_tracks" to "anon";

grant delete on table "public"."playlist_tracks" to "authenticated";

grant insert on table "public"."playlist_tracks" to "authenticated";

grant references on table "public"."playlist_tracks" to "authenticated";

grant select on table "public"."playlist_tracks" to "authenticated";

grant trigger on table "public"."playlist_tracks" to "authenticated";

grant truncate on table "public"."playlist_tracks" to "authenticated";

grant update on table "public"."playlist_tracks" to "authenticated";

grant delete on table "public"."playlist_tracks" to "service_role";

grant insert on table "public"."playlist_tracks" to "service_role";

grant references on table "public"."playlist_tracks" to "service_role";

grant select on table "public"."playlist_tracks" to "service_role";

grant trigger on table "public"."playlist_tracks" to "service_role";

grant truncate on table "public"."playlist_tracks" to "service_role";

grant update on table "public"."playlist_tracks" to "service_role";

grant delete on table "public"."playlists" to "anon";

grant insert on table "public"."playlists" to "anon";

grant references on table "public"."playlists" to "anon";

grant select on table "public"."playlists" to "anon";

grant trigger on table "public"."playlists" to "anon";

grant truncate on table "public"."playlists" to "anon";

grant update on table "public"."playlists" to "anon";

grant delete on table "public"."playlists" to "authenticated";

grant insert on table "public"."playlists" to "authenticated";

grant references on table "public"."playlists" to "authenticated";

grant select on table "public"."playlists" to "authenticated";

grant trigger on table "public"."playlists" to "authenticated";

grant truncate on table "public"."playlists" to "authenticated";

grant update on table "public"."playlists" to "authenticated";

grant delete on table "public"."playlists" to "service_role";

grant insert on table "public"."playlists" to "service_role";

grant references on table "public"."playlists" to "service_role";

grant select on table "public"."playlists" to "service_role";

grant trigger on table "public"."playlists" to "service_role";

grant truncate on table "public"."playlists" to "service_role";

grant update on table "public"."playlists" to "service_role";

grant delete on table "public"."prices" to "anon";

grant insert on table "public"."prices" to "anon";

grant references on table "public"."prices" to "anon";

grant select on table "public"."prices" to "anon";

grant trigger on table "public"."prices" to "anon";

grant truncate on table "public"."prices" to "anon";

grant update on table "public"."prices" to "anon";

grant delete on table "public"."prices" to "authenticated";

grant insert on table "public"."prices" to "authenticated";

grant references on table "public"."prices" to "authenticated";

grant select on table "public"."prices" to "authenticated";

grant trigger on table "public"."prices" to "authenticated";

grant truncate on table "public"."prices" to "authenticated";

grant update on table "public"."prices" to "authenticated";

grant delete on table "public"."prices" to "service_role";

grant insert on table "public"."prices" to "service_role";

grant references on table "public"."prices" to "service_role";

grant select on table "public"."prices" to "service_role";

grant trigger on table "public"."prices" to "service_role";

grant truncate on table "public"."prices" to "service_role";

grant update on table "public"."prices" to "service_role";

grant delete on table "public"."processed_data" to "anon";

grant insert on table "public"."processed_data" to "anon";

grant references on table "public"."processed_data" to "anon";

grant select on table "public"."processed_data" to "anon";

grant trigger on table "public"."processed_data" to "anon";

grant truncate on table "public"."processed_data" to "anon";

grant update on table "public"."processed_data" to "anon";

grant delete on table "public"."processed_data" to "authenticated";

grant insert on table "public"."processed_data" to "authenticated";

grant references on table "public"."processed_data" to "authenticated";

grant select on table "public"."processed_data" to "authenticated";

grant trigger on table "public"."processed_data" to "authenticated";

grant truncate on table "public"."processed_data" to "authenticated";

grant update on table "public"."processed_data" to "authenticated";

grant delete on table "public"."processed_data" to "service_role";

grant insert on table "public"."processed_data" to "service_role";

grant references on table "public"."processed_data" to "service_role";

grant select on table "public"."processed_data" to "service_role";

grant trigger on table "public"."processed_data" to "service_role";

grant truncate on table "public"."processed_data" to "service_role";

grant update on table "public"."processed_data" to "service_role";

grant delete on table "public"."products" to "anon";

grant insert on table "public"."products" to "anon";

grant references on table "public"."products" to "anon";

grant select on table "public"."products" to "anon";

grant trigger on table "public"."products" to "anon";

grant truncate on table "public"."products" to "anon";

grant update on table "public"."products" to "anon";

grant delete on table "public"."products" to "authenticated";

grant insert on table "public"."products" to "authenticated";

grant references on table "public"."products" to "authenticated";

grant select on table "public"."products" to "authenticated";

grant trigger on table "public"."products" to "authenticated";

grant truncate on table "public"."products" to "authenticated";

grant update on table "public"."products" to "authenticated";

grant delete on table "public"."products" to "service_role";

grant insert on table "public"."products" to "service_role";

grant references on table "public"."products" to "service_role";

grant select on table "public"."products" to "service_role";

grant trigger on table "public"."products" to "service_role";

grant truncate on table "public"."products" to "service_role";

grant update on table "public"."products" to "service_role";

grant delete on table "public"."project" to "anon";

grant insert on table "public"."project" to "anon";

grant references on table "public"."project" to "anon";

grant select on table "public"."project" to "anon";

grant trigger on table "public"."project" to "anon";

grant truncate on table "public"."project" to "anon";

grant update on table "public"."project" to "anon";

grant delete on table "public"."project" to "authenticated";

grant insert on table "public"."project" to "authenticated";

grant references on table "public"."project" to "authenticated";

grant select on table "public"."project" to "authenticated";

grant trigger on table "public"."project" to "authenticated";

grant truncate on table "public"."project" to "authenticated";

grant update on table "public"."project" to "authenticated";

grant delete on table "public"."project" to "service_role";

grant insert on table "public"."project" to "service_role";

grant references on table "public"."project" to "service_role";

grant select on table "public"."project" to "service_role";

grant trigger on table "public"."project" to "service_role";

grant truncate on table "public"."project" to "service_role";

grant update on table "public"."project" to "service_role";

grant delete on table "public"."project_relation" to "anon";

grant insert on table "public"."project_relation" to "anon";

grant references on table "public"."project_relation" to "anon";

grant select on table "public"."project_relation" to "anon";

grant trigger on table "public"."project_relation" to "anon";

grant truncate on table "public"."project_relation" to "anon";

grant update on table "public"."project_relation" to "anon";

grant delete on table "public"."project_relation" to "authenticated";

grant insert on table "public"."project_relation" to "authenticated";

grant references on table "public"."project_relation" to "authenticated";

grant select on table "public"."project_relation" to "authenticated";

grant trigger on table "public"."project_relation" to "authenticated";

grant truncate on table "public"."project_relation" to "authenticated";

grant update on table "public"."project_relation" to "authenticated";

grant delete on table "public"."project_relation" to "service_role";

grant insert on table "public"."project_relation" to "service_role";

grant references on table "public"."project_relation" to "service_role";

grant select on table "public"."project_relation" to "service_role";

grant trigger on table "public"."project_relation" to "service_role";

grant truncate on table "public"."project_relation" to "service_role";

grant update on table "public"."project_relation" to "service_role";

grant delete on table "public"."role" to "anon";

grant insert on table "public"."role" to "anon";

grant references on table "public"."role" to "anon";

grant select on table "public"."role" to "anon";

grant trigger on table "public"."role" to "anon";

grant truncate on table "public"."role" to "anon";

grant update on table "public"."role" to "anon";

grant delete on table "public"."role" to "authenticated";

grant insert on table "public"."role" to "authenticated";

grant references on table "public"."role" to "authenticated";

grant select on table "public"."role" to "authenticated";

grant trigger on table "public"."role" to "authenticated";

grant truncate on table "public"."role" to "authenticated";

grant update on table "public"."role" to "authenticated";

grant delete on table "public"."role" to "service_role";

grant insert on table "public"."role" to "service_role";

grant references on table "public"."role" to "service_role";

grant select on table "public"."role" to "service_role";

grant trigger on table "public"."role" to "service_role";

grant truncate on table "public"."role" to "service_role";

grant update on table "public"."role" to "service_role";

grant delete on table "public"."role_scope" to "anon";

grant insert on table "public"."role_scope" to "anon";

grant references on table "public"."role_scope" to "anon";

grant select on table "public"."role_scope" to "anon";

grant trigger on table "public"."role_scope" to "anon";

grant truncate on table "public"."role_scope" to "anon";

grant update on table "public"."role_scope" to "anon";

grant delete on table "public"."role_scope" to "authenticated";

grant insert on table "public"."role_scope" to "authenticated";

grant references on table "public"."role_scope" to "authenticated";

grant select on table "public"."role_scope" to "authenticated";

grant trigger on table "public"."role_scope" to "authenticated";

grant truncate on table "public"."role_scope" to "authenticated";

grant update on table "public"."role_scope" to "authenticated";

grant delete on table "public"."role_scope" to "service_role";

grant insert on table "public"."role_scope" to "service_role";

grant references on table "public"."role_scope" to "service_role";

grant select on table "public"."role_scope" to "service_role";

grant trigger on table "public"."role_scope" to "service_role";

grant truncate on table "public"."role_scope" to "service_role";

grant update on table "public"."role_scope" to "service_role";

grant delete on table "public"."scope" to "anon";

grant insert on table "public"."scope" to "anon";

grant references on table "public"."scope" to "anon";

grant select on table "public"."scope" to "anon";

grant trigger on table "public"."scope" to "anon";

grant truncate on table "public"."scope" to "anon";

grant update on table "public"."scope" to "anon";

grant delete on table "public"."scope" to "authenticated";

grant insert on table "public"."scope" to "authenticated";

grant references on table "public"."scope" to "authenticated";

grant select on table "public"."scope" to "authenticated";

grant trigger on table "public"."scope" to "authenticated";

grant truncate on table "public"."scope" to "authenticated";

grant update on table "public"."scope" to "authenticated";

grant delete on table "public"."scope" to "service_role";

grant insert on table "public"."scope" to "service_role";

grant references on table "public"."scope" to "service_role";

grant select on table "public"."scope" to "service_role";

grant trigger on table "public"."scope" to "service_role";

grant truncate on table "public"."scope" to "service_role";

grant update on table "public"."scope" to "service_role";

grant delete on table "public"."settings" to "anon";

grant insert on table "public"."settings" to "anon";

grant references on table "public"."settings" to "anon";

grant select on table "public"."settings" to "anon";

grant trigger on table "public"."settings" to "anon";

grant truncate on table "public"."settings" to "anon";

grant update on table "public"."settings" to "anon";

grant delete on table "public"."settings" to "authenticated";

grant insert on table "public"."settings" to "authenticated";

grant references on table "public"."settings" to "authenticated";

grant select on table "public"."settings" to "authenticated";

grant trigger on table "public"."settings" to "authenticated";

grant truncate on table "public"."settings" to "authenticated";

grant update on table "public"."settings" to "authenticated";

grant delete on table "public"."settings" to "service_role";

grant insert on table "public"."settings" to "service_role";

grant references on table "public"."settings" to "service_role";

grant select on table "public"."settings" to "service_role";

grant trigger on table "public"."settings" to "service_role";

grant truncate on table "public"."settings" to "service_role";

grant update on table "public"."settings" to "service_role";

grant delete on table "public"."shared_credentials" to "anon";

grant insert on table "public"."shared_credentials" to "anon";

grant references on table "public"."shared_credentials" to "anon";

grant select on table "public"."shared_credentials" to "anon";

grant trigger on table "public"."shared_credentials" to "anon";

grant truncate on table "public"."shared_credentials" to "anon";

grant update on table "public"."shared_credentials" to "anon";

grant delete on table "public"."shared_credentials" to "authenticated";

grant insert on table "public"."shared_credentials" to "authenticated";

grant references on table "public"."shared_credentials" to "authenticated";

grant select on table "public"."shared_credentials" to "authenticated";

grant trigger on table "public"."shared_credentials" to "authenticated";

grant truncate on table "public"."shared_credentials" to "authenticated";

grant update on table "public"."shared_credentials" to "authenticated";

grant delete on table "public"."shared_credentials" to "service_role";

grant insert on table "public"."shared_credentials" to "service_role";

grant references on table "public"."shared_credentials" to "service_role";

grant select on table "public"."shared_credentials" to "service_role";

grant trigger on table "public"."shared_credentials" to "service_role";

grant truncate on table "public"."shared_credentials" to "service_role";

grant update on table "public"."shared_credentials" to "service_role";

grant delete on table "public"."shared_workflow" to "anon";

grant insert on table "public"."shared_workflow" to "anon";

grant references on table "public"."shared_workflow" to "anon";

grant select on table "public"."shared_workflow" to "anon";

grant trigger on table "public"."shared_workflow" to "anon";

grant truncate on table "public"."shared_workflow" to "anon";

grant update on table "public"."shared_workflow" to "anon";

grant delete on table "public"."shared_workflow" to "authenticated";

grant insert on table "public"."shared_workflow" to "authenticated";

grant references on table "public"."shared_workflow" to "authenticated";

grant select on table "public"."shared_workflow" to "authenticated";

grant trigger on table "public"."shared_workflow" to "authenticated";

grant truncate on table "public"."shared_workflow" to "authenticated";

grant update on table "public"."shared_workflow" to "authenticated";

grant delete on table "public"."shared_workflow" to "service_role";

grant insert on table "public"."shared_workflow" to "service_role";

grant references on table "public"."shared_workflow" to "service_role";

grant select on table "public"."shared_workflow" to "service_role";

grant trigger on table "public"."shared_workflow" to "service_role";

grant truncate on table "public"."shared_workflow" to "service_role";

grant update on table "public"."shared_workflow" to "service_role";

grant delete on table "public"."songs" to "anon";

grant insert on table "public"."songs" to "anon";

grant references on table "public"."songs" to "anon";

grant select on table "public"."songs" to "anon";

grant trigger on table "public"."songs" to "anon";

grant truncate on table "public"."songs" to "anon";

grant update on table "public"."songs" to "anon";

grant delete on table "public"."songs" to "authenticated";

grant insert on table "public"."songs" to "authenticated";

grant references on table "public"."songs" to "authenticated";

grant select on table "public"."songs" to "authenticated";

grant trigger on table "public"."songs" to "authenticated";

grant truncate on table "public"."songs" to "authenticated";

grant update on table "public"."songs" to "authenticated";

grant delete on table "public"."songs" to "service_role";

grant insert on table "public"."songs" to "service_role";

grant references on table "public"."songs" to "service_role";

grant select on table "public"."songs" to "service_role";

grant trigger on table "public"."songs" to "service_role";

grant truncate on table "public"."songs" to "service_role";

grant update on table "public"."songs" to "service_role";

grant delete on table "public"."spotify_recommendations" to "anon";

grant insert on table "public"."spotify_recommendations" to "anon";

grant references on table "public"."spotify_recommendations" to "anon";

grant select on table "public"."spotify_recommendations" to "anon";

grant trigger on table "public"."spotify_recommendations" to "anon";

grant truncate on table "public"."spotify_recommendations" to "anon";

grant update on table "public"."spotify_recommendations" to "anon";

grant delete on table "public"."spotify_recommendations" to "authenticated";

grant insert on table "public"."spotify_recommendations" to "authenticated";

grant references on table "public"."spotify_recommendations" to "authenticated";

grant select on table "public"."spotify_recommendations" to "authenticated";

grant trigger on table "public"."spotify_recommendations" to "authenticated";

grant truncate on table "public"."spotify_recommendations" to "authenticated";

grant update on table "public"."spotify_recommendations" to "authenticated";

grant delete on table "public"."spotify_recommendations" to "service_role";

grant insert on table "public"."spotify_recommendations" to "service_role";

grant references on table "public"."spotify_recommendations" to "service_role";

grant select on table "public"."spotify_recommendations" to "service_role";

grant trigger on table "public"."spotify_recommendations" to "service_role";

grant truncate on table "public"."spotify_recommendations" to "service_role";

grant update on table "public"."spotify_recommendations" to "service_role";

grant delete on table "public"."subscriptions" to "anon";

grant insert on table "public"."subscriptions" to "anon";

grant references on table "public"."subscriptions" to "anon";

grant select on table "public"."subscriptions" to "anon";

grant trigger on table "public"."subscriptions" to "anon";

grant truncate on table "public"."subscriptions" to "anon";

grant update on table "public"."subscriptions" to "anon";

grant delete on table "public"."subscriptions" to "authenticated";

grant insert on table "public"."subscriptions" to "authenticated";

grant references on table "public"."subscriptions" to "authenticated";

grant select on table "public"."subscriptions" to "authenticated";

grant trigger on table "public"."subscriptions" to "authenticated";

grant truncate on table "public"."subscriptions" to "authenticated";

grant update on table "public"."subscriptions" to "authenticated";

grant delete on table "public"."subscriptions" to "service_role";

grant insert on table "public"."subscriptions" to "service_role";

grant references on table "public"."subscriptions" to "service_role";

grant select on table "public"."subscriptions" to "service_role";

grant trigger on table "public"."subscriptions" to "service_role";

grant truncate on table "public"."subscriptions" to "service_role";

grant update on table "public"."subscriptions" to "service_role";

grant delete on table "public"."tag_entity" to "anon";

grant insert on table "public"."tag_entity" to "anon";

grant references on table "public"."tag_entity" to "anon";

grant select on table "public"."tag_entity" to "anon";

grant trigger on table "public"."tag_entity" to "anon";

grant truncate on table "public"."tag_entity" to "anon";

grant update on table "public"."tag_entity" to "anon";

grant delete on table "public"."tag_entity" to "authenticated";

grant insert on table "public"."tag_entity" to "authenticated";

grant references on table "public"."tag_entity" to "authenticated";

grant select on table "public"."tag_entity" to "authenticated";

grant trigger on table "public"."tag_entity" to "authenticated";

grant truncate on table "public"."tag_entity" to "authenticated";

grant update on table "public"."tag_entity" to "authenticated";

grant delete on table "public"."tag_entity" to "service_role";

grant insert on table "public"."tag_entity" to "service_role";

grant references on table "public"."tag_entity" to "service_role";

grant select on table "public"."tag_entity" to "service_role";

grant trigger on table "public"."tag_entity" to "service_role";

grant truncate on table "public"."tag_entity" to "service_role";

grant update on table "public"."tag_entity" to "service_role";

grant delete on table "public"."test_case_execution" to "anon";

grant insert on table "public"."test_case_execution" to "anon";

grant references on table "public"."test_case_execution" to "anon";

grant select on table "public"."test_case_execution" to "anon";

grant trigger on table "public"."test_case_execution" to "anon";

grant truncate on table "public"."test_case_execution" to "anon";

grant update on table "public"."test_case_execution" to "anon";

grant delete on table "public"."test_case_execution" to "authenticated";

grant insert on table "public"."test_case_execution" to "authenticated";

grant references on table "public"."test_case_execution" to "authenticated";

grant select on table "public"."test_case_execution" to "authenticated";

grant trigger on table "public"."test_case_execution" to "authenticated";

grant truncate on table "public"."test_case_execution" to "authenticated";

grant update on table "public"."test_case_execution" to "authenticated";

grant delete on table "public"."test_case_execution" to "service_role";

grant insert on table "public"."test_case_execution" to "service_role";

grant references on table "public"."test_case_execution" to "service_role";

grant select on table "public"."test_case_execution" to "service_role";

grant trigger on table "public"."test_case_execution" to "service_role";

grant truncate on table "public"."test_case_execution" to "service_role";

grant update on table "public"."test_case_execution" to "service_role";

grant delete on table "public"."test_run" to "anon";

grant insert on table "public"."test_run" to "anon";

grant references on table "public"."test_run" to "anon";

grant select on table "public"."test_run" to "anon";

grant trigger on table "public"."test_run" to "anon";

grant truncate on table "public"."test_run" to "anon";

grant update on table "public"."test_run" to "anon";

grant delete on table "public"."test_run" to "authenticated";

grant insert on table "public"."test_run" to "authenticated";

grant references on table "public"."test_run" to "authenticated";

grant select on table "public"."test_run" to "authenticated";

grant trigger on table "public"."test_run" to "authenticated";

grant truncate on table "public"."test_run" to "authenticated";

grant update on table "public"."test_run" to "authenticated";

grant delete on table "public"."test_run" to "service_role";

grant insert on table "public"."test_run" to "service_role";

grant references on table "public"."test_run" to "service_role";

grant select on table "public"."test_run" to "service_role";

grant trigger on table "public"."test_run" to "service_role";

grant truncate on table "public"."test_run" to "service_role";

grant update on table "public"."test_run" to "service_role";

grant delete on table "public"."tool" to "anon";

grant insert on table "public"."tool" to "anon";

grant references on table "public"."tool" to "anon";

grant select on table "public"."tool" to "anon";

grant trigger on table "public"."tool" to "anon";

grant truncate on table "public"."tool" to "anon";

grant update on table "public"."tool" to "anon";

grant delete on table "public"."tool" to "authenticated";

grant insert on table "public"."tool" to "authenticated";

grant references on table "public"."tool" to "authenticated";

grant select on table "public"."tool" to "authenticated";

grant trigger on table "public"."tool" to "authenticated";

grant truncate on table "public"."tool" to "authenticated";

grant update on table "public"."tool" to "authenticated";

grant delete on table "public"."tool" to "service_role";

grant insert on table "public"."tool" to "service_role";

grant references on table "public"."tool" to "service_role";

grant select on table "public"."tool" to "service_role";

grant trigger on table "public"."tool" to "service_role";

grant truncate on table "public"."tool" to "service_role";

grant update on table "public"."tool" to "service_role";

grant delete on table "public"."track_artists" to "anon";

grant insert on table "public"."track_artists" to "anon";

grant references on table "public"."track_artists" to "anon";

grant select on table "public"."track_artists" to "anon";

grant trigger on table "public"."track_artists" to "anon";

grant truncate on table "public"."track_artists" to "anon";

grant update on table "public"."track_artists" to "anon";

grant delete on table "public"."track_artists" to "authenticated";

grant insert on table "public"."track_artists" to "authenticated";

grant references on table "public"."track_artists" to "authenticated";

grant select on table "public"."track_artists" to "authenticated";

grant trigger on table "public"."track_artists" to "authenticated";

grant truncate on table "public"."track_artists" to "authenticated";

grant update on table "public"."track_artists" to "authenticated";

grant delete on table "public"."track_artists" to "service_role";

grant insert on table "public"."track_artists" to "service_role";

grant references on table "public"."track_artists" to "service_role";

grant select on table "public"."track_artists" to "service_role";

grant trigger on table "public"."track_artists" to "service_role";

grant truncate on table "public"."track_artists" to "service_role";

grant update on table "public"."track_artists" to "service_role";

grant delete on table "public"."tracks" to "anon";

grant insert on table "public"."tracks" to "anon";

grant references on table "public"."tracks" to "anon";

grant select on table "public"."tracks" to "anon";

grant trigger on table "public"."tracks" to "anon";

grant truncate on table "public"."tracks" to "anon";

grant update on table "public"."tracks" to "anon";

grant delete on table "public"."tracks" to "authenticated";

grant insert on table "public"."tracks" to "authenticated";

grant references on table "public"."tracks" to "authenticated";

grant select on table "public"."tracks" to "authenticated";

grant trigger on table "public"."tracks" to "authenticated";

grant truncate on table "public"."tracks" to "authenticated";

grant update on table "public"."tracks" to "authenticated";

grant delete on table "public"."tracks" to "service_role";

grant insert on table "public"."tracks" to "service_role";

grant references on table "public"."tracks" to "service_role";

grant select on table "public"."tracks" to "service_role";

grant trigger on table "public"."tracks" to "service_role";

grant truncate on table "public"."tracks" to "service_role";

grant update on table "public"."tracks" to "service_role";

grant delete on table "public"."upsert_history" to "anon";

grant insert on table "public"."upsert_history" to "anon";

grant references on table "public"."upsert_history" to "anon";

grant select on table "public"."upsert_history" to "anon";

grant trigger on table "public"."upsert_history" to "anon";

grant truncate on table "public"."upsert_history" to "anon";

grant update on table "public"."upsert_history" to "anon";

grant delete on table "public"."upsert_history" to "authenticated";

grant insert on table "public"."upsert_history" to "authenticated";

grant references on table "public"."upsert_history" to "authenticated";

grant select on table "public"."upsert_history" to "authenticated";

grant trigger on table "public"."upsert_history" to "authenticated";

grant truncate on table "public"."upsert_history" to "authenticated";

grant update on table "public"."upsert_history" to "authenticated";

grant delete on table "public"."upsert_history" to "service_role";

grant insert on table "public"."upsert_history" to "service_role";

grant references on table "public"."upsert_history" to "service_role";

grant select on table "public"."upsert_history" to "service_role";

grant trigger on table "public"."upsert_history" to "service_role";

grant truncate on table "public"."upsert_history" to "service_role";

grant update on table "public"."upsert_history" to "service_role";

grant delete on table "public"."user" to "anon";

grant insert on table "public"."user" to "anon";

grant references on table "public"."user" to "anon";

grant select on table "public"."user" to "anon";

grant trigger on table "public"."user" to "anon";

grant truncate on table "public"."user" to "anon";

grant update on table "public"."user" to "anon";

grant delete on table "public"."user" to "authenticated";

grant insert on table "public"."user" to "authenticated";

grant references on table "public"."user" to "authenticated";

grant select on table "public"."user" to "authenticated";

grant trigger on table "public"."user" to "authenticated";

grant truncate on table "public"."user" to "authenticated";

grant update on table "public"."user" to "authenticated";

grant delete on table "public"."user" to "service_role";

grant insert on table "public"."user" to "service_role";

grant references on table "public"."user" to "service_role";

grant select on table "public"."user" to "service_role";

grant trigger on table "public"."user" to "service_role";

grant truncate on table "public"."user" to "service_role";

grant update on table "public"."user" to "service_role";

grant delete on table "public"."user_api_keys" to "anon";

grant insert on table "public"."user_api_keys" to "anon";

grant references on table "public"."user_api_keys" to "anon";

grant select on table "public"."user_api_keys" to "anon";

grant trigger on table "public"."user_api_keys" to "anon";

grant truncate on table "public"."user_api_keys" to "anon";

grant update on table "public"."user_api_keys" to "anon";

grant delete on table "public"."user_api_keys" to "authenticated";

grant insert on table "public"."user_api_keys" to "authenticated";

grant references on table "public"."user_api_keys" to "authenticated";

grant select on table "public"."user_api_keys" to "authenticated";

grant trigger on table "public"."user_api_keys" to "authenticated";

grant truncate on table "public"."user_api_keys" to "authenticated";

grant update on table "public"."user_api_keys" to "authenticated";

grant delete on table "public"."user_api_keys" to "service_role";

grant insert on table "public"."user_api_keys" to "service_role";

grant references on table "public"."user_api_keys" to "service_role";

grant select on table "public"."user_api_keys" to "service_role";

grant trigger on table "public"."user_api_keys" to "service_role";

grant truncate on table "public"."user_api_keys" to "service_role";

grant update on table "public"."user_api_keys" to "service_role";

grant delete on table "public"."user_settings" to "anon";

grant insert on table "public"."user_settings" to "anon";

grant references on table "public"."user_settings" to "anon";

grant select on table "public"."user_settings" to "anon";

grant trigger on table "public"."user_settings" to "anon";

grant truncate on table "public"."user_settings" to "anon";

grant update on table "public"."user_settings" to "anon";

grant delete on table "public"."user_settings" to "authenticated";

grant insert on table "public"."user_settings" to "authenticated";

grant references on table "public"."user_settings" to "authenticated";

grant select on table "public"."user_settings" to "authenticated";

grant trigger on table "public"."user_settings" to "authenticated";

grant truncate on table "public"."user_settings" to "authenticated";

grant update on table "public"."user_settings" to "authenticated";

grant delete on table "public"."user_settings" to "service_role";

grant insert on table "public"."user_settings" to "service_role";

grant references on table "public"."user_settings" to "service_role";

grant select on table "public"."user_settings" to "service_role";

grant trigger on table "public"."user_settings" to "service_role";

grant truncate on table "public"."user_settings" to "service_role";

grant update on table "public"."user_settings" to "service_role";

grant delete on table "public"."user_spotify_tokens" to "anon";

grant insert on table "public"."user_spotify_tokens" to "anon";

grant references on table "public"."user_spotify_tokens" to "anon";

grant select on table "public"."user_spotify_tokens" to "anon";

grant trigger on table "public"."user_spotify_tokens" to "anon";

grant truncate on table "public"."user_spotify_tokens" to "anon";

grant update on table "public"."user_spotify_tokens" to "anon";

grant delete on table "public"."user_spotify_tokens" to "authenticated";

grant insert on table "public"."user_spotify_tokens" to "authenticated";

grant references on table "public"."user_spotify_tokens" to "authenticated";

grant select on table "public"."user_spotify_tokens" to "authenticated";

grant trigger on table "public"."user_spotify_tokens" to "authenticated";

grant truncate on table "public"."user_spotify_tokens" to "authenticated";

grant update on table "public"."user_spotify_tokens" to "authenticated";

grant delete on table "public"."user_spotify_tokens" to "service_role";

grant insert on table "public"."user_spotify_tokens" to "service_role";

grant references on table "public"."user_spotify_tokens" to "service_role";

grant select on table "public"."user_spotify_tokens" to "service_role";

grant trigger on table "public"."user_spotify_tokens" to "service_role";

grant truncate on table "public"."user_spotify_tokens" to "service_role";

grant update on table "public"."user_spotify_tokens" to "service_role";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant references on table "public"."users" to "anon";

grant select on table "public"."users" to "anon";

grant trigger on table "public"."users" to "anon";

grant truncate on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."users" to "authenticated";

grant insert on table "public"."users" to "authenticated";

grant references on table "public"."users" to "authenticated";

grant select on table "public"."users" to "authenticated";

grant trigger on table "public"."users" to "authenticated";

grant truncate on table "public"."users" to "authenticated";

grant update on table "public"."users" to "authenticated";

grant delete on table "public"."users" to "service_role";

grant insert on table "public"."users" to "service_role";

grant references on table "public"."users" to "service_role";

grant select on table "public"."users" to "service_role";

grant trigger on table "public"."users" to "service_role";

grant truncate on table "public"."users" to "service_role";

grant update on table "public"."users" to "service_role";

grant delete on table "public"."variable" to "anon";

grant insert on table "public"."variable" to "anon";

grant references on table "public"."variable" to "anon";

grant select on table "public"."variable" to "anon";

grant trigger on table "public"."variable" to "anon";

grant truncate on table "public"."variable" to "anon";

grant update on table "public"."variable" to "anon";

grant delete on table "public"."variable" to "authenticated";

grant insert on table "public"."variable" to "authenticated";

grant references on table "public"."variable" to "authenticated";

grant select on table "public"."variable" to "authenticated";

grant trigger on table "public"."variable" to "authenticated";

grant truncate on table "public"."variable" to "authenticated";

grant update on table "public"."variable" to "authenticated";

grant delete on table "public"."variable" to "service_role";

grant insert on table "public"."variable" to "service_role";

grant references on table "public"."variable" to "service_role";

grant select on table "public"."variable" to "service_role";

grant trigger on table "public"."variable" to "service_role";

grant truncate on table "public"."variable" to "service_role";

grant update on table "public"."variable" to "service_role";

grant delete on table "public"."variables" to "anon";

grant insert on table "public"."variables" to "anon";

grant references on table "public"."variables" to "anon";

grant select on table "public"."variables" to "anon";

grant trigger on table "public"."variables" to "anon";

grant truncate on table "public"."variables" to "anon";

grant update on table "public"."variables" to "anon";

grant delete on table "public"."variables" to "authenticated";

grant insert on table "public"."variables" to "authenticated";

grant references on table "public"."variables" to "authenticated";

grant select on table "public"."variables" to "authenticated";

grant trigger on table "public"."variables" to "authenticated";

grant truncate on table "public"."variables" to "authenticated";

grant update on table "public"."variables" to "authenticated";

grant delete on table "public"."variables" to "service_role";

grant insert on table "public"."variables" to "service_role";

grant references on table "public"."variables" to "service_role";

grant select on table "public"."variables" to "service_role";

grant trigger on table "public"."variables" to "service_role";

grant truncate on table "public"."variables" to "service_role";

grant update on table "public"."variables" to "service_role";

grant delete on table "public"."webhook_entity" to "anon";

grant insert on table "public"."webhook_entity" to "anon";

grant references on table "public"."webhook_entity" to "anon";

grant select on table "public"."webhook_entity" to "anon";

grant trigger on table "public"."webhook_entity" to "anon";

grant truncate on table "public"."webhook_entity" to "anon";

grant update on table "public"."webhook_entity" to "anon";

grant delete on table "public"."webhook_entity" to "authenticated";

grant insert on table "public"."webhook_entity" to "authenticated";

grant references on table "public"."webhook_entity" to "authenticated";

grant select on table "public"."webhook_entity" to "authenticated";

grant trigger on table "public"."webhook_entity" to "authenticated";

grant truncate on table "public"."webhook_entity" to "authenticated";

grant update on table "public"."webhook_entity" to "authenticated";

grant delete on table "public"."webhook_entity" to "service_role";

grant insert on table "public"."webhook_entity" to "service_role";

grant references on table "public"."webhook_entity" to "service_role";

grant select on table "public"."webhook_entity" to "service_role";

grant trigger on table "public"."webhook_entity" to "service_role";

grant truncate on table "public"."webhook_entity" to "service_role";

grant update on table "public"."webhook_entity" to "service_role";

grant delete on table "public"."workflow_dependency" to "anon";

grant insert on table "public"."workflow_dependency" to "anon";

grant references on table "public"."workflow_dependency" to "anon";

grant select on table "public"."workflow_dependency" to "anon";

grant trigger on table "public"."workflow_dependency" to "anon";

grant truncate on table "public"."workflow_dependency" to "anon";

grant update on table "public"."workflow_dependency" to "anon";

grant delete on table "public"."workflow_dependency" to "authenticated";

grant insert on table "public"."workflow_dependency" to "authenticated";

grant references on table "public"."workflow_dependency" to "authenticated";

grant select on table "public"."workflow_dependency" to "authenticated";

grant trigger on table "public"."workflow_dependency" to "authenticated";

grant truncate on table "public"."workflow_dependency" to "authenticated";

grant update on table "public"."workflow_dependency" to "authenticated";

grant delete on table "public"."workflow_dependency" to "service_role";

grant insert on table "public"."workflow_dependency" to "service_role";

grant references on table "public"."workflow_dependency" to "service_role";

grant select on table "public"."workflow_dependency" to "service_role";

grant trigger on table "public"."workflow_dependency" to "service_role";

grant truncate on table "public"."workflow_dependency" to "service_role";

grant update on table "public"."workflow_dependency" to "service_role";

grant delete on table "public"."workflow_entity" to "anon";

grant insert on table "public"."workflow_entity" to "anon";

grant references on table "public"."workflow_entity" to "anon";

grant select on table "public"."workflow_entity" to "anon";

grant trigger on table "public"."workflow_entity" to "anon";

grant truncate on table "public"."workflow_entity" to "anon";

grant update on table "public"."workflow_entity" to "anon";

grant delete on table "public"."workflow_entity" to "authenticated";

grant insert on table "public"."workflow_entity" to "authenticated";

grant references on table "public"."workflow_entity" to "authenticated";

grant select on table "public"."workflow_entity" to "authenticated";

grant trigger on table "public"."workflow_entity" to "authenticated";

grant truncate on table "public"."workflow_entity" to "authenticated";

grant update on table "public"."workflow_entity" to "authenticated";

grant delete on table "public"."workflow_entity" to "service_role";

grant insert on table "public"."workflow_entity" to "service_role";

grant references on table "public"."workflow_entity" to "service_role";

grant select on table "public"."workflow_entity" to "service_role";

grant trigger on table "public"."workflow_entity" to "service_role";

grant truncate on table "public"."workflow_entity" to "service_role";

grant update on table "public"."workflow_entity" to "service_role";

grant delete on table "public"."workflow_history" to "anon";

grant insert on table "public"."workflow_history" to "anon";

grant references on table "public"."workflow_history" to "anon";

grant select on table "public"."workflow_history" to "anon";

grant trigger on table "public"."workflow_history" to "anon";

grant truncate on table "public"."workflow_history" to "anon";

grant update on table "public"."workflow_history" to "anon";

grant delete on table "public"."workflow_history" to "authenticated";

grant insert on table "public"."workflow_history" to "authenticated";

grant references on table "public"."workflow_history" to "authenticated";

grant select on table "public"."workflow_history" to "authenticated";

grant trigger on table "public"."workflow_history" to "authenticated";

grant truncate on table "public"."workflow_history" to "authenticated";

grant update on table "public"."workflow_history" to "authenticated";

grant delete on table "public"."workflow_history" to "service_role";

grant insert on table "public"."workflow_history" to "service_role";

grant references on table "public"."workflow_history" to "service_role";

grant select on table "public"."workflow_history" to "service_role";

grant trigger on table "public"."workflow_history" to "service_role";

grant truncate on table "public"."workflow_history" to "service_role";

grant update on table "public"."workflow_history" to "service_role";

grant delete on table "public"."workflow_publish_history" to "anon";

grant insert on table "public"."workflow_publish_history" to "anon";

grant references on table "public"."workflow_publish_history" to "anon";

grant select on table "public"."workflow_publish_history" to "anon";

grant trigger on table "public"."workflow_publish_history" to "anon";

grant truncate on table "public"."workflow_publish_history" to "anon";

grant update on table "public"."workflow_publish_history" to "anon";

grant delete on table "public"."workflow_publish_history" to "authenticated";

grant insert on table "public"."workflow_publish_history" to "authenticated";

grant references on table "public"."workflow_publish_history" to "authenticated";

grant select on table "public"."workflow_publish_history" to "authenticated";

grant trigger on table "public"."workflow_publish_history" to "authenticated";

grant truncate on table "public"."workflow_publish_history" to "authenticated";

grant update on table "public"."workflow_publish_history" to "authenticated";

grant delete on table "public"."workflow_publish_history" to "service_role";

grant insert on table "public"."workflow_publish_history" to "service_role";

grant references on table "public"."workflow_publish_history" to "service_role";

grant select on table "public"."workflow_publish_history" to "service_role";

grant trigger on table "public"."workflow_publish_history" to "service_role";

grant truncate on table "public"."workflow_publish_history" to "service_role";

grant update on table "public"."workflow_publish_history" to "service_role";

grant delete on table "public"."workflow_statistics" to "anon";

grant insert on table "public"."workflow_statistics" to "anon";

grant references on table "public"."workflow_statistics" to "anon";

grant select on table "public"."workflow_statistics" to "anon";

grant trigger on table "public"."workflow_statistics" to "anon";

grant truncate on table "public"."workflow_statistics" to "anon";

grant update on table "public"."workflow_statistics" to "anon";

grant delete on table "public"."workflow_statistics" to "authenticated";

grant insert on table "public"."workflow_statistics" to "authenticated";

grant references on table "public"."workflow_statistics" to "authenticated";

grant select on table "public"."workflow_statistics" to "authenticated";

grant trigger on table "public"."workflow_statistics" to "authenticated";

grant truncate on table "public"."workflow_statistics" to "authenticated";

grant update on table "public"."workflow_statistics" to "authenticated";

grant delete on table "public"."workflow_statistics" to "service_role";

grant insert on table "public"."workflow_statistics" to "service_role";

grant references on table "public"."workflow_statistics" to "service_role";

grant select on table "public"."workflow_statistics" to "service_role";

grant trigger on table "public"."workflow_statistics" to "service_role";

grant truncate on table "public"."workflow_statistics" to "service_role";

grant update on table "public"."workflow_statistics" to "service_role";

grant delete on table "public"."workflows_tags" to "anon";

grant insert on table "public"."workflows_tags" to "anon";

grant references on table "public"."workflows_tags" to "anon";

grant select on table "public"."workflows_tags" to "anon";

grant trigger on table "public"."workflows_tags" to "anon";

grant truncate on table "public"."workflows_tags" to "anon";

grant update on table "public"."workflows_tags" to "anon";

grant delete on table "public"."workflows_tags" to "authenticated";

grant insert on table "public"."workflows_tags" to "authenticated";

grant references on table "public"."workflows_tags" to "authenticated";

grant select on table "public"."workflows_tags" to "authenticated";

grant trigger on table "public"."workflows_tags" to "authenticated";

grant truncate on table "public"."workflows_tags" to "authenticated";

grant update on table "public"."workflows_tags" to "authenticated";

grant delete on table "public"."workflows_tags" to "service_role";

grant insert on table "public"."workflows_tags" to "service_role";

grant references on table "public"."workflows_tags" to "service_role";

grant select on table "public"."workflows_tags" to "service_role";

grant trigger on table "public"."workflows_tags" to "service_role";

grant truncate on table "public"."workflows_tags" to "service_role";

grant update on table "public"."workflows_tags" to "service_role";


  create policy "AI agents are viewable by everyone."
  on "public"."ai_agents"
  as permissive
  for select
  to authenticated, anon
using (true);



  create policy "Only admins can manage AI agents."
  on "public"."ai_agents"
  as permissive
  for all
  to authenticated
using (( SELECT profiles.is_admin
   FROM public.profiles
  WHERE (profiles.id = auth.uid())));



  create policy "albums_insert_authenticated"
  on "public"."albums"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "albums_select_anon"
  on "public"."albums"
  as permissive
  for select
  to anon
using (true);



  create policy "albums_select_authenticated"
  on "public"."albums"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Only admins can view analytics."
  on "public"."analytics"
  as permissive
  for select
  to authenticated
using (( SELECT profiles.is_admin
   FROM public.profiles
  WHERE (profiles.id = auth.uid())));



  create policy "System can insert analytics."
  on "public"."analytics"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "artists_insert_authenticated"
  on "public"."artists"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "artists_select_anon"
  on "public"."artists"
  as permissive
  for select
  to anon
using (true);



  create policy "artists_select_authenticated"
  on "public"."artists"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Users can create their own conversations."
  on "public"."conversations"
  as permissive
  for insert
  to authenticated
with check ((user_id = auth.uid()));



  create policy "Users can delete their own conversations."
  on "public"."conversations"
  as permissive
  for delete
  to authenticated
using ((user_id = auth.uid()));



  create policy "Users can update their own conversations."
  on "public"."conversations"
  as permissive
  for update
  to authenticated
using ((user_id = auth.uid()));



  create policy "Users can view their own conversations."
  on "public"."conversations"
  as permissive
  for select
  to authenticated
using ((user_id = auth.uid()));



  create policy "customers_insert_authenticated"
  on "public"."customers"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = id));



  create policy "customers_select_authenticated"
  on "public"."customers"
  as permissive
  for select
  to authenticated
using ((auth.uid() = id));



  create policy "customers_update_authenticated"
  on "public"."customers"
  as permissive
  for update
  to authenticated
using ((auth.uid() = id))
with check ((auth.uid() = id));



  create policy "Authenticated users can view all documents."
  on "public"."documents"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Only admins can manage documents."
  on "public"."documents"
  as permissive
  for all
  to authenticated
using (( SELECT profiles.is_admin
   FROM public.profiles
  WHERE (profiles.id = auth.uid())));



  create policy "Public documents are viewable by everyone."
  on "public"."documents"
  as permissive
  for select
  to authenticated, anon
using ((is_public = true));



  create policy "Anyone can view fragrance blends"
  on "public"."fragrance_blends"
  as permissive
  for select
  to public
using (true);



  create policy "Authenticated users can insert fragrance blends"
  on "public"."fragrance_blends"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Anyone can view fragrance oils"
  on "public"."fragrance_oils"
  as permissive
  for select
  to public
using (true);



  create policy "Authenticated users can insert fragrance oils"
  on "public"."fragrance_oils"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Authenticated users can update fragrance oils"
  on "public"."fragrance_oils"
  as permissive
  for update
  to authenticated
using (true);



  create policy "Anyone can view fragrance reviews"
  on "public"."fragrance_reviews"
  as permissive
  for select
  to public
using (true);



  create policy "Authenticated users can insert fragrance reviews"
  on "public"."fragrance_reviews"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "liked_navidrome_tracks_delete_authenticated"
  on "public"."liked_navidrome_tracks"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = user_id));



  create policy "liked_navidrome_tracks_insert_authenticated"
  on "public"."liked_navidrome_tracks"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "liked_navidrome_tracks_select_authenticated"
  on "public"."liked_navidrome_tracks"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));



  create policy "liked_songs_delete_authenticated"
  on "public"."liked_songs"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = user_id));



  create policy "liked_songs_insert_authenticated"
  on "public"."liked_songs"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "liked_songs_select_authenticated"
  on "public"."liked_songs"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));



  create policy "likes_delete_authenticated"
  on "public"."likes"
  as permissive
  for delete
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "likes_insert_authenticated"
  on "public"."likes"
  as permissive
  for insert
  to authenticated
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "likes_select_authenticated"
  on "public"."likes"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "listening_history_insert_authenticated"
  on "public"."listening_history"
  as permissive
  for insert
  to authenticated
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "listening_history_select_authenticated"
  on "public"."listening_history"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Users can delete messages in their conversations."
  on "public"."messages"
  as permissive
  for delete
  to authenticated
using ((conversation_id IN ( SELECT conversations.id
   FROM public.conversations
  WHERE (conversations.user_id = auth.uid()))));



  create policy "Users can insert messages in their conversations."
  on "public"."messages"
  as permissive
  for insert
  to authenticated
with check ((conversation_id IN ( SELECT conversations.id
   FROM public.conversations
  WHERE (conversations.user_id = auth.uid()))));



  create policy "Users can update their own messages."
  on "public"."messages"
  as permissive
  for update
  to authenticated
using (((sender_type = 'user'::text) AND (sender_id = auth.uid()) AND (conversation_id IN ( SELECT conversations.id
   FROM public.conversations
  WHERE (conversations.user_id = auth.uid())))));



  create policy "Users can view messages in their conversations."
  on "public"."messages"
  as permissive
  for select
  to authenticated
using ((conversation_id IN ( SELECT conversations.id
   FROM public.conversations
  WHERE (conversations.user_id = auth.uid()))));



  create policy "music_requests_insert_authenticated"
  on "public"."music_requests"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "music_requests_select_authenticated"
  on "public"."music_requests"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));



  create policy "music_requests_update_authenticated"
  on "public"."music_requests"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "System can create notifications."
  on "public"."notifications"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Users can delete their own notifications."
  on "public"."notifications"
  as permissive
  for delete
  to authenticated
using ((user_id = auth.uid()));



  create policy "Users can update their own notifications."
  on "public"."notifications"
  as permissive
  for update
  to authenticated
using ((user_id = auth.uid()));



  create policy "Users can view their own notifications."
  on "public"."notifications"
  as permissive
  for select
  to authenticated
using ((user_id = auth.uid()));



  create policy "Authenticated users can view all ollama documents."
  on "public"."ollama_documents"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Only admins can manage ollama documents."
  on "public"."ollama_documents"
  as permissive
  for all
  to authenticated
using (( SELECT profiles.is_admin
   FROM public.profiles
  WHERE (profiles.id = auth.uid())));



  create policy "Public ollama documents are viewable by everyone."
  on "public"."ollama_documents"
  as permissive
  for select
  to authenticated, anon
using ((is_public = true));



  create policy "playlist_tracks_delete_authenticated"
  on "public"."playlist_tracks"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.playlists p
  WHERE ((p.id = playlist_tracks.playlist_id) AND (p.owner_id = ( SELECT auth.uid() AS uid))))));



  create policy "playlist_tracks_insert_authenticated"
  on "public"."playlist_tracks"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.playlists p
  WHERE ((p.id = playlist_tracks.playlist_id) AND (p.owner_id = ( SELECT auth.uid() AS uid))))));



  create policy "playlist_tracks_select_anon"
  on "public"."playlist_tracks"
  as permissive
  for select
  to anon
using (true);



  create policy "playlist_tracks_select_authenticated"
  on "public"."playlist_tracks"
  as permissive
  for select
  to authenticated
using (true);



  create policy "playlist_tracks_update_authenticated"
  on "public"."playlist_tracks"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.playlists p
  WHERE ((p.id = playlist_tracks.playlist_id) AND (p.owner_id = ( SELECT auth.uid() AS uid))))))
with check ((EXISTS ( SELECT 1
   FROM public.playlists p
  WHERE ((p.id = playlist_tracks.playlist_id) AND (p.owner_id = ( SELECT auth.uid() AS uid))))));



  create policy "playlists_delete_authenticated"
  on "public"."playlists"
  as permissive
  for delete
  to authenticated
using ((( SELECT auth.uid() AS uid) = owner_id));



  create policy "playlists_insert_authenticated"
  on "public"."playlists"
  as permissive
  for insert
  to authenticated
with check ((( SELECT auth.uid() AS uid) = owner_id));



  create policy "playlists_select_anon"
  on "public"."playlists"
  as permissive
  for select
  to anon
using (true);



  create policy "playlists_select_authenticated"
  on "public"."playlists"
  as permissive
  for select
  to authenticated
using (true);



  create policy "playlists_update_authenticated"
  on "public"."playlists"
  as permissive
  for update
  to authenticated
using ((( SELECT auth.uid() AS uid) = owner_id))
with check ((( SELECT auth.uid() AS uid) = owner_id));



  create policy "prices_select_anon"
  on "public"."prices"
  as permissive
  for select
  to anon
using (true);



  create policy "prices_select_authenticated"
  on "public"."prices"
  as permissive
  for select
  to authenticated
using (true);



  create policy "products_select_anon"
  on "public"."products"
  as permissive
  for select
  to anon
using (true);



  create policy "products_select_authenticated"
  on "public"."products"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Public profiles are viewable by everyone."
  on "public"."profiles"
  as permissive
  for select
  to authenticated, anon
using (true);



  create policy "Service role can do all"
  on "public"."profiles"
  as permissive
  for all
  to public
using (((auth.jwt() ->> 'role'::text) = 'service_role'::text));



  create policy "Users can insert their own profile."
  on "public"."profiles"
  as permissive
  for insert
  to authenticated
with check ((( SELECT auth.uid() AS uid) = id));



  create policy "Users can update own profile"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((auth.uid() = id));



  create policy "Users can update their current_bucket."
  on "public"."profiles"
  as permissive
  for update
  to public
using ((id = auth.uid()));



  create policy "Users can update their own profile."
  on "public"."profiles"
  as permissive
  for update
  to authenticated
using ((( SELECT auth.uid() AS uid) = id));



  create policy "Users can view own profile"
  on "public"."profiles"
  as permissive
  for select
  to public
using ((auth.uid() = id));



  create policy "Users cannot delete profiles."
  on "public"."profiles"
  as permissive
  for delete
  to authenticated
using (false);



  create policy "profiles_insert_owner"
  on "public"."profiles"
  as permissive
  for insert
  to authenticated
with check ((( SELECT auth.uid() AS uid) = id));



  create policy "profiles_select_owner"
  on "public"."profiles"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) = id));



  create policy "profiles_select_public"
  on "public"."profiles"
  as permissive
  for select
  to anon, authenticated
using ((handle IS NOT NULL));



  create policy "profiles_update_owner"
  on "public"."profiles"
  as permissive
  for update
  to authenticated
using ((( SELECT auth.uid() AS uid) = id))
with check ((( SELECT auth.uid() AS uid) = id));



  create policy "songs_delete_authenticated"
  on "public"."songs"
  as permissive
  for delete
  to authenticated
using ((auth.uid() = user_id));



  create policy "songs_insert_authenticated"
  on "public"."songs"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "songs_select_anon"
  on "public"."songs"
  as permissive
  for select
  to anon
using (true);



  create policy "songs_select_authenticated"
  on "public"."songs"
  as permissive
  for select
  to authenticated
using (true);



  create policy "songs_update_authenticated"
  on "public"."songs"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "Allow authenticated users to insert spotify recommendations"
  on "public"."spotify_recommendations"
  as permissive
  for insert
  to public
with check ((auth.role() = 'authenticated'::text));



  create policy "Allow authenticated users to update spotify recommendations"
  on "public"."spotify_recommendations"
  as permissive
  for update
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Allow public read access to spotify recommendations"
  on "public"."spotify_recommendations"
  as permissive
  for select
  to public
using (true);



  create policy "subscriptions_insert_authenticated"
  on "public"."subscriptions"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "subscriptions_select_authenticated"
  on "public"."subscriptions"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));



  create policy "subscriptions_update_authenticated"
  on "public"."subscriptions"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "track_artists_insert_authenticated"
  on "public"."track_artists"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "track_artists_select_anon"
  on "public"."track_artists"
  as permissive
  for select
  to anon
using (true);



  create policy "track_artists_select_authenticated"
  on "public"."track_artists"
  as permissive
  for select
  to authenticated
using (true);



  create policy "tracks_insert_authenticated"
  on "public"."tracks"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "tracks_select_anon"
  on "public"."tracks"
  as permissive
  for select
  to anon
using (true);



  create policy "tracks_select_authenticated"
  on "public"."tracks"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Users can delete their own settings."
  on "public"."user_settings"
  as permissive
  for delete
  to authenticated
using ((user_id = auth.uid()));



  create policy "Users can insert their own settings."
  on "public"."user_settings"
  as permissive
  for insert
  to authenticated
with check ((user_id = auth.uid()));



  create policy "Users can update their own settings."
  on "public"."user_settings"
  as permissive
  for update
  to authenticated
using ((user_id = auth.uid()));



  create policy "Users can view their own settings."
  on "public"."user_settings"
  as permissive
  for select
  to authenticated
using ((user_id = auth.uid()));



  create policy "user_spotify_tokens_insert_authenticated"
  on "public"."user_spotify_tokens"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = user_id));



  create policy "user_spotify_tokens_select_authenticated"
  on "public"."user_spotify_tokens"
  as permissive
  for select
  to authenticated
using ((auth.uid() = user_id));



  create policy "user_spotify_tokens_update_authenticated"
  on "public"."user_spotify_tokens"
  as permissive
  for update
  to authenticated
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));



  create policy "users_insert_authenticated"
  on "public"."users"
  as permissive
  for insert
  to authenticated
with check ((auth.uid() = id));



  create policy "users_select_anon"
  on "public"."users"
  as permissive
  for select
  to anon
using (true);



  create policy "users_select_authenticated"
  on "public"."users"
  as permissive
  for select
  to authenticated
using (true);



  create policy "users_update_authenticated"
  on "public"."users"
  as permissive
  for update
  to authenticated
using ((auth.uid() = id))
with check ((auth.uid() = id));


CREATE TRIGGER workflow_version_increment BEFORE UPDATE ON n8n.workflow_entity FOR EACH ROW EXECUTE FUNCTION n8n.increment_workflow_version();

CREATE TRIGGER update_fragrance_oils_updated_at BEFORE UPDATE ON public.fragrance_oils FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER playlists_updated_at BEFORE UPDATE ON public.playlists FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER on_profile_created AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_settings();

CREATE TRIGGER on_profile_created_for_bucket AFTER INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.create_user_bucket();

CREATE TRIGGER on_profile_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_profile_updated();

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_profiles_updated_at();

CREATE TRIGGER update_spotify_recommendations_updated_at BEFORE UPDATE ON public.spotify_recommendations FOR EACH ROW EXECUTE FUNCTION public.update_spotify_recommendations_updated_at();

CREATE TRIGGER workflow_version_increment BEFORE UPDATE ON public.workflow_entity FOR EACH ROW EXECUTE FUNCTION public.increment_workflow_version();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON stripe._managed_webhooks FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_metadata();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON stripe._sync_obj_runs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_metadata();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON stripe._sync_runs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_metadata();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON stripe.accounts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON stripe.active_entitlements FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON stripe.charges FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON stripe.checkout_session_line_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON stripe.checkout_sessions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON stripe.coupons FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON stripe.customers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON stripe.disputes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON stripe.early_fraud_warnings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON stripe.events FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON stripe.exchange_rates_from_usd FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON stripe.features FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON stripe.invoices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON stripe.payouts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON stripe.plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON stripe.prices FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON stripe.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON stripe.refunds FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON stripe.reviews FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON stripe.subscription_item_change_events_v2_beta FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON stripe.subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

drop policy "auth_delete_own_ai_generations" on "storage"."objects";

drop policy "auth_delete_own_avatars" on "storage"."objects";

drop policy "auth_delete_own_private_docs" on "storage"."objects";

drop policy "auth_delete_own_product_images" on "storage"."objects";

drop policy "auth_update_own_files" on "storage"."objects";

drop policy "auth_upload_ai_generations" on "storage"."objects";

drop policy "auth_upload_brand_assets" on "storage"."objects";

drop policy "auth_upload_private_documents" on "storage"."objects";

drop policy "auth_upload_product_images" on "storage"."objects";

drop policy "auth_upload_user_avatars" on "storage"."objects";

drop policy "private_read_own_documents" on "storage"."objects";

drop policy "public_read_ai_generations" on "storage"."objects";

drop policy "public_read_brand_assets" on "storage"."objects";

drop policy "public_read_product_images" on "storage"."objects";

drop policy "public_read_user_avatars" on "storage"."objects";


  create policy "Public buckets are accessible to everyone."
  on "storage"."buckets"
  as permissive
  for select
  to public
using ((public = true));



  create policy "Users can manage their own buckets."
  on "storage"."buckets"
  as permissive
  for all
  to public
using (((owner = auth.uid()) OR (name = ('user_'::text || replace((auth.uid())::text, '-'::text, '_'::text)))));



  create policy "Users can update their own buckets."
  on "storage"."buckets"
  as permissive
  for update
  to public
using (((owner = auth.uid()) OR (name = ('user_'::text || replace((auth.uid())::text, '-'::text, '_'::text)))));



  create policy "Users can view all buckets."
  on "storage"."buckets"
  as permissive
  for select
  to public
using (true);



  create policy "AI assets are accessible to everyone."
  on "storage"."objects"
  as permissive
  for select
  to anon, authenticated
using ((bucket_id = 'ai_assets'::text));



  create policy "Avatar images are publicly accessible."
  on "storage"."objects"
  as permissive
  for select
  to anon, authenticated
using ((bucket_id = 'avatars'::text));



  create policy "Everyone can upload to public bucket."
  on "storage"."objects"
  as permissive
  for insert
  to public
with check ((bucket_id = 'public'::text));



  create policy "Everyone can view public bucket objects."
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'public'::text));



  create policy "Public assets are accessible to everyone."
  on "storage"."objects"
  as permissive
  for select
  to anon, authenticated
using ((bucket_id = 'public_assets'::text));



  create policy "Users can delete their own avatar."
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = ( SELECT (auth.uid())::text AS uid))));



  create policy "Users can delete their own bucket objects."
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id ~~ 'user_%'::text) AND (bucket_id = ('user_'::text || replace((auth.uid())::text, '-'::text, '_'::text)))));



  create policy "Users can delete their own documents."
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'documents'::text) AND ((storage.foldername(name))[1] = ( SELECT (auth.uid())::text AS uid))));



  create policy "Users can update their own avatar."
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = ( SELECT (auth.uid())::text AS uid))));



  create policy "Users can update their own bucket objects."
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id ~~ 'user_%'::text) AND (bucket_id = ('user_'::text || replace((auth.uid())::text, '-'::text, '_'::text)))));



  create policy "Users can update their own documents."
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'documents'::text) AND ((storage.foldername(name))[1] = ( SELECT (auth.uid())::text AS uid))));



  create policy "Users can upload their own avatar."
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'avatars'::text) AND ((storage.foldername(name))[1] = ( SELECT (auth.uid())::text AS uid))));



  create policy "Users can upload their own documents."
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'documents'::text) AND ((storage.foldername(name))[1] = ( SELECT (auth.uid())::text AS uid))));



  create policy "Users can upload to their own bucket."
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id ~~ 'user_%'::text) AND (bucket_id = ('user_'::text || replace((auth.uid())::text, '-'::text, '_'::text)))));



  create policy "Users can view their own bucket objects."
  on "storage"."objects"
  as permissive
  for select
  to public
using (((bucket_id ~~ 'user_%'::text) AND (bucket_id = ('user_'::text || replace((auth.uid())::text, '-'::text, '_'::text)))));



  create policy "Users can view their own documents."
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'documents'::text) AND ((storage.foldername(name))[1] = ( SELECT (auth.uid())::text AS uid))));



  create policy "avatars_delete_owner"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'avatars'::text) AND (((storage.foldername(name))[1] = (auth.uid())::text) OR (name ~~ ((auth.uid())::text || '/%'::text)) OR (owner = auth.uid()))));



  create policy "avatars_insert_owner"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'avatars'::text) AND (((storage.foldername(name))[1] = (auth.uid())::text) OR (name ~~ ((auth.uid())::text || '/%'::text)))));



  create policy "avatars_select_public"
  on "storage"."objects"
  as permissive
  for select
  to anon, authenticated
using ((bucket_id = 'avatars'::text));



  create policy "avatars_update_owner"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'avatars'::text) AND (((storage.foldername(name))[1] = (auth.uid())::text) OR (name ~~ ((auth.uid())::text || '/%'::text)) OR (owner = auth.uid()))))
with check (((bucket_id = 'avatars'::text) AND (((storage.foldername(name))[1] = (auth.uid())::text) OR (name ~~ ((auth.uid())::text || '/%'::text)) OR (owner = auth.uid()))));



  create policy "images_delete_authenticated"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using ((bucket_id = 'images'::text));



  create policy "images_insert_authenticated"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'images'::text));



  create policy "images_select_public"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'images'::text));



  create policy "images_update_authenticated"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((bucket_id = 'images'::text));



  create policy "songs_delete_authenticated"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using ((bucket_id = 'songs'::text));



  create policy "songs_insert_authenticated"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check ((bucket_id = 'songs'::text));



  create policy "songs_select_public"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'songs'::text));



  create policy "songs_update_authenticated"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using ((bucket_id = 'songs'::text));



