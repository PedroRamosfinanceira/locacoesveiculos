/**
 * Hook para buscar alertas do sistema
 * Tabela: locacoes_veicular_alerts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Alert {
  id: string;
  tenant_id: string;
  type: string; // 'payment_overdue', 'maintenance_due', 'contract_expiring', etc.
  severity: string; // 'info', 'warn', 'error'
  title: string;
  message: string;
  reference_table: string | null;
  reference_id: string | null;
  action_url: string | null;
  is_read: boolean;
  read_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export function useAlerts(tenantId: string | null) {
  return useQuery({
    queryKey: ['alerts', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID is required');

      const { data, error } = await supabase
        .from('locacoes_veicular_alerts')
        .select('*')
        .eq('tenant_id', tenantId)
        .or('expires_at.is.null,expires_at.gt.now()') // Não expirados
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Alert[];
    },
    enabled: !!tenantId,
    staleTime: 30 * 1000, // Cache de 30 segundos
  });
}

/**
 * Hook para buscar apenas alertas não lidos
 */
export function useUnreadAlerts(tenantId: string | null) {
  const { data: alerts, ...rest } = useAlerts(tenantId);
  const unreadAlerts = alerts?.filter((a) => !a.is_read) || [];

  return {
    ...rest,
    data: unreadAlerts,
    count: unreadAlerts.length,
  };
}

/**
 * Hook para marcar alerta como lido
 */
export function useMarkAlertAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('locacoes_veicular_alerts')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
    onError: (error: Error) => {
      toast.error('Erro ao marcar alerta como lido: ' + error.message);
    },
  });
}

/**
 * Hook para marcar todos os alertas como lidos
 */
export function useMarkAllAlertsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tenantId: string) => {
      const { error } = await supabase
        .from('locacoes_veicular_alerts')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('tenant_id', tenantId)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success('Todos os alertas marcados como lidos');
    },
    onError: (error: Error) => {
      toast.error('Erro ao marcar alertas: ' + error.message);
    },
  });
}
