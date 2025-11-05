/**
 * Hook para buscar veículos disponíveis
 * Usa a view materializada: locacoes_veicular_v_veiculos_disponiveis
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface VehicleAvailable {
  id: string;
  plate: string | null;
  brand: string | null;
  model: string | null;
  year: number | null;
  category: string | null;
  valor_aquisicao_sem_encargos: number | null;
  status: string | null;
}

export function useVehiclesAvailable(tenantId: string | null) {
  return useQuery({
    queryKey: ['vehicles-available', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID is required');

      const { data, error } = await supabase
        .from('locacoes_veicular_v_veiculos_disponiveis')
        .select('*')
        .eq('tenant_id', tenantId);

      if (error) throw error;
      return (data || []) as VehicleAvailable[];
    },
    enabled: !!tenantId,
    staleTime: 60 * 1000, // Cache de 1 minuto
  });
}

/**
 * Hook para buscar veículos alugados
 * Usa a view materializada: locacoes_veicular_v_veiculos_alugados
 */
export function useVehiclesRented(tenantId: string | null) {
  return useQuery({
    queryKey: ['vehicles-rented', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID is required');

      const { data, error } = await supabase
        .from('locacoes_veicular_v_veiculos_alugados')
        .select('*')
        .eq('tenant_id', tenantId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
    staleTime: 60 * 1000,
  });
}

/**
 * Hook para buscar veículos em manutenção
 * Usa a view materializada: locacoes_veicular_v_veiculos_manutencao
 */
export function useVehiclesMaintenance(tenantId: string | null) {
  return useQuery({
    queryKey: ['vehicles-maintenance', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID is required');

      const { data, error } = await supabase
        .from('locacoes_veicular_v_veiculos_manutencao')
        .select('*')
        .eq('tenant_id', tenantId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!tenantId,
    staleTime: 60 * 1000,
  });
}
