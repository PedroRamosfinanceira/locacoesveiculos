import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Transaction {
  id: string;
  tenant_id: string;
  type: 'income' | 'expense';
  category: string;
  description: string | null;
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  payment_method: string | null;
  bank_account_id: string | null;
  contract_id: string | null;
  client_id: string | null;
  vehicle_id: string | null;
  installment_number: number | null;
  total_installments: number | null;
  reference_month: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BankAccount {
  id: string;
  tenant_id: string;
  name: string;
  bank_name: string | null;
  account_type: 'checking' | 'savings' | 'investment' | 'cash';
  initial_balance: number;
  current_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CashFlowData {
  month_date: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

// Query: Listar transações com filtros
export const useTransactions = (filters?: {
  type?: 'income' | 'expense';
  status?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      let query = supabase
        .from('locacoes_veicular_transactions')
        .select('*')
        .order('due_date', { ascending: false });

      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.startDate) {
        query = query.gte('due_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('due_date', filters.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Transaction[];
    },
  });
};

// Query: Contas a receber (receitas pendentes)
export const useAccountsReceivable = () => {
  return useQuery({
    queryKey: ['accountsReceivable'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locacoes_veicular_transactions')
        .select('*')
        .eq('type', 'income')
        .in('status', ['pending', 'overdue'])
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data as Transaction[];
    },
  });
};

// Query: Contas a pagar (despesas pendentes)
export const useAccountsPayable = () => {
  return useQuery({
    queryKey: ['accountsPayable'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locacoes_veicular_transactions')
        .select('*')
        .eq('type', 'expense')
        .in('status', ['pending', 'overdue'])
        .order('due_date', { ascending: true });

      if (error) throw error;
      return data as Transaction[];
    },
  });
};

// Query: Contas bancárias
export const useBankAccounts = () => {
  return useQuery({
    queryKey: ['bankAccounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locacoes_veicular_bank_accounts')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as BankAccount[];
    },
  });
};

// Query: Fluxo de caixa (últimos 12 meses)
export const useCashFlow = () => {
  return useQuery({
    queryKey: ['cashFlow'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_cash_flow', {
        months: 12
      });

      if (error) throw error;
      return data as CashFlowData[];
    },
  });
};

// Mutation: Criar transação
export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transaction: Partial<Transaction>) => {
      const { data, error } = await supabase
        .from('locacoes_veicular_transactions')
        .insert([transaction])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accountsReceivable'] });
      queryClient.invalidateQueries({ queryKey: ['accountsPayable'] });
      queryClient.invalidateQueries({ queryKey: ['cashFlow'] });
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      toast.success('Transação criada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar transação:', error);
      toast.error('Erro ao criar transação');
    },
  });
};

// Mutation: Marcar como paga
export const useMarkAsPaid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      paid_date, 
      payment_method, 
      bank_account_id 
    }: { 
      id: string; 
      paid_date: string; 
      payment_method?: string;
      bank_account_id?: string;
    }) => {
      const { data, error } = await supabase
        .from('locacoes_veicular_transactions')
        .update({
          status: 'paid',
          paid_date,
          payment_method,
          bank_account_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accountsReceivable'] });
      queryClient.invalidateQueries({ queryKey: ['accountsPayable'] });
      queryClient.invalidateQueries({ queryKey: ['cashFlow'] });
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
      queryClient.invalidateQueries({ queryKey: ['aging'] });
      toast.success('Transação marcada como paga!');
    },
    onError: (error) => {
      console.error('Erro ao marcar como paga:', error);
      toast.error('Erro ao atualizar transação');
    },
  });
};

// Mutation: Criar conta bancária
export const useCreateBankAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (account: Partial<BankAccount>) => {
      const { data, error } = await supabase
        .from('locacoes_veicular_bank_accounts')
        .insert([{
          ...account,
          current_balance: account.initial_balance || 0,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
      toast.success('Conta bancária criada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar conta bancária:', error);
      toast.error('Erro ao criar conta bancária');
    },
  });
};

// Mutation: Atualizar conta bancária
export const useUpdateBankAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BankAccount> & { id: string }) => {
      const { data, error } = await supabase
        .from('locacoes_veicular_bank_accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bankAccounts'] });
      toast.success('Conta bancária atualizada!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar conta bancária:', error);
      toast.error('Erro ao atualizar conta bancária');
    },
  });
};
