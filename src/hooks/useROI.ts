/**
 * Hook para buscar dados de ROI da frota
 * Usa a view materializada: locacoes_veicular_v_roi_frota
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ROIData {
  tenant_id: string | null;
  vehicle_id: string | null;
  brand: string | null;
  model: string | null;
  plate: string | null;
  status: string | null;
  investimento_inicial: number | null;
  receitas_mes: number | null;
  despesas_mes: number | null;
  lucro_mensal: number | null;
  payback_meses: number | null;
}

export function useROI(tenantId: string | null) {
  return useQuery({
    queryKey: ['roi-frota', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID is required');

      const { data, error } = await supabase
        .from('locacoes_veicular_v_roi_frota')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('monthly_profit', { ascending: false });

      if (error) throw error;
      return (data || []) as ROIData[];
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000, // Cache de 5 minutos
  });
}

/**
 * Hook para buscar ROI de um veículo específico
 */
export function useVehicleROI(vehicleId: string | undefined, tenantId: string | null) {
  return useQuery({
    queryKey: ['vehicle-roi', vehicleId, tenantId],
    queryFn: async () => {
      if (!vehicleId || !tenantId) throw new Error('Vehicle ID and Tenant ID are required');

      const { data, error } = await supabase
        .from('locacoes_veicular_v_roi_frota')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (error) throw error;
      return data as ROIData | null;
    },
    enabled: !!vehicleId && !!tenantId,
    staleTime: 5 * 60 * 1000,
  });
}
