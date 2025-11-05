import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Vehicle {
  id: string;
  tenant_id: string;
  brand: string;
  model: string;
  plate: string;
  year: number;
  color: string;
  category: string;
  status: string;
  valor_aquisicao_sem_encargos: number;
  valor_aquisicao_com_encargos?: number;
  chassis?: string;
  renavam?: string;
  km_inicial?: number;
  km_atual?: number;
  data_aquisicao?: string;
  observacoes?: string;
  created_at: string;
  updated_at?: string;
}

export interface VehicleFormData {
  brand: string;
  model: string;
  plate: string;
  year: number;
  color: string;
  category: string;
  status: string;
  valor_aquisicao_sem_encargos: number;
  valor_aquisicao_com_encargos?: number;
  chassis?: string;
  renavam?: string;
  km_inicial?: number;
  km_atual?: number;
  data_aquisicao?: string;
  observacoes?: string;
}

export const useVehicles = (sortBy: string = 'created_at_desc') => {
  const { tenantId } = useAuth();

  return useQuery({
    queryKey: ['vehicles', tenantId, sortBy],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant ID');

      const [field, direction] = sortBy.split('_');
      const isAsc = direction === 'asc';

      const { data, error } = await supabase
        .from('locacoes_veicular_vehicles')
        .select('*')
        .eq('tenant_id', tenantId)
        .order(field, { ascending: isAsc });

      if (error) throw error;
      return data as Vehicle[];
    },
    enabled: !!tenantId,
  });
};

export const useVehicle = (vehicleId: string | undefined) => {
  const { tenantId } = useAuth();

  return useQuery({
    queryKey: ['vehicle', vehicleId, tenantId],
    queryFn: async () => {
      if (!vehicleId || !tenantId) throw new Error('Missing required parameters');

      const { data, error } = await supabase
        .from('locacoes_veicular_vehicles')
        .select('*')
        .eq('id', vehicleId)
        .eq('tenant_id', tenantId)
        .single();

      if (error) throw error;
      return data as Vehicle;
    },
    enabled: !!vehicleId && !!tenantId,
  });
};

export const useCreateVehicle = () => {
  const { tenantId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: VehicleFormData) => {
      if (!tenantId) throw new Error('No tenant ID');

      const { data: vehicle, error } = await supabase
        .from('locacoes_veicular_vehicles')
        .insert([{ ...data, tenant_id: tenantId }])
        .select()
        .single();

      if (error) throw error;
      return vehicle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Veículo cadastrado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error creating vehicle:', error);
      toast.error('Erro ao cadastrar veículo', {
        description: error.message,
      });
    },
  });
};

export const useUpdateVehicle = () => {
  const { tenantId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<VehicleFormData> }) => {
      if (!tenantId) throw new Error('No tenant ID');

      const { data: vehicle, error } = await supabase
        .from('locacoes_veicular_vehicles')
        .update(data)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) throw error;
      return vehicle;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', variables.id] });
      toast.success('Veículo atualizado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error updating vehicle:', error);
      toast.error('Erro ao atualizar veículo', {
        description: error.message,
      });
    },
  });
};

export const useDeleteVehicle = () => {
  const { tenantId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!tenantId) throw new Error('No tenant ID');

      const { error } = await supabase
        .from('locacoes_veicular_vehicles')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Veículo excluído com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error deleting vehicle:', error);
      toast.error('Erro ao excluir veículo', {
        description: error.message,
      });
    },
  });
};

export const useVehiclesByStatus = (status?: string) => {
  const { tenantId } = useAuth();

  return useQuery({
    queryKey: ['vehicles-by-status', tenantId, status],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant ID');

      let query = supabase
        .from('locacoes_veicular_vehicles')
        .select('*')
        .eq('tenant_id', tenantId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as Vehicle[];
    },
    enabled: !!tenantId,
  });
};

export const useVehicleContracts = (vehicleId: string | undefined) => {
  const { tenantId } = useAuth();

  return useQuery({
    queryKey: ['vehicle-contracts', vehicleId, tenantId],
    queryFn: async () => {
      if (!vehicleId || !tenantId) throw new Error('Missing required parameters');

      const { data, error } = await supabase
        .from('locacoes_veicular_contracts')
        .select(`
          *,
          client:locacoes_veicular_clients(id, name, cpf_cnpj, phone, email)
        `)
        .eq('vehicle_id', vehicleId)
        .eq('tenant_id', tenantId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!vehicleId && !!tenantId,
  });
};

export const useVehicleMaintenances = (vehicleId: string | undefined) => {
  const { tenantId } = useAuth();

  return useQuery({
    queryKey: ['vehicle-maintenances', vehicleId, tenantId],
    queryFn: async () => {
      if (!vehicleId || !tenantId) throw new Error('Missing required parameters');

      const { data, error } = await supabase
        .from('locacoes_veicular_maintenances')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .eq('tenant_id', tenantId)
        .order('date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!vehicleId && !!tenantId,
  });
};

export const useVehicleExpenses = (vehicleId: string | undefined) => {
  const { tenantId } = useAuth();

  return useQuery({
    queryKey: ['vehicle-expenses', vehicleId, tenantId],
    queryFn: async () => {
      if (!vehicleId || !tenantId) throw new Error('Missing required parameters');

      const { data, error } = await supabase
        .from('locacoes_veicular_transactions')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .eq('tenant_id', tenantId)
        .eq('type', 'despesa')
        .order('due_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!vehicleId && !!tenantId,
  });
};
