/**
 * Tipos para sistema de cobrança multi-canal e integrações
 */

export type IntegrationProvider = 'whatsapp' | 'twilio' | 'sendgrid' | 'asaas';

export type NotificationChannel = 'whatsapp' | 'sms' | 'email';

export interface IntegrationConfig {
  id: string;
  tenant_id: string;
  provider: IntegrationProvider;
  name?: string;
  config: Record<string, unknown>;
  api_key_encrypted?: string;
  api_key_iv?: string;
  api_key_preview?: string;
  is_active: boolean;
  last_tested_at?: string;
  created_at: string;
  updated_at: string;
}

export interface IntegrationTemplate {
  id: string;
  tenant_id: string;
  channel: NotificationChannel;
  template_key: string;
  subject?: string;
  body: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationLog {
  id: string;
  tenant_id: string;
  client_id?: string;
  contract_id?: string;
  channel: NotificationChannel;
  provider: IntegrationProvider;
  template_key?: string;
  recipient: string;
  message: string;
  status: 'pending' | 'sent' | 'failed' | 'delivered';
  error_message?: string;
  sent_at?: string;
  delivered_at?: string;
  created_at: string;
}

export interface BillingReminderConfig {
  tenant_id: string;
  enable_auto_reminders: boolean;
  days_before: number[];
  days_after: number[];
  preferred_channels: NotificationChannel[];
  quiet_hours_start?: string;
  quiet_hours_end?: string;
}
