import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useROI } from './useROI';
import { useEvolution } from './useEvolution';
import { useAging } from './useAging';

export interface PerformanceReport {
  vehicle_id: string;
  brand: string;
  model: string;
  plate: string;
  total_contracts: number;
  total_revenue: number;
  total_expenses: number;
  net_profit: number;
  occupancy_rate: number;
  days_in_service: number;
}

// Query: Relatório de performance da frota
export const usePerformanceReport = () => {
  return useQuery({
    queryKey: ['performanceReport'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_vehicle_performance_report');
      
      if (error) throw error;
      return data as PerformanceReport[];
    },
  });
};

// Query: DRE (Demonstração de Resultado) mensal
export const useDRE = (months: number = 12) => {
  const { data: evolution } = useEvolution();
  
  return {
    data: evolution?.map(e => ({
      month: new Date(e.month_date).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      receitas: e.receitas_pagas,
      despesas: e.despesas_pagas,
      lucro: e.lucro_liquido_pagos,
    })).slice(-months),
  };
};

// Query: Fluxo de caixa projetado
export const useCashFlowProjection = (days: number = 90) => {
  return useQuery({
    queryKey: ['cashFlowProjection', days],
    queryFn: async () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + days);

      const { data, error } = await supabase
        .from('locacoes_veicular_transactions')
        .select('due_date, type, amount, status')
        .gte('due_date', startDate.toISOString().split('T')[0])
        .lte('due_date', endDate.toISOString().split('T')[0])
        .order('due_date', { ascending: true });

      if (error) throw error;

      // Agrupar por data
      const grouped = data.reduce((acc: Record<string, { date: string; receitas: number; despesas: number }>, tx) => {
        const date = new Date(tx.due_date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
        if (!acc[date]) {
          acc[date] = { date, receitas: 0, despesas: 0 };
        }
        if (tx.type === 'income') {
          acc[date].receitas += tx.amount;
        } else {
          acc[date].despesas += tx.amount;
        }
        return acc;
      }, {});

      // Calcular saldo acumulado
      let saldoAcumulado = 0;
      const result = Object.values(grouped).map(item => {
        saldoAcumulado += item.receitas - item.despesas;
        return {
          ...item,
          saldo: saldoAcumulado,
        };
      });

      return result;
    },
  });
};

// Hook consolidado para todos os relatórios
export const useReports = () => {
  const roi = useROI();
  const aging = useAging();
  const evolution = useEvolution();
  const performance = usePerformanceReport();
  const dre = useDRE();
  const cashFlow = useCashFlowProjection();

  return {
    roi,
    aging,
    evolution,
    performance,
    dre,
    cashFlow,
    isLoading: roi.isLoading || aging.isLoading || evolution.isLoading || performance.isLoading,
  };
};
