/**
 * AI Payment Prediction Service
 * Handles risk scoring, payment predictions, and intelligent alerts
 * Note: Requires database migration 20251104050000_ai_payment_predictions.sql to be run
 */

import { supabase } from '@/integrations/supabase/client';
import type { RiskScore, PaymentPrediction, PaymentHistory } from '@/types/ai-predictions';

// Type-safe helper for querying views not yet in generated types
async function queryView<T>(viewName: string): Promise<{ data: T[] | null; error: unknown }> {
  try {
    // Cast to unknown then to valid table name to bypass type checking
    const { data, error } = await supabase.from(viewName as unknown as 'locacoes_veicular_tenants').select('*');
    return { data: data as T[] | null, error };
  } catch (error) {
    return { data: null, error };
  }
}

// Type-safe helper for RPC calls not yet in generated types
async function callRpc<T>(fnName: string, params: Record<string, unknown>): Promise<{ data: T | null; error: unknown }> {
  try {
    // @ts-expect-error - RPC function not yet in generated types
    const { data, error } = await supabase.rpc(fnName, params);
    return { data: data as T | null, error };
  } catch (error) {
    return { data: null, error };
  }
}

export class AIPaymentPredictionService {
  /**
   * Get payment history for a specific client
   */
  static async getClientPaymentHistory(clientId: string): Promise<PaymentHistory | null> {
    const { data, error } = await queryView<PaymentHistory>('locacoes_veicular_v_payment_history');
    
    if (error) {
      console.error('Error fetching payment history:', error);
      return null;
    }

    const filtered = data?.find((item) => item.client_id === clientId);
    return filtered || null;
  }

  /**
   * Get risk score for a specific client
   */
  static async getClientRiskScore(clientId: string): Promise<RiskScore | null> {
    const { data, error } = await queryView<Record<string, unknown>>('locacoes_veicular_v_client_risk_score');
    
    if (error) {
      console.error('Error fetching risk score:', error);
      return null;
    }

    const clientData = data?.find((item) => item.client_id === clientId);
    if (!clientData) return null;

    // Get risk factors
    const { data: factors } = await callRpc<Array<Record<string, unknown>>>(
      'locacoes_veicular_get_risk_factors',
      { p_client_id: clientId }
    );

    return {
      client_id: clientData.client_id as string,
      client_name: clientData.client_name as string,
      score: clientData.risk_score as number,
      risk_level: clientData.risk_level as string,
      probability_of_default: clientData.probability_of_default_percent as number,
      predicted_delay_days: clientData.predicted_delay_days as number,
      contributing_factors: (factors || []).map((f) => ({
        factor: f.factor as string,
        impact: f.impact as string,
        value: f.value as string,
      })),
      last_updated: clientData.last_updated as string,
    };
  }

  /**
   * Get all clients with their risk scores
   */
  static async getAllClientRiskScores(tenantId: string): Promise<RiskScore[]> {
    const { data, error } = await queryView<Record<string, unknown>>('locacoes_veicular_v_client_risk_score');
    
    if (error) {
      console.error('Error fetching risk scores:', error);
      return [];
    }

    return (data || [])
      .filter((item) => item.tenant_id === tenantId)
      .map((item) => ({
        client_id: item.client_id as string,
        client_name: item.client_name as string,
        score: item.risk_score as number,
        risk_level: item.risk_level as string,
        probability_of_default: item.probability_of_default_percent as number,
        predicted_delay_days: item.predicted_delay_days as number,
        contributing_factors: [],
        last_updated: item.last_updated as string,
      }));
  }

  /**
   * Get high-risk clients (score >= 700)
   */
  static async getHighRiskClients(tenantId: string): Promise<RiskScore[]> {
    const allScores = await this.getAllClientRiskScores(tenantId);
    return allScores.filter((score) => score.score >= 700);
  }

