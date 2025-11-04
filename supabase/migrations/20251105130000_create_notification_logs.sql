-- Migration to add notification logs table
create table if not exists locacoes_veicular_notification_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  client_id uuid,
  contract_id uuid,
  channel text not null,
  provider text not null,
  template_key text,
  recipient text not null,
  message text not null,
  status text not null default 'pending',
  error_message text,
  sent_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_locacoes_veicular_notification_logs_tenant on locacoes_veicular_notification_logs (tenant_id);
create index if not exists idx_locacoes_veicular_notification_logs_status on locacoes_veicular_notification_logs (status);
create index if not exists idx_locacoes_veicular_notification_logs_client on locacoes_veicular_notification_logs (client_id);
