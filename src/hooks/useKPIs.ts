/**
 * Hook para buscar KPIs mensais do dashboard
 * Usa a view materializada: locacoes_veicular_v_kpis_mensais
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MonthlyKPIs {
  tenant_id: string | null;
  veiculos_disponiveis: number | null;
  veiculos_alugados: number | null;
  receitas_pagas: number | null;
  receitas_pendentes: number | null;
  despesas_pagas: number | null;
  despesas_pendentes: number | null;
  lucro_liquido_pagos: number | null;
}

export function useKPIs(tenantId: string | null) {
  return useQuery({
    queryKey: ['kpis-mensais', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID is required');

      const { data, error } = await supabase
        .from('locacoes_veicular_v_kpis_mensais')
        .select('*')
        .eq('tenant_id', tenantId)
        .limit(1); // Apenas os dados atuais

      if (error) throw error;
      return (data || []) as MonthlyKPIs[];
    },
    enabled: !!tenantId,
    staleTime: 60 * 1000, // Cache de 1 minuto
  });
}

/**
 * Hook para buscar KPIs do mês atual
 */
export function useCurrentMonthKPIs(tenantId: string | null) {
  return useQuery({
    queryKey: ['kpis-current-month', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID is required');

      const { data, error } = await supabase
        .from('locacoes_veicular_v_kpis_mensais')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (error) throw error;
      return data as MonthlyKPIs | null;
    },
    enabled: !!tenantId,
    staleTime: 30 * 1000, // Cache de 30 segundos
  });
}