  /**
   * Get payment predictions for upcoming payments
   */
  static async getUpcomingPaymentPredictions(tenantId: string): Promise<PaymentPrediction[]> {
    const { data, error } = await queryView<Record<string, unknown>>('locacoes_veicular_v_payment_predictions');
    
    if (error) {
      console.error('Error fetching payment predictions:', error);
      return [];
    }

    return (data || [])
      .filter((item) => item.tenant_id === tenantId)
      .map((item) => ({
        contract_id: item.contract_id as string,
        client_id: item.client_id as string,
        client_name: item.client_name as string,
        vehicle_plate: item.vehicle_plate as string,
        due_date: item.due_date as string,
        amount: item.amount as number,
        predicted_payment_date: item.predicted_payment_date as string,
        predicted_delay_days: item.predicted_delay_days as number,
        probability_of_delay: item.probability_of_delay as number,
        risk_level: item.risk_level as string,
        recommended_action: item.recommended_action as string,
      }));
  }

  /**
   * Get late payment predictions (likely to be late)
   */
  static async getLatePaymentPredictions(tenantId: string): Promise<PaymentPrediction[]> {
    const allPredictions = await this.getUpcomingPaymentPredictions(tenantId);
    return allPredictions.filter((pred) => pred.probability_of_delay > 50);
  }

  /**
   * Get critical alerts (high risk and high delay probability)
   */
  static async getCriticalAlerts(tenantId: string): Promise<PaymentPrediction[]> {
    const allPredictions = await this.getUpcomingPaymentPredictions(tenantId);
    return allPredictions.filter(
      (pred) => pred.risk_level === 'alto' && pred.probability_of_delay > 70
    );
  }

  /**
   * Get predictions for specific date range
   */
  static async getPredictionsByDateRange(
    tenantId: string,
    startDate: string,
    endDate: string
  ): Promise<PaymentPrediction[]> {
    const allPredictions = await this.getUpcomingPaymentPredictions(tenantId);
    return allPredictions.filter((pred) => {
      const dueDate = new Date(pred.due_date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return dueDate >= start && dueDate <= end;
    });
  }

  /**
   * Calculate aggregate statistics
   */
  static async getStatistics(tenantId: string) {
    const [allScores, allPredictions] = await Promise.all([
      this.getAllClientRiskScores(tenantId),
      this.getUpcomingPaymentPredictions(tenantId),
    ]);

    const highRisk = allScores.filter((s) => s.score >= 700).length;
    const mediumRisk = allScores.filter((s) => s.score >= 400 && s.score < 700).length;
    const lowRisk = allScores.filter((s) => s.score < 400).length;

    const likelyLate = allPredictions.filter((p) => p.probability_of_delay > 50).length;
    const critical = allPredictions.filter(
      (p) => p.risk_level === 'alto' && p.probability_of_delay > 70
    ).length;

    const avgRisk = allScores.length > 0
      ? allScores.reduce((sum, s) => sum + s.score, 0) / allScores.length
      : 0;

    return {
      totalClients: allScores.length,
      highRiskCount: highRisk,
      mediumRiskCount: mediumRisk,
      lowRiskCount: lowRisk,
      averageRiskScore: Math.round(avgRisk),
      upcomingPayments: allPredictions.length,
      likelyLateCount: likelyLate,
      criticalAlertsCount: critical,
    };
  }

  /**
   * Get emoji for risk level
   */
  static getRiskEmoji(riskLevel: string): string {
    const levelMap: Record<string, string> = {
      baixo: '🟢',
      medio: '🟡',
      médio: '🟡',
      alto: '🔴',
      critico: '⚠️',
      crítico: '⚠️',
    };
    return levelMap[riskLevel.toLowerCase()] || '⚪';
  }

  /**
   * Get badge color class for risk level
   */
  static getRiskBadgeColor(riskLevel: string): string {
    const levelMap: Record<string, string> = {
      baixo: 'bg-green-100 text-green-800',
      medio: 'bg-yellow-100 text-yellow-800',
      médio: 'bg-yellow-100 text-yellow-800',
      alto: 'bg-red-100 text-red-800',
      critico: 'bg-purple-100 text-purple-800',
      crítico: 'bg-purple-100 text-purple-800',
    };
    return levelMap[riskLevel.toLowerCase()] || 'bg-gray-100 text-gray-800';
  }
}

export default AIPaymentPredictionService;
