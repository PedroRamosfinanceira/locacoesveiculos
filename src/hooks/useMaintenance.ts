import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Maintenance {
  id: string;
  tenant_id: string;
  vehicle_id: string;
  type: 'preventiva' | 'corretiva' | 'inspecao' | 'recall';
  description: string;
  cost: number;
  scheduled_date: string;
  completed_at: string | null;
  status: 'agendada' | 'em_andamento' | 'concluida' | 'cancelada';
  notes: string | null;
  service_provider: string | null;
  odometer_reading: number | null;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceWithVehicle extends Maintenance {
  vehicle?: {
    id: string;
    brand: string;
    model: string;
    plate: string;
    year: number;
  };
}

// Query: Listar todas as manutenções
export const useMaintenances = () => {
  return useQuery({
    queryKey: ['maintenances'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locacoes_veicular_maintenances')
        .select(`
          *,
          vehicle:locacoes_veicular_vehicles(id, brand, model, plate, year)
        `)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      return data as MaintenanceWithVehicle[];
    },
  });
};

// Query: Manutenções agendadas (futuras)
export const useScheduledMaintenances = () => {
  return useQuery({
    queryKey: ['scheduledMaintenances'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('locacoes_veicular_maintenances')
        .select(`
          *,
          vehicle:locacoes_veicular_vehicles(id, brand, model, plate, year)
        `)
        .eq('status', 'agendada')
        .gte('scheduled_date', today)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      return data as MaintenanceWithVehicle[];
    },
  });
};

// Query: Manutenções atrasadas
export const useOverdueMaintenances = () => {
  return useQuery({
    queryKey: ['overdueMaintenances'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('locacoes_veicular_maintenances')
        .select(`
          *,
          vehicle:locacoes_veicular_vehicles(id, brand, model, plate, year)
        `)
        .eq('status', 'agendada')
        .lt('scheduled_date', today)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      return data as MaintenanceWithVehicle[];
    },
  });
};

// Query: Manutenções por veículo
export const useMaintenancesByVehicle = (vehicleId: string | null) => {
  return useQuery({
    queryKey: ['maintenances', 'vehicle', vehicleId],
    queryFn: async () => {
      if (!vehicleId) return [];

      const { data, error } = await supabase
        .from('locacoes_veicular_maintenances')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;
      return data as Maintenance[];
    },
    enabled: !!vehicleId,
  });
};

// Query: Histórico de custos de manutenção
export const useMaintenanceCosts = () => {
  return useQuery({
    queryKey: ['maintenanceCosts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locacoes_veicular_maintenances')
        .select('vehicle_id, cost, completed_at, type')
        .eq('status', 'concluida')
        .not('completed_at', 'is', null);

      if (error) throw error;
      return data;
    },
  });
};

// Mutation: Criar manutenção
export const useCreateMaintenance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (maintenance: Partial<Maintenance>) => {
      const { data, error } = await supabase
        .from('locacoes_veicular_maintenances')
        .insert([{
          ...maintenance,
          status: 'agendada',
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      queryClient.invalidateQueries({ queryKey: ['scheduledMaintenances'] });
      queryClient.invalidateQueries({ queryKey: ['overdueMaintenances'] });
      toast.success('Manutenção agendada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar manutenção:', error);
      toast.error('Erro ao agendar manutenção');
    },
  });
};

// Mutation: Atualizar manutenção
export const useUpdateMaintenance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Maintenance> & { id: string }) => {
      const { data, error } = await supabase
        .from('locacoes_veicular_maintenances')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      queryClient.invalidateQueries({ queryKey: ['scheduledMaintenances'] });
      queryClient.invalidateQueries({ queryKey: ['overdueMaintenances'] });
      toast.success('Manutenção atualizada!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar manutenção:', error);
      toast.error('Erro ao atualizar manutenção');
    },
  });
};

// Mutation: Concluir manutenção (cria despesa automaticamente)
export const useCompleteMaintenance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      actualCost, 
      odometer_reading 
    }: { 
      id: string; 
      actualCost?: number;
      odometer_reading?: number;
    }) => {
      // 1. Buscar a manutenção
      const { data: maintenance, error: fetchError } = await supabase
        .from('locacoes_veicular_maintenances')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // 2. Atualizar status da manutenção
      const { error: updateError } = await supabase
        .from('locacoes_veicular_maintenances')
        .update({
          status: 'concluida',
          completed_at: new Date().toISOString(),
          cost: actualCost || maintenance.cost,
          odometer_reading: odometer_reading || maintenance.odometer_reading,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // 3. Criar despesa
      const finalCost = actualCost || maintenance.cost;
      if (finalCost && finalCost > 0) {
        const { error: txError } = await supabase
          .from('locacoes_veicular_transactions')
          .insert([{
            type: 'expense',
            category: `Manutenção - ${maintenance.type}`,
            description: `Manutenção: ${maintenance.description}`,
            amount: finalCost,
            due_date: new Date().toISOString().split('T')[0],
            paid_date: new Date().toISOString().split('T')[0],
            status: 'paid',
            vehicle_id: maintenance.vehicle_id,
            notes: `Manutenção ID: ${id}`,
          }]);

        if (txError) throw txError;
      }

      return maintenance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      queryClient.invalidateQueries({ queryKey: ['scheduledMaintenances'] });
      queryClient.invalidateQueries({ queryKey: ['overdueMaintenances'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accountsPayable'] });
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      toast.success('Manutenção concluída e despesa registrada!');
    },
    onError: (error) => {
      console.error('Erro ao concluir manutenção:', error);
      toast.error('Erro ao concluir manutenção');
    },
  });
};

// Mutation: Cancelar manutenção
export const useCancelMaintenance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('locacoes_veicular_maintenances')
        .update({
          status: 'cancelada',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenances'] });
      queryClient.invalidateQueries({ queryKey: ['scheduledMaintenances'] });
      queryClient.invalidateQueries({ queryKey: ['overdueMaintenances'] });
      toast.success('Manutenção cancelada!');
    },
    onError: (error) => {
      console.error('Erro ao cancelar manutenção:', error);
      toast.error('Erro ao cancelar manutenção');
    },
  });
};
