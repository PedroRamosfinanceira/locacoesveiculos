import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Client {
  id: string;
  tenant_id: string;
  name: string;
  document: string; // CPF ou CNPJ (nome da coluna no banco)
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  birth_date?: string;
  cnh?: string;
  cnh_expiry?: string;
  rg?: string;
  profession?: string;
  is_legal_entity?: boolean;
  company_name?: string;
  state_registration?: string;
  municipal_registration?: string;
  observacoes?: string;
  created_at: string;
  updated_at?: string;
}

export interface ClientFormData {
  name: string;
  cpf_cnpj: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  birth_date?: string;
  cnh?: string;
  cnh_expiry?: string;
  rg?: string;
  profession?: string;
  is_legal_entity?: boolean;
  company_name?: string;
  state_registration?: string;
  municipal_registration?: string;
  observacoes?: string;
}

export const useClients = (sortBy: string = 'created_at_desc') => {
  const { tenantId } = useAuth();

  return useQuery({
    queryKey: ['clients', tenantId, sortBy],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant ID');

      const [field, direction] = sortBy.split('_');
      const isAsc = direction === 'asc';

      const { data, error } = await supabase
        .from('locacoes_veicular_clients')
        .select('*')
        .eq('tenant_id', tenantId)
        .order(field, { ascending: isAsc });

      if (error) throw error;
      return data as Client[];
    },
    enabled: !!tenantId,
  });
};

export const useClient = (clientId: string | undefined) => {
  const { tenantId } = useAuth();

  return useQuery({
    queryKey: ['client', clientId, tenantId],
    queryFn: async () => {
      if (!clientId || !tenantId) throw new Error('Missing required parameters');

      const { data, error } = await supabase
        .from('locacoes_veicular_clients')
        .select('*')
        .eq('id', clientId)
        .eq('tenant_id', tenantId)
        .single();

      if (error) throw error;
      return data as Client;
    },
    enabled: !!clientId && !!tenantId,
  });
};

export const useCreateClient = () => {
  const { tenantId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ClientFormData) => {
      if (!tenantId) throw new Error('No tenant ID');

      const { data: client, error } = await supabase
        .from('locacoes_veicular_clients')
        .insert([{ ...data, tenant_id: tenantId }])
        .select()
        .single();

      if (error) throw error;
      return client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente cadastrado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error creating client:', error);
      toast.error('Erro ao cadastrar cliente', {
        description: error.message,
      });
    },
  });
};

export const useUpdateClient = () => {
  const { tenantId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ClientFormData> }) => {
      if (!tenantId) throw new Error('No tenant ID');

      const { data: client, error } = await supabase
        .from('locacoes_veicular_clients')
        .update(data)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) throw error;
      return client;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', variables.id] });
      toast.success('Cliente atualizado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error updating client:', error);
      toast.error('Erro ao atualizar cliente', {
        description: error.message,
      });
    },
  });
};

export const useDeleteClient = () => {
  const { tenantId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!tenantId) throw new Error('No tenant ID');

      const { error } = await supabase
        .from('locacoes_veicular_clients')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente excluído com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error deleting client:', error);
      toast.error('Erro ao excluir cliente', {
        description: error.message,
      });
    },
  });
};

export const useClientContracts = (clientId: string | undefined) => {
  const { tenantId } = useAuth();

  return useQuery({
    queryKey: ['client-contracts', clientId, tenantId],
    queryFn: async () => {
      if (!clientId || !tenantId) throw new Error('Missing required parameters');

      const { data, error } = await supabase
        .from('locacoes_veicular_contracts')
        .select(`
          *,
          vehicle:locacoes_veicular_vehicles(id, brand, model, plate, year)
        `)
        .eq('client_id', clientId)
        .eq('tenant_id', tenantId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!clientId && !!tenantId,
  });
};

export const useClientProposals = (clientId: string | undefined) => {
  const { tenantId } = useAuth();

  return useQuery({
    queryKey: ['client-proposals', clientId, tenantId],
    queryFn: async () => {
      if (!clientId || !tenantId) throw new Error('Missing required parameters');

      const { data, error } = await supabase
        .from('locacoes_veicular_proposals')
        .select(`
          *,
          vehicle:locacoes_veicular_vehicles(id, brand, model, plate, year)
        `)
        .eq('client_id', clientId)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!clientId && !!tenantId,
  });
};

export const useClientPayments = (clientId: string | undefined) => {
  const { tenantId } = useAuth();

  return useQuery({
    queryKey: ['client-payments', clientId, tenantId],
    queryFn: async () => {
      if (!clientId || !tenantId) throw new Error('Missing required parameters');

      const { data, error } = await supabase
        .from('locacoes_veicular_transactions')
        .select('*')
        .eq('client_id', clientId)
        .eq('tenant_id', tenantId)
        .eq('type', 'receita')
        .order('due_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!clientId && !!tenantId,
  });
};
