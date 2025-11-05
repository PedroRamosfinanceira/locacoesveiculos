import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  useAccountsReceivable, 
  useAccountsPayable, 
  useBankAccounts,
  useMarkAsPaid,
  useCreateBankAccount,
} from '@/hooks/useFinancial';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, TrendingUp, TrendingDown, CheckCircle2, Clock, CreditCard, Plus, Building2 } from 'lucide-react';
import { AgingReport } from '@/components/financial/AgingReport';

export default function Financial() {
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('receivable');
  const [isBankDialogOpen, setIsBankDialogOpen] = useState(false);
  const [bankFormData, setBankFormData] = useState({
    name: '',
    bank_name: '',
    account_type: 'checking' as 'checking' | 'savings' | 'investment' | 'cash',
    initial_balance: 0,
  });

  const { data: accountsReceivable, isLoading: loadingReceivable } = useAccountsReceivable();
  const { data: accountsPayable, isLoading: loadingPayable } = useAccountsPayable();
  const { data: bankAccounts, isLoading: loadingBanks } = useBankAccounts();
  const markPaidMutation = useMarkAsPaid();
  const createBankMutation = useCreateBankAccount();

  const handleMarkAsPaid = (transactionId: string) => {
    markPaidMutation.mutate({
      id: transactionId,
      paid_date: new Date().toISOString(),
      payment_method: 'manual',
    });
  };

  const handleCreateBankAccount = (e: React.FormEvent) => {
    e.preventDefault();
    createBankMutation.mutate(bankFormData, {
      onSuccess: () => {
        setIsBankDialogOpen(false);
        setBankFormData({
          name: '',
          bank_name: '',
          account_type: 'checking',
          initial_balance: 0,
        });
      },
    });
  };

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
    const statusConfig = {
      paid: { variant: 'default' as const, label: 'Pago' },
      pending: { variant: 'secondary' as const, label: 'Pendente' },
      overdue: { variant: 'destructive' as const, label: 'Atrasado' },
      cancelled: { variant: 'outline' as const, label: 'Cancelado' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const totalReceivable = accountsReceivable?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;
  const totalPayable = accountsPayable?.reduce((sum, d) => sum + (d.amount || 0), 0) || 0;
  const totalBankBalance = bankAccounts?.reduce((sum, b) => sum + (b.current_balance || 0), 0) || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Financeiro</h1>
            <p className="text-muted-foreground">Gerencie receitas, despesas e contas bancárias</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contas a Receber</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalReceivable)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {accountsReceivable?.length || 0} conta(s) pendente(s)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contas a Pagar</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(totalPayable)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {accountsPayable?.length || 0} conta(s) pendente(s)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo em Contas</CardTitle>
              <CreditCard className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(totalBankBalance)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {bankAccounts?.length || 0} conta(s) bancária(s)
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="receivable">A Receber</TabsTrigger>
            <TabsTrigger value="payable">A Pagar</TabsTrigger>
            <TabsTrigger value="banks">Contas Bancárias</TabsTrigger>
            <TabsTrigger value="aging">Inadimplência</TabsTrigger>
          </TabsList>

          <TabsContent value="receivable" className="space-y-4">
            {loadingReceivable ? (
              <div className="text-center py-12">Carregando contas a receber...</div>
            ) : (
              <div className="space-y-2">
                {accountsReceivable?.map((transaction) => (
                  <Card key={transaction.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex-1">
                          <p className="font-medium">{transaction.description || 'Sem descrição'}</p>
                          <p className="text-sm text-muted-foreground">
                            Vencimento: {formatDate(transaction.due_date)}
                            {transaction.installment_number && transaction.total_installments && 
                              ` • Parcela ${transaction.installment_number}/${transaction.total_installments}`
                            }
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(transaction.amount)}
                          </p>
                          {getStatusBadge(transaction.status)}
                        </div>
                      </div>
                      {transaction.status !== 'paid' && hasPermission('financial_write') && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="ml-4"
                          onClick={() => handleMarkAsPaid(transaction.id)}
                          disabled={markPaidMutation.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Marcar Pago
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {accountsReceivable?.length === 0 && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium">Nenhuma conta a receber</p>
                      <p className="text-sm text-muted-foreground">Todas as receitas estão quitadas!</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="payable" className="space-y-4">
            {loadingPayable ? (
              <div className="text-center py-12">Carregando contas a pagar...</div>
            ) : (
              <div className="space-y-2">
                {accountsPayable?.map((transaction) => (
                  <Card key={transaction.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex-1">
                          <p className="font-medium">{transaction.description || 'Sem descrição'}</p>
                          <p className="text-sm text-muted-foreground">
                            Vencimento: {formatDate(transaction.due_date)}
                            {transaction.category && ` • ${transaction.category}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-600">
                            {formatCurrency(transaction.amount)}
                          </p>
                          {getStatusBadge(transaction.status)}
                        </div>
                      </div>
                      {transaction.status !== 'paid' && hasPermission('financial_write') && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="ml-4"
                          onClick={() => handleMarkAsPaid(transaction.id)}
                          disabled={markPaidMutation.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Marcar Pago
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {accountsPayable?.length === 0 && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium">Nenhuma conta a pagar</p>
                      <p className="text-sm text-muted-foreground">Todas as despesas estão quitadas!</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="banks" className="space-y-4">
            <div className="flex justify-end mb-4">
              <Dialog open={isBankDialogOpen} onOpenChange={setIsBankDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Conta Bancária
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Conta Bancária</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateBankAccount} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nome da Conta *</Label>
                      <Input
                        id="name"
                        value={bankFormData.name}
                        onChange={(e) => setBankFormData({ ...bankFormData, name: e.target.value })}
                        placeholder="Ex: Conta Corrente Principal"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="bank_name">Banco</Label>
                      <Input
                        id="bank_name"
                        value={bankFormData.bank_name}
                        onChange={(e) => setBankFormData({ ...bankFormData, bank_name: e.target.value })}
                        placeholder="Ex: Banco do Brasil"
                      />
                    </div>
                    <div>
                      <Label htmlFor="account_type">Tipo de Conta *</Label>
                      <Select
                        value={bankFormData.account_type}
                        onValueChange={(value) => 
                          setBankFormData({ ...bankFormData, account_type: value as 'checking' | 'savings' | 'investment' | 'cash' })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="checking">Conta Corrente</SelectItem>
                          <SelectItem value="savings">Poupança</SelectItem>
                          <SelectItem value="investment">Investimento</SelectItem>
                          <SelectItem value="cash">Caixa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="initial_balance">Saldo Inicial *</Label>
                      <Input
                        id="initial_balance"
                        type="number"
                        step="0.01"
                        value={bankFormData.initial_balance}
                        onChange={(e) => setBankFormData({ ...bankFormData, initial_balance: parseFloat(e.target.value) || 0 })}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button type="button" variant="outline" onClick={() => setIsBankDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={createBankMutation.isPending}>
                        {createBankMutation.isPending ? 'Criando...' : 'Criar Conta'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {loadingBanks ? (
              <div className="text-center py-12">Carregando contas bancárias...</div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {bankAccounts?.map((account) => (
                  <Card key={account.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div>
                        <CardTitle className="text-base font-medium">{account.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{account.bank_name || 'Sem banco'}</p>
                      </div>
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Tipo:</span>
                          <Badge variant="outline">
                            {account.account_type === 'checking' && 'Corrente'}
                            {account.account_type === 'savings' && 'Poupança'}
                            {account.account_type === 'investment' && 'Investimento'}
                            {account.account_type === 'cash' && 'Caixa'}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="text-sm font-medium">Saldo Atual:</span>
                          <span className={`text-lg font-bold ${account.current_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(account.current_balance)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {bankAccounts?.length === 0 && (
                  <Card className="md:col-span-2">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium mb-2">Nenhuma conta bancária cadastrada</p>
                      <p className="text-sm text-muted-foreground mb-4">Comece criando sua primeira conta</p>
                      <Button onClick={() => setIsBankDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Criar Conta
                      </Button>
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
