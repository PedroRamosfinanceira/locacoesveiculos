import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, FileText, DollarSign, Calendar, User, Car, CreditCard, Ban } from 'lucide-react';
import { useContract, useContractInstallments, useMarkInstallmentAsPaid, useCancelContract, useUpdateContractStatus } from '@/hooks/useContracts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusColors: Record<string, string> = {
  ativo: 'bg-green-500',
  encerrado: 'bg-gray-500',
  cancelado: 'bg-red-500',
  draft: 'bg-yellow-500',
};

const statusLabels: Record<string, string> = {
  ativo: 'Ativo',
  encerrado: 'Encerrado',
  cancelado: 'Cancelado',
  draft: 'Rascunho',
};

export default function ContractDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tenantId } = useAuth();

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [bankAccountId, setBankAccountId] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  const { data: contract, isLoading: loadingContract } = useContract(id);
  const { data: installments, isLoading: loadingInstallments } = useContractInstallments(id);
  const markAsPaidMutation = useMarkInstallmentAsPaid();
  const cancelMutation = useCancelContract();
  const updateStatusMutation = useUpdateContractStatus();

  // Buscar contas bancárias
  const { data: bankAccounts } = useQuery({
    queryKey: ['bank-accounts', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locacoes_veicular_bank_accounts')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!tenantId && paymentDialogOpen,
  });

  const formatCurrency = (value?: number) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
  };

  const handleMarkAsPaid = () => {
    if (!selectedInstallment) return;

    markAsPaidMutation.mutate({
      installmentId: selectedInstallment.id,
      paymentDate,
      bankAccountId: bankAccountId || undefined,
    }, {
      onSuccess: () => {
        setPaymentDialogOpen(false);
        setSelectedInstallment(null);
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setBankAccountId('');
      }
    });
  };

  const handleCancelContract = () => {
    if (!id) return;

    cancelMutation.mutate({
      contractId: id,
      reason: cancelReason,
    }, {
      onSuccess: () => {
        setCancelDialogOpen(false);
        setCancelReason('');
      }
    });
  };

  const handleEndContract = () => {
    if (!id) return;
    if (confirm('Deseja encerrar este contrato? Esta ação não pode ser desfeita.')) {
      updateStatusMutation.mutate({ id, status: 'encerrado' });
    }
  };

  if (loadingContract) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!contract) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 space-y-4">
          <FileText className="h-16 w-16 text-muted-foreground opacity-50" />
          <div className="text-center">
            <h2 className="text-2xl font-semibold">Contrato não encontrado</h2>
            <p className="text-muted-foreground">O contrato solicitado não existe ou foi removido.</p>
          </div>
          <Button onClick={() => navigate('/contracts')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Contratos
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const totalPaid = installments?.filter(i => i.status === 'pago').reduce((sum, i) => sum + (i.amount || 0), 0) || 0;
  const totalPending = installments?.filter(i => i.status === 'pendente').reduce((sum, i) => sum + (i.amount || 0), 0) || 0;
  const paidCount = installments?.filter(i => i.status === 'pago').length || 0;
  const pendingCount = installments?.filter(i => i.status === 'pendente').length || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/contracts')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Contrato #{contract.id.slice(0, 8)}</h1>
              <p className="text-muted-foreground">
                Criado em {formatDate(contract.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={statusColors[contract.status] || 'bg-gray-500'}>
              {statusLabels[contract.status] || contract.status}
            </Badge>
            {contract.status === 'ativo' && (
              <>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleEndContract}
                >
                  Encerrar Contrato
                </Button>
                <Button 
                  variant="destructive"
                  size="sm"
                  onClick={() => setCancelDialogOpen(true)}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Resumo Financeiro */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(contract.valor_total)}</div>
              <p className="text-xs text-muted-foreground">
                {contract.months} parcelas de {formatCurrency(contract.monthly_value)}
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pago</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{formatCurrency(totalPaid)}</div>
              <p className="text-xs text-muted-foreground">
                {paidCount} de {installments?.length || 0} parcelas
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendente</CardTitle>
              <DollarSign className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{formatCurrency(totalPending)}</div>
              <p className="text-xs text-muted-foreground">
                {pendingCount} parcelas
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progresso</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {installments?.length ? Math.round((paidCount / installments.length) * 100) : 0}%
              </div>
              <div className="w-full bg-secondary rounded-full h-2 mt-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${installments?.length ? (paidCount / installments.length) * 100 : 0}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detalhes do Contrato */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="font-medium">{contract.client?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CPF/CNPJ</p>
                <p className="font-medium">{contract.client?.cpf_cnpj}</p>
              </div>
              {contract.client?.phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium">{contract.client.phone}</p>
                </div>
              )}
              {contract.client?.email && (
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{contract.client.email}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Veículo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Modelo</p>
                <p className="font-medium">{contract.vehicle?.brand} {contract.vehicle?.model}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Placa</p>
                <p className="font-medium">{contract.vehicle?.plate}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ano</p>
                <p className="font-medium">{contract.vehicle?.year}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Período</p>
                <p className="font-medium">
                  {formatDate(contract.start_date)} até {formatDate(contract.end_date)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Parcelas */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Parcelas</CardTitle>
            <CardDescription>Histórico de pagamentos do contrato</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingInstallments ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando parcelas...</p>
              </div>
            ) : installments && installments.length > 0 ? (
              <div className="space-y-2">
                {installments.map((installment, index) => (
                  <div 
                    key={installment.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{installment.description}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Venc: {formatDate(installment.due_date)}
                          </span>
                          {installment.payment_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Pago: {formatDate(installment.payment_date)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-lg">{formatCurrency(installment.amount)}</p>
                        <Badge variant={installment.status === 'pago' ? 'default' : installment.status === 'cancelado' ? 'destructive' : 'secondary'}>
                          {installment.status}
                        </Badge>
                      </div>
                      {installment.status === 'pendente' && contract.status === 'ativo' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedInstallment(installment);
                            setPaymentDialogOpen(true);
                          }}
                        >
                          <CreditCard className="mr-2 h-4 w-4" />
                          Marcar como Pago
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhuma parcela encontrada</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Pagamento */}
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Marcar Parcela como Paga</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Parcela</p>
                <p className="font-medium">{selectedInstallment?.description}</p>
                <p className="text-lg font-bold">{formatCurrency(selectedInstallment?.amount)}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_date">Data de Pagamento</Label>
                <Input
                  id="payment_date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank_account">Conta Bancária (opcional)</Label>
                <Select value={bankAccountId} onValueChange={setBankAccountId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma conta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {bankAccounts?.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} - {account.bank}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleMarkAsPaid} disabled={markAsPaidMutation.isPending}>
                {markAsPaidMutation.isPending ? 'Processando...' : 'Confirmar Pagamento'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Cancelamento */}
        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancelar Contrato</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Esta ação irá cancelar todas as parcelas pendentes e liberar o veículo. 
                Tem certeza que deseja continuar?
              </p>
              <div className="space-y-2">
                <Label htmlFor="cancel_reason">Motivo do Cancelamento (opcional)</Label>
                <Input
                  id="cancel_reason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Digite o motivo..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                Voltar
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleCancelContract}
                disabled={cancelMutation.isPending}
              >
                {cancelMutation.isPending ? 'Cancelando...' : 'Confirmar Cancelamento'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
