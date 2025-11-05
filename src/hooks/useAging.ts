/**
 * Hook para buscar dados de inadimplência (Aging Report)
 * Usa a view materializada: locacoes_veicular_v_aging
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AgingData {
  tenant_id: string | null;
  client_id: string | null;
  client_name: string | null;
  client_phone: string | null;
  transaction_id: string | null;
  description: string | null;
  amount: number | null;
  due_date: string | null;
  status: string | null;
  days_overdue: number | null;
  aging_bucket: string | null; // '0-30', '31-60', '61-90', '>90'
  criticality: number | null; // 1-4
}

export function useAging(tenantId: string | null) {
  return useQuery({
    queryKey: ['aging-report', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID is required');

      const { data, error } = await supabase
        .from('locacoes_veicular_v_aging')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('days_overdue', { ascending: false });

      if (error) throw error;
      return (data || []) as AgingData[];
    },
    enabled: !!tenantId,
    staleTime: 2 * 60 * 1000, // Cache de 2 minutos
  });
}

/**
 * Hook para buscar totais por bucket
 */
export function useAgingTotals(tenantId: string | null) {
  const { data: agingData, ...rest } = useAging(tenantId);

  const totals = agingData?.reduce(
    (acc, item) => {
      const bucket = item.aging_bucket || '0-30';
      const amount = item.amount || 0;
      acc[bucket] = (acc[bucket] || 0) + amount;
      acc.total += amount;
      return acc;
    },
    {
      '0-30': 0,
      '31-60': 0,
      '61-90': 0,
      '>90': 0,
      total: 0,
    } as Record<string, number>
  );

  return {
    ...rest,
    data: agingData,
    totals,
  };
}
