/**
 * Types for AI-based payment prediction and risk scoring
 */

export interface PaymentHistory {
  client_id: string;
  client_name: string;
  total_transactions: number;
  paid_on_time: number;
  paid_late: number;
  never_paid: number;
  average_delay_days: number;
  total_amount: number;
  last_payment_date: string | null;
}

export interface RiskScore {
  client_id: string;
  client_name: string;
  score: number; // 0-1000
  risk_level: string;
  probability_of_default: number; // 0-100%
  predicted_delay_days: number;
  contributing_factors: RiskFactor[];
  last_updated: string;
}

export interface RiskFactor {
  factor: string;
  weight?: number; // 0-1
  impact: string;
  description?: string;
  value?: string;
}

export interface PaymentPrediction {
  transaction_id?: string;
  contract_id?: string;
  client_id: string;
  client_name: string;
  vehicle_plate?: string;
  due_date: string;
  amount: number;
  predicted_payment_date: string;
  predicted_delay_days?: number;
  probability_of_delay?: number;
  confidence?: number; // 0-100%
  risk_score?: number;
  risk_level?: string;
  recommended_action?: string;
  recommended_actions?: string[];
}

export interface AlertConfig {
  enabled: boolean;
  risk_threshold: number; // score below this triggers alert
  days_before_due: number;
  notification_channels: ('email' | 'whatsapp' | 'sms')[];
}

export interface PredictionModel {
  version: string;
  accuracy: number;
  last_trained: string;
  features_used: string[];
  total_predictions: number;
  correct_predictions: number;
}
