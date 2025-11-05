import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Contract {
  id: string;
  tenant_id: string;
  client_id: string;
  vehicle_id: string;
  start_date: string;
  end_date: string;
  months: number;
  monthly_value: number;
  valor_total: number;
  status: string;
  payment_method?: string;
  observacoes?: string;
  created_at: string;
  updated_at?: string;
  client?: {
    id: string;
    name: string;
    cpf_cnpj: string;
    phone?: string;
    email?: string;
  };
  vehicle?: {
    id: string;
    brand: string;
    model: string;
    plate: string;
    year: number;
  };
}

export interface ContractFormData {
  client_id: string;
  vehicle_id: string;
  start_date: string;
  months: number;
  monthly_value: number;
  payment_method?: string;
  observacoes?: string;
}

export const useContracts = (status?: string) => {
  const { tenantId } = useAuth();

  return useQuery({
    queryKey: ['contracts', tenantId, status],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant ID');

      let query = supabase
        .from('locacoes_veicular_contracts')
        .select(`
          *,
          client:locacoes_veicular_clients(id, name, cpf_cnpj, phone, email),
          vehicle:locacoes_veicular_vehicles(id, brand, model, plate, year)
        `)
        .eq('tenant_id', tenantId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('start_date', { ascending: false });

      if (error) throw error;
      return data as Contract[];
    },
    enabled: !!tenantId,
  });
};

export const useContract = (contractId: string | undefined) => {
  const { tenantId } = useAuth();

  return useQuery({
    queryKey: ['contract', contractId, tenantId],
    queryFn: async () => {
      if (!contractId || !tenantId) throw new Error('Missing required parameters');

      const { data, error } = await supabase
        .from('locacoes_veicular_contracts')
        .select(`
          *,
          client:locacoes_veicular_clients(id, name, cpf_cnpj, phone, email),
          vehicle:locacoes_veicular_vehicles(id, brand, model, plate, year)
        `)
        .eq('id', contractId)
        .eq('tenant_id', tenantId)
        .single();

      if (error) throw error;
      return data as Contract;
    },
    enabled: !!contractId && !!tenantId,
  });
};

export const useCreateContract = () => {
  const { tenantId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ContractFormData) => {
      if (!tenantId) throw new Error('No tenant ID');

      const { data: result, error } = await supabase.rpc(
        'locacoes_veicular_contract_create',
        {
          p_client_id: data.client_id,
          p_vehicle_id: data.vehicle_id,
          p_start_date: data.start_date,
          p_months: data.months,
          p_monthly_value: data.monthly_value,
        }
      );

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['available-vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Contrato criado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error creating contract:', error);
      toast.error('Erro ao criar contrato', {
        description: error.message,
      });
    },
  });
};

export const useUpdateContractStatus = () => {
  const { tenantId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (!tenantId) throw new Error('No tenant ID');

      const { data, error } = await supabase
        .from('locacoes_veicular_contracts')
        .update({ status })
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contract', variables.id] });
      toast.success('Status do contrato atualizado!');
    },
    onError: (error: Error) => {
      console.error('Error updating contract status:', error);
      toast.error('Erro ao atualizar status', {
        description: error.message,
      });
    },
  });
};

export const useContractInstallments = (contractId: string | undefined) => {
  const { tenantId } = useAuth();

  return useQuery({
    queryKey: ['contract-installments', contractId, tenantId],
    queryFn: async () => {
      if (!contractId || !tenantId) throw new Error('Missing required parameters');

      const { data, error } = await supabase
        .from('locacoes_veicular_transactions')
        .select('*')
        .eq('contract_id', contractId)
        .eq('tenant_id', tenantId)
        .eq('type', 'receita')
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!contractId && !!tenantId,
  });
};

export const useMarkInstallmentAsPaid = () => {
  const { tenantId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      installmentId, 
      paymentDate, 
      bankAccountId 
    }: { 
      installmentId: string; 
      paymentDate: string; 
      bankAccountId?: string;
    }) => {
      if (!tenantId) throw new Error('No tenant ID');

      const { data, error } = await supabase
        .from('locacoes_veicular_transactions')
        .update({
          status: 'pago',
          payment_date: paymentDate,
          bank_account_id: bankAccountId,
        })
        .eq('id', installmentId)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) throw error;
      
      // Atualizar saldo da conta bancária se fornecida
      if (bankAccountId && data) {
        const { error: bankError } = await supabase.rpc('update_bank_account_balance', {
          p_account_id: bankAccountId,
          p_amount: data.amount,
          p_operation: 'add',
        });
        
        if (bankError) {
          console.error('Error updating bank balance:', bankError);
          // Não lança erro aqui para não desfazer o pagamento
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contract-installments'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
      toast.success('Parcela marcada como paga!');
    },
    onError: (error: Error) => {
      console.error('Error marking installment as paid:', error);
      toast.error('Erro ao marcar parcela como paga', {
        description: error.message,
      });
    },
  });
};

export const useAvailableVehicles = () => {
  const { tenantId } = useAuth();

  return useQuery({
    queryKey: ['available-vehicles', tenantId],
    queryFn: async () => {
      if (!tenantId) throw new Error('No tenant ID');

      const { data, error } = await supabase
        .from('locacoes_veicular_vehicles')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'disponivel')
        .order('brand', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });
};

export const useCancelContract = () => {
  const { tenantId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      contractId, 
      reason 
    }: { 
      contractId: string; 
      reason?: string;
    }) => {
      if (!tenantId) throw new Error('No tenant ID');

      // Atualizar status do contrato
      const { error: contractError } = await supabase
        .from('locacoes_veicular_contracts')
        .update({ 
          status: 'cancelado',
          observacoes: reason || 'Cancelado'
        })
        .eq('id', contractId)
        .eq('tenant_id', tenantId);

      if (contractError) throw contractError;

      // Cancelar parcelas pendentes
      const { error: installmentsError } = await supabase
        .from('locacoes_veicular_transactions')
        .update({ status: 'cancelado' })
        .eq('contract_id', contractId)
        .eq('status', 'pendente');

      if (installmentsError) throw installmentsError;

      // Liberar veículo
      const { data: contract } = await supabase
        .from('locacoes_veicular_contracts')
        .select('vehicle_id')
        .eq('id', contractId)
        .single();

      if (contract?.vehicle_id) {
        await supabase
          .from('locacoes_veicular_vehicles')
          .update({ status: 'disponivel' })
          .eq('id', contract.vehicle_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Contrato cancelado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Error canceling contract:', error);
      toast.error('Erro ao cancelar contrato', {
        description: error.message,
      });
    },
  });
};
