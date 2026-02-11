-- Add orientation fields to tools table
alter table tools
add column orientation_text text,
add column orientation_files jsonb default '[]'::jsonb;
