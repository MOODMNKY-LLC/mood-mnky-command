alter table "n8n"."binary_data" drop constraint "CHK_binary_data_sourceType";

alter table "n8n"."workflow_publish_history" drop constraint "CHK_workflow_publish_history_event";

alter table "public"."binary_data" drop constraint "CHK_binary_data_sourceType";

alter table "public"."execution_entity" drop constraint "execution_entity_storedAt_check";

alter table "public"."workflow_publish_history" drop constraint "CHK_workflow_publish_history_event";

alter table "n8n"."binary_data" add constraint "CHK_binary_data_sourceType" CHECK ((("sourceType")::text = ANY ((ARRAY['execution'::character varying, 'chat_message_attachment'::character varying])::text[]))) not valid;

alter table "n8n"."binary_data" validate constraint "CHK_binary_data_sourceType";

alter table "n8n"."workflow_publish_history" add constraint "CHK_workflow_publish_history_event" CHECK (((event)::text = ANY ((ARRAY['activated'::character varying, 'deactivated'::character varying])::text[]))) not valid;

alter table "n8n"."workflow_publish_history" validate constraint "CHK_workflow_publish_history_event";

alter table "public"."binary_data" add constraint "CHK_binary_data_sourceType" CHECK ((("sourceType")::text = ANY ((ARRAY['execution'::character varying, 'chat_message_attachment'::character varying])::text[]))) not valid;

alter table "public"."binary_data" validate constraint "CHK_binary_data_sourceType";

alter table "public"."execution_entity" add constraint "execution_entity_storedAt_check" CHECK ((("storedAt")::text = ANY ((ARRAY['db'::character varying, 'fs'::character varying, 's3'::character varying])::text[]))) not valid;

alter table "public"."execution_entity" validate constraint "execution_entity_storedAt_check";

alter table "public"."workflow_publish_history" add constraint "CHK_workflow_publish_history_event" CHECK (((event)::text = ANY ((ARRAY['activated'::character varying, 'deactivated'::character varying])::text[]))) not valid;

alter table "public"."workflow_publish_history" validate constraint "CHK_workflow_publish_history_event";


