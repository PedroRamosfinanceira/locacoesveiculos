import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { DollarSign, TrendingUp, TrendingDown, CheckCircle2, Clock } from 'lucide-react';
import { AgingReport } from '@/components/financial/AgingReport';

export default function Financial() {
  const { tenantId, hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('receitas');

  const { data: receitas, isLoading: loadingReceitas } = useQuery({
    queryKey: ['receitas', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locacoes_veicular_transactions')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('type', 'receita')
        .order('due_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  const { data: despesas, isLoading: loadingDespesas } = useQuery({
    queryKey: ['despesas', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locacoes_veicular_transactions')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('type', 'despesa')
        .order('due_date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  const markPaidMutation = useMutation({
    mutationFn: async (transactionId: string) => {
      const { data, error } = await supabase.rpc(
        'locacoes_veicular_transaction_mark_paid',
        {
          p_transaction_id: transactionId,
        }
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receitas'] });
      queryClient.invalidateQueries({ queryKey: ['despesas'] });
      toast.success('Transação marcada como paga');
    },
    onError: (error) => {
      toast.error('Erro ao marcar como pago: ' + error.message);
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pago: 'default',
      pendente: 'secondary',
      atrasado: 'destructive',
    };
    
    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {status}
      </Badge>
    );
  };

  const totalReceitas = receitas?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
  const totalDespesas = despesas?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;
  const receitasPagas = receitas?.filter(r => r.status === 'pago').reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
  const despesasPagas = despesas?.filter(d => d.status === 'pago').reduce((sum, d) => sum + (d.amount || 0), 0) || 0;
  const saldo = receitasPagas - despesasPagas;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Financeiro</h1>
          <p className="text-muted-foreground">Gerencie receitas e despesas</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receitas Pagas</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(receitasPagas)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total: {formatCurrency(totalReceitas)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Despesas Pagas</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(despesasPagas)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Total: {formatCurrency(totalDespesas)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(saldo)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Receitas - Despesas (pagas)
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="receitas">Receitas</TabsTrigger>
            <TabsTrigger value="despesas">Despesas</TabsTrigger>
            <TabsTrigger value="aging">Inadimplência</TabsTrigger>
          </TabsList>

          <TabsContent value="receitas" className="space-y-4">
            {loadingReceitas ? (
              <div className="text-center py-12">Carregando receitas...</div>
            ) : (
              <div className="space-y-2">
                {receitas?.map((receita) => (
                  <Card key={receita.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex-1">
                          <p className="font-medium">{receita.description}</p>
                          <p className="text-sm text-muted-foreground">
                            Vencimento: {formatDate(receita.due_date)}
                            {receita.paid_at && ` • Pago em: ${formatDate(receita.paid_at)}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(receita.amount)}
                          </p>
                          {getStatusBadge(receita.status)}
                        </div>
                      </div>
                      {receita.status === 'pendente' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="ml-4"
                          onClick={() => markPaidMutation.mutate(receita.id)}
                          disabled={markPaidMutation.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Marcar como Pago
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {receitas?.length === 0 && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium">Nenhuma receita encontrada</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="despesas" className="space-y-4">
            {loadingDespesas ? (
              <div className="text-center py-12">Carregando despesas...</div>
            ) : (
              <div className="space-y-2">
                {despesas?.map((despesa) => (
                  <Card key={despesa.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex-1">
                          <p className="font-medium">{despesa.description}</p>
                          <p className="text-sm text-muted-foreground">
                            Vencimento: {formatDate(despesa.due_date)}
                            {despesa.paid_at && ` • Pago em: ${formatDate(despesa.paid_at)}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-600">
                            {formatCurrency(despesa.amount)}
                          </p>
                          {getStatusBadge(despesa.status)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {despesas?.length === 0 && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium">Nenhuma despesa encontrada</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="aging">
            <AgingReport />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
