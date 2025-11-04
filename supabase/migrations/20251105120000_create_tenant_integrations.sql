-- Create table to store per-tenant integration settings and encrypted API keys
-- Note: This migration creates a simple encrypted storage holder. The actual encryption/decryption
-- is performed in server-side edge functions using a server-side encryption key (ENV var).

create extension if not exists pgcrypto;

create table if not exists locacoes_veicular_integrations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  provider text not null,
  name text,
  config jsonb default '{}'::jsonb,
  api_key_encrypted text, -- base64 encoded ciphertext (server-side encrypted)
  api_key_iv text, -- base64 encoded iv used for encryption
  api_key_preview text, -- masked preview (e.g. ****abcd)
  is_active boolean default true,
  last_tested_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_locacoes_veicular_integrations_tenant on locacoes_veicular_integrations (tenant_id);

-- Templates for message/email content per-tenant per-channel
create table if not exists locacoes_veicular_integration_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  channel text not null, -- e.g. whatsapp, sms, email
  template_key text not null,
  subject text,
  body text,
  variables jsonb default '[]'::jsonb,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_locacoes_veicular_templates_tenant on locacoes_veicular_integration_templates (tenant_id);

-- Simple trigger to update updated_at
create or replace function locacoes_veicular_update_timestamp() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_update_integrations_updated_at before update on locacoes_veicular_integrations
for each row execute procedure locacoes_veicular_update_timestamp();

create trigger trg_update_templates_updated_at before update on locacoes_veicular_integration_templates
for each row execute procedure locacoes_veicular_update_timestamp();
