/**
 * Type declarations for AI Prediction Service
 */
declare module '@/lib/aiPredictionService' {
  export interface RiskScore {
    client_id: string;
    risk_score: number;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    last_calculated_at: string;
  }

  export interface PaymentPrediction {
    id: string;
    client_id: string;
    contract_id: string;
    predicted_payment_date: string;
    delay_probability: number;
    amount: number;
  }

  export interface PaymentHistory {
    payment_date: string;
    amount: number;
    days_late: number;
  }

  export default class AIPaymentPredictionService {
    static getRiskScore(clientId: string): Promise<RiskScore | null>;
    static getPredictions(clientId: string): Promise<PaymentPrediction[]>;
    static getPaymentHistory(clientId: string): Promise<PaymentHistory[]>;
    static calculateDelayProbability(clientId: string): Promise<number>;
    static getPredictionStats(tenantId: string): Promise<{
      total_predictions: number;
      high_risk_count: number;
      total_clients_analyzed: number;
    }>;
  }
}
