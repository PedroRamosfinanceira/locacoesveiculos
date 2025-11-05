/**
 * Hook para buscar evolução temporal (dados históricos)
 * Usa a view materializada: locacoes_veicular_v_evolucao_temporal
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EvolutionData {
  tenant_id: string | null;
  month_date: string | null; // '2024-11-01'
  total_veiculos: number | null;
  novos_veiculos: number | null;
  taxa_ocupacao_pct: number | null; // Percentual (0-100)
  contratos_ativos: number | null;
  receitas: number | null;
  despesas: number | null;
  lucro: number | null;
}

export function useEvolution(tenantId: string | null, months: number = 12) {
  return useQuery({
    queryKey: ['evolucao-temporal', tenantId, months],
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID is required');

      const { data, error } = await supabase
        .from('locacoes_veicular_v_evolucao_temporal')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('month_date', { ascending: true })
        .limit(months);

      if (error) throw error;
      return (data || []) as EvolutionData[];
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000, // Cache de 5 minutos
  });
}
