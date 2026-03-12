select id, name, status, provider_form_id,
       (form_schema is not null) as has_form_schema,
       (form_schema::jsonb) #> '{}' as form_schema_preview
from funnel_definitions
where status = 'active'
limit 5;