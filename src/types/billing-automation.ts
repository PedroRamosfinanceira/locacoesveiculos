/**
 * Types for Multi-Channel Automated Billing System
 */

export type NotificationChannel = 'whatsapp' | 'email' | 'sms';
export type NotificationTiming = 'D-7' | 'D-5' | 'D-3' | 'D-1' | 'D0' | 'D+1' | 'D+3' | 'D+7' | 'D+15';
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'delivered' | 'read';

export interface BillingNotificationConfig {
  id: string;
  tenant_id: string;
  channel: NotificationChannel;
  timing: NotificationTiming;
  enabled: boolean;
  template_id: string;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface MessageTemplate {
  id: string;
  tenant_id: string;
  name: string;
  channel: NotificationChannel;
  timing: NotificationTiming;
  subject?: string; // For email
  content: string;
  variables: string[]; // e.g., ['client_name', 'amount', 'due_date']
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationLog {
  id: string;
  tenant_id: string;
  transaction_id: string;
  client_id: string;
  channel: NotificationChannel;
  timing: NotificationTiming;
  status: NotificationStatus;
  template_used: string;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  error_message?: string;
  metadata: Record<string, unknown>;
}

export interface BillingAutomationStats {
  total_sent: number;
  total_delivered: number;
  total_failed: number;
  delivery_rate: number;
  by_channel: {
    whatsapp: { sent: number; delivered: number; failed: number };
    email: { sent: number; delivered: number; failed: number };
    sms: { sent: number; delivered: number; failed: number };
  };
  by_timing: Record<NotificationTiming, { sent: number; delivered: number }>;
}

export interface ChannelConfig {
  channel: NotificationChannel;
  enabled: boolean;
  provider?: string; // 'twilio', 'sendgrid', etc.
  credentials?: {
    api_key?: string;
    account_sid?: string;
    auth_token?: string;
    from_number?: string;
    from_email?: string;
  };
}

export interface ScheduledNotification {
  transaction_id: string;
  client_id: string;
  client_name: string;
  client_phone?: string;
  client_email?: string;
  amount: number;
  due_date: string;
  days_until_due: number;
  recommended_channels: NotificationChannel[];
  recommended_timing: NotificationTiming;
  template_suggestions: MessageTemplate[];
}

export interface BillingReminderRequest {
  transaction_id: string;
  channel: NotificationChannel;
  template_id?: string;
  custom_message?: string;
  send_immediately?: boolean;
  schedule_for?: string;
}

export interface BillingReminderResponse {
  success: boolean;
  notification_id: string;
  status: NotificationStatus;
  sent_at?: string;
  error?: string;
}

// Default templates
export const DEFAULT_TEMPLATES: Record<NotificationChannel, Record<NotificationTiming, string>> = {
  whatsapp: {
    'D-7': 'Olá {{client_name}}! 👋\n\nLembramos que o aluguel do veículo {{vehicle}} vence em 7 dias ({{due_date}}).\n\nValor: {{amount}}\n\nPague antecipadamente e evite juros! 💳\n\n{{payment_link}}',
    'D-5': 'Oi {{client_name}}! ⏰\n\nFaltam 5 dias para o vencimento do seu aluguel:\n\n📅 Vencimento: {{due_date}}\n💰 Valor: {{amount}}\n\n{{payment_link}}',
    'D-3': '⚠️ {{client_name}}, seu aluguel vence em 3 dias!\n\n💳 Valor: {{amount}}\n📅 Vencimento: {{due_date}}\n\nPague agora: {{payment_link}}',
    'D-1': '🚨 ATENÇÃO {{client_name}}!\n\nSeu aluguel vence AMANHÃ!\n\n💰 {{amount}}\n📅 {{due_date}}\n\nEvite juros, pague hoje:\n{{payment_link}}',
    'D0': '⏰ VENCE HOJE! {{client_name}}\n\nO aluguel vence HOJE às 23:59!\n\n💳 {{amount}}\n\nPague agora para evitar multa:\n{{payment_link}}',
    'D+1': '❌ VENCIDO! {{client_name}}\n\nSeu aluguel venceu ontem.\n\n💰 Valor: {{amount}} + juros\n\nRegularize agora:\n{{payment_link}}',
    'D+3': '🔴 URGENTE {{client_name}}!\n\n3 dias de atraso!\n\n💰 {{amount}} + multa de {{late_fee}}\n\nPague hoje:\n{{payment_link}}',
    'D+7': '⚠️ COBRANÇA FINAL {{client_name}}\n\n7 dias de atraso!\n\n💰 Total: {{total_with_fees}}\n\nEntre em contato URGENTE:\n{{company_phone}}',
    'D+15': '🚨 COBRANÇA JUDICIAL {{client_name}}\n\n15 dias de atraso.\n\nÚltima chance antes de ação judicial.\n\nContate-nos: {{company_phone}}',
  },
  email: {
    'D-7': 'Lembrete: Seu aluguel vence em 7 dias',
    'D-5': 'Atenção: Seu aluguel vence em 5 dias',
    'D-3': 'Importante: Seu aluguel vence em 3 dias',
    'D-1': 'Urgente: Seu aluguel vence amanhã',
    'D0': 'Último dia: Seu aluguel vence hoje',
    'D+1': 'Aluguel vencido - Regularize agora',
    'D+3': 'Cobrança: 3 dias de atraso',
    'D+7': 'Cobrança urgente: 7 dias de atraso',
    'D+15': 'Última notificação antes de ação judicial',
  },
  sms: {
    'D-7': '{{client_name}}, aluguel vence em 7 dias. Valor: {{amount}}. Pague: {{short_link}}',
    'D-5': 'Lembrete: Aluguel vence em 5 dias. {{amount}}. {{short_link}}',
    'D-3': 'ATENÇÃO: Aluguel vence em 3 dias! {{amount}}. {{short_link}}',
    'D-1': 'URGENTE: Aluguel vence AMANHÃ! {{amount}}. Pague: {{short_link}}',
    'D0': 'VENCE HOJE! {{amount}}. Evite multa: {{short_link}}',
    'D+1': 'VENCIDO! Regularize: {{amount}} + juros. {{short_link}}',
    'D+3': 'ATRASO 3 dias! {{total_with_fees}}. Pague: {{short_link}}',
    'D+7': 'URGENTE: 7 dias atraso! Contato: {{company_phone}}',
    'D+15': 'ÚLTIMO AVISO: Ação judicial em 48h. {{company_phone}}',
  },
};
